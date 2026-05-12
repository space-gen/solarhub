/**
 * src/services/annotationService.ts
 *
 * Handles annotation submission for the SolarHub citizen-science platform.
 *
 * What happens when a user clicks "Submit":
 *  1. A full Annotation record is built from the form data.
 *  2. A POST to the GitHub Issues API creates a public issue on space-gen/aurora
 *     using the user's OAuth token obtained via githubAuthService.
 *     The issue body is formatted so aurora's parse_issue_annotation.py
 *     pipeline script can parse it automatically.
 *  3. On failure, the annotation is not persisted locally; only the daily progress
 *     progress.json store remains responsible for points, streak, and completed IDs.
 *
 * Issue format (matching aurora's parse_issue_annotation.py):
 *   ### Image URL
 *   ### Task Type
 *   ### Record ID
 *   ### Serial Number
 *   ### Your Label
 *   ### Pixel Coordinates (optional)
 *   ### Notes (optional)
 */

import { GITHUB_CONFIG }  from '@/config/endpoints';
import { generateSessionId } from '@/utils/helpers';
import { getStoredToken }    from '@/services/githubAuthService';

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

/** Top-level solar observation categories (must match aurora task_types). */
export type TaskType =
  | 'sunspot'
  | 'solar_flare'
  | 'magnetogram'
  | 'coronal_hole'
  | 'prominence'
  | 'active_region'
  | 'cme';

/**
 * UserLabel — the specific sub-classification within a task type.
 * Valid values mirror aurora's VALID_LABELS dict in parse_issue_annotation.py.
 */
export type UserLabel =
  // Sunspot McIntosh-like classes
  | 'class_a' | 'class_b' | 'class_c' | 'class_d' | 'class_e' | 'class_f' | 'class_h' | 'none'
  // Solar flare GOES classes
  | 'x_class' | 'm_class' | 'c_class' | 'b_class' | 'a_class' | 'none'
  // Magnetogram Mount Wilson classes
  | 'alpha' | 'beta' | 'gamma' | 'beta-gamma' | 'delta' | 'beta-delta' | 'beta-gamma-delta' | 'gamma-delta' | 'none'
  // Coronal hole
  | 'polar' | 'equatorial' | 'mid-latitude' | 'transequatorial' | 'none'
  // Prominence
  | 'quiescent' | 'active' | 'eruptive' | 'intermediate' | 'none'
  // Active region structural
  | 'alpha' | 'beta' | 'gamma' | 'beta-gamma' | 'beta-gamma-delta' | 'none'
  // CME
  | 'full_halo' | 'partial_halo' | 'normal' | 'narrow' | 'none';

/** Fields the caller must supply to create an annotation. */
export interface AnnotationInput {
  task_id:       string;
  serial_number: number;
  image_url:     string;
  task_type:     TaskType;
  user_label:    UserLabel;
  confidence:    number;
  comments:      string;
  pixel_coords?: Array<{ x: number; y: number }>;
  // Per-spot labels parallel to pixel_coords; null means unlabeled for that spot
  pixel_labels?: Array<UserLabel | null>;
  // Per-spot radii in canonical pixels (parallel to pixel_coords). Optional.
  pixel_radii?: Array<number>;
  region_radius?: number; // legacy single radius; prefer pixel_radii
}

/** Full annotation record (AnnotationInput + generated fields). */
export interface Annotation extends AnnotationInput {
  id:                   string;
  session_id:           string;
  timestamp:            string;
  github_issue_number?: number;
  scientific_command?: string;
}

/** Return value of submitAnnotation(). */
export interface AnnotationResult {
  success:    boolean;
  annotation: Annotation;
  issueUrl?:  string;
  error?:     string;
}

// ---------------------------------------------------------------------------
// GitHub Issue body formatter  (aurora parse_issue_annotation.py compatible)
// ---------------------------------------------------------------------------

/**
 * formatIssueBody
 *
 * Produces a Markdown body strictly matching the .github/ISSUE_TEMPLATE/annotate.yml structure.
 * Headers must match the 'label' attributes in the YML form definition.
 */
function formatIssueBody(annotation: Annotation): string {
  // Format: label,x,y,r ; label2,x2,y2,r2
  const formattedLabel = annotation.pixel_coords && annotation.pixel_coords.length > 0
    ? annotation.pixel_coords.map((p, i) => {
        // Use per-spot label if available, otherwise fallback to the user's global selection (or 'none')
        const l = (annotation.pixel_labels && annotation.pixel_labels[i]) 
          ? annotation.pixel_labels[i] 
          : annotation.user_label;
        
        // Ensure a valid label is used; if user somehow submitted without one, default to 'none'
        const labelStr = l || 'none';

        // Use per-spot radius if available, default to 0 if not (though UI defaults to 5)
        const radius = annotation.pixel_radii && typeof annotation.pixel_radii[i] === 'number'
          ? annotation.pixel_radii[i]
          : 0;
          
        return `${labelStr},${p.x},${p.y},${radius}`;
      }).join(' ; ')
    : `${annotation.user_label || 'none'},0,0,0`; // Fallback for no-region tasks if any

  return `### Image URL
${annotation.image_url}

### Task Type
${annotation.task_type}

### Record ID
${annotation.task_id}

### Your Label (label,x,y,r ; label2,x2,y2,r2)
${formattedLabel}

### Confidence Score (0-100)
${annotation.confidence}

### Notes (optional)
${annotation.comments.trim() || '_No response_'}
`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * submitAnnotation
 *
 * Full submission pipeline:
 *  1. Builds the Annotation record.
 *  2. Creates a GitHub Issue on space-gen/aurora using the user's OAuth token.
 *
 * Returns success=false (with a reason) if the user is not signed in or the
 * API call fails.
 */
export async function submitAnnotation(
  input: AnnotationInput,
): Promise<AnnotationResult> {

  // ── Build full record ────────────────────────────────────────────────────
  const annotation: Annotation = {
    ...input,
    id:         `ann_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`,
    session_id: generateSessionId(),
    timestamp:  new Date().toISOString(),
    scientific_command: (() => {
      const coords = input.pixel_coords?.length ? input.pixel_coords.map(c => `${c.x},${c.y}`).join(';') : '';
      return `annotate --task ${input.task_type} --label ${input.user_label}${coords ? ` --coords "${coords}"` : ''}${typeof input.region_radius === 'number' ? ` --radius ${input.region_radius}` : ''}`;
    })(),
  };

  // ── GitHub Issue creation (unchanged) ─────────────────────────────────────
  const token = getStoredToken();

  if (!token) {
    return {
      success:    false,
      annotation,
      error:      'Sign in with GitHub to submit your annotation publicly.',
    };
  }

  try {
    const issueTitle = `[Annotation] ${annotation.task_type} – ${annotation.task_id}`;
    const issueBody  = formatIssueBody(annotation);

    const response = await fetch(GITHUB_CONFIG.issuesApiUrl, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept':        'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        title:  issueTitle,
        body:   issueBody,
        labels: ['annotation'],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`GitHub API ${response.status}: ${errBody}`);
    }

    const issueData = await response.json() as { number: number; html_url: string };

    return {
      success:    true,
      annotation: { ...annotation, github_issue_number: issueData.number },
      issueUrl:   issueData.html_url,
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AnnotationService] GitHub submission failed:', message);
    return { success: false, annotation, error: message };
  }
}
