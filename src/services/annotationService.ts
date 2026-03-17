/**
 * src/services/annotationService.ts
 *
 * Handles annotation submission for the SolarHub citizen-science platform.
 *
 * What happens when a user clicks "Submit":
 *  1. A full Annotation record is built from the form data.
 *  2. It is saved to localStorage immediately (offline-first).
 *  3. It is saved to puter.kv (cloud backup, zero-config via Puter.js).
 *  4. A POST to the GitHub Issues API creates a public issue on space-gen/aurora
 *     using the user's OAuth token obtained via githubAuthService.
 *     The issue body is formatted so aurora's parse_issue_annotation.py
 *     pipeline script can parse it automatically.
 *  5. On any API failure the localStorage + Puter copies are the durable record.
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
  // Sunspot McIntosh-like classes + descriptive aliases
  | 'class_a' | 'class_b' | 'class_c' | 'class_d' | 'class_e' | 'class_f' | 'class_h' | 'quiet_sun' | 'single_spot' | 'spot_cluster' | 'none'
  // Solar flare GOES classes
  | 'x_class' | 'm_class' | 'c_class' | 'b_class' | 'a_class' | 'no_flare' | 'microflare' | 'flare_region'
  // Magnetogram Mount Wilson classes + aliases
  | 'alpha' | 'beta' | 'gamma' | 'beta-gamma' | 'delta' | 'beta-delta' | 'beta-gamma-delta' | 'gamma-delta' | 'quiet' | 'bipolar_region' | 'complex_magnetic'
  // Coronal hole
  | 'polar' | 'equatorial' | 'mid-latitude' | 'transequatorial' | 'calm_region' | 'isolated_hole'
  // Prominence
  | 'quiescent' | 'active' | 'eruptive' | 'intermediate' | 'no_prominence' | 'filament' | 'prominence_loop'
  // Active region structural
  | 'quiet_region' | 'active_group' | 'emerging_flux'
  // CME
  | 'full_halo' | 'partial_halo' | 'normal' | 'narrow' | 'quiet_corona' | 'jet' | 'streamer_blowout' | 'none';

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
  region_radius?: number;
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
// localStorage helpers
// ---------------------------------------------------------------------------

const LOCAL_STORAGE_KEY = 'solarhub_annotations';

export function saveAnnotationLocally(annotation: Annotation): void {
  try {
    const existing = getLocalAnnotations();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...existing, annotation]));
  } catch (err) {
    console.warn('[AnnotationService] localStorage save failed:', err);
  }
}

export function getLocalAnnotations(): Annotation[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Annotation[]) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Puter KV cloud backup
// ---------------------------------------------------------------------------

/**
 * saveToPuterCloud
 *
 * Appends the annotation to the user's Puter KV store as a cloud backup.
 * Puter.js auto-handles authentication; if the user isn't signed into Puter
 * they may see a brief sign-in prompt.  Failures are silently swallowed
 * since the localStorage copy is already the durable record.
 */
async function saveToPuterCloud(annotation: Annotation): Promise<void> {
  try {
    const puter = window.puter;
    if (!puter?.kv) return;

    // Avoid triggering Puter sign-in prompts during normal app usage.
    // Only write if the user is already signed in (Connect page is where sign-in happens).
    const signedIn = await puter.auth?.isSignedIn?.().catch(() => false);
    if (!signedIn) return;

    const raw      = await puter.kv.get('solarhub_annotations') ?? '[]';
    const existing = JSON.parse(raw) as Annotation[];
    await puter.kv.set('solarhub_annotations', JSON.stringify([...existing, annotation]));
  } catch {
    // Non-fatal — Puter cloud is an optional bonus layer
  }
}

// ---------------------------------------------------------------------------
// GitHub Issue body formatter  (aurora parse_issue_annotation.py compatible)
// ---------------------------------------------------------------------------

/**
 * formatIssueBody
 *
 * Produces a Markdown body using `### Heading` sections that aurora's
 * parse_issue_annotation.py splits and extracts automatically.
 */
function formatIssueBody(annotation: Annotation): string {
  return `### Image URL
${annotation.image_url}

### Task Type
${annotation.task_type}

### Scientific Command
${annotation.scientific_command || '_No response_'}

### Record ID
${annotation.task_id}

### Serial Number
${annotation.serial_number}

### Your Label
${annotation.user_label}

### Pixel Coordinates (optional)
${annotation.pixel_coords && annotation.pixel_coords.length > 0 ? annotation.pixel_coords.map(p => (typeof annotation.region_radius === 'number' ? `${p.x},${p.y},${annotation.region_radius}` : `${p.x},${p.y}`)).join(' ; ') : '_No response_'}

### Region Radius (optional)
${typeof annotation.region_radius === 'number' ? annotation.region_radius : '_No response_'}

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
 *  2. Saves locally (offline-first).
 *  3. Saves to Puter cloud KV (zero-config cloud backup).
 *  4. Creates a GitHub Issue on space-gen/aurora using the user's OAuth token.
 *
 * Returns success=false (with a reason) if the user is not signed in or the
 * API call fails — the local + Puter copies are preserved either way.
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

  // ── Local persistence (always, even before network) ──────────────────────
  saveAnnotationLocally(annotation);

  // ── Puter cloud backup (async, non-blocking) ──────────────────────────────
  void saveToPuterCloud(annotation);

  // ── GitHub Issue creation ────────────────────────────────────────────────
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

    // Update the local record with the issue number
    const annotations = getLocalAnnotations();
    const idx = annotations.findIndex(a => a.id === annotation.id);
    if (idx !== -1) {
      annotations[idx].github_issue_number = issueData.number;
      try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(annotations)); } catch { /* non-fatal */ }
    }

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
