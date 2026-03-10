/**
 * src/services/annotationService.ts
 *
 * Handles the submission and local persistence of user annotations.
 *
 * Annotation lifecycle:
 *  1. User classifies an image in AnnotationPanel and clicks "Submit".
 *  2. submitAnnotation() is called.
 *  3. The annotation is immediately saved to localStorage as a backup.
 *  4. A POST request is made to the GitHub Issues API to create a public,
 *     auditable record on the solarhub-data repository.
 *  5. On network failure the localStorage copy is the durable record.
 *
 * GitHub Issues as annotation storage:
 *  Using GitHub Issues gives us:
 *  - A human-readable, searchable audit trail.
 *  - Automatic timestamps and author metadata.
 *  - A free, reliable backend with no server maintenance.
 *  - The ability to later export via the GitHub API.
 *
 * Authentication:
 *  A personal access token (PAT) can optionally be stored in localStorage
 *  under the key "solarhub_gh_token".  Without a token the API request will
 *  fail with a 401 – the annotation is still preserved locally.
 */

import { GITHUB_CONFIG } from '@/config/endpoints';
import { generateSessionId } from '@/utils/helpers';
import { formatTimestamp } from '@/utils/formatters';

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

/** Valid classification labels that a user can assign to a task. */
export type UserLabel = 'sunspot' | 'solar_flare' | 'coronal_hole';

/**
 * Annotation
 *
 * The full record of a single classification action by a user.
 */
export interface Annotation {
  /** Unique identifier for this annotation (generated client-side) */
  id: string;

  /** ID of the Task that was classified */
  task_id: string;

  /** The user's classification label */
  user_label: UserLabel;

  /**
   * The user's confidence in their classification.
   * Stored as an integer in [0, 100] for readability in the issue body.
   */
  confidence: number;

  /** Optional free-text comment from the user */
  comments: string;

  /** Session ID of the annotating user */
  session_id: string;

  /** ISO timestamp of when the annotation was made */
  timestamp: string;

  /**
   * GitHub issue number returned after successful submission.
   * undefined until the API call succeeds.
   */
  github_issue_number?: number;
}

/** Subset of fields required from the caller to create an annotation */
export type AnnotationInput = Pick<
  Annotation,
  'task_id' | 'user_label' | 'confidence' | 'comments'
>;

/** Result returned by submitAnnotation */
export interface AnnotationResult {
  /** Whether the GitHub API call succeeded */
  success: boolean;
  /** The complete, saved annotation record */
  annotation: Annotation;
  /** GitHub issue URL if creation succeeded */
  issueUrl?: string;
  /** Error message if submission failed */
  error?: string;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const LOCAL_STORAGE_KEY = 'solarhub_annotations';

/**
 * saveAnnotationLocally
 *
 * Serialises an annotation and appends it to the list stored in localStorage.
 * This serves as a durable backup in case the GitHub API call fails or the
 * user is offline.
 *
 * @param annotation - The Annotation record to persist
 */
export function saveAnnotationLocally(annotation: Annotation): void {
  try {
    const existing = getLocalAnnotations();
    const updated  = [...existing, annotation];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    // localStorage can be unavailable in private browsing or when storage is full
    console.warn('[AnnotationService] Could not save annotation locally:', error);
  }
}

/**
 * getLocalAnnotations
 *
 * Retrieves all locally stored annotations.
 * Returns an empty array on any parse error.
 */
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
// GitHub Issue body formatter
// ---------------------------------------------------------------------------

/**
 * formatIssueBody
 *
 * Builds the Markdown body of the GitHub Issue that will be created for each
 * annotation.  The structured format makes it easy to parse programmatically
 * for downstream analysis.
 */
function formatIssueBody(annotation: Annotation): string {
  const confidenceBar = '█'.repeat(Math.round(annotation.confidence / 10))
    + '░'.repeat(10 - Math.round(annotation.confidence / 10));

  return `## SolarHub Annotation

| Field            | Value |
|------------------|-------|
| **Task ID**      | \`${annotation.task_id}\` |
| **Label**        | \`${annotation.user_label}\` |
| **Confidence**   | ${annotation.confidence}% \`${confidenceBar}\` |
| **Session**      | \`${annotation.session_id}\` |
| **Timestamp**    | ${formatTimestamp(annotation.timestamp)} |
| **Annotation ID**| \`${annotation.id}\` |

### Comments
${annotation.comments.trim() || '_No additional comments provided._'}

---
*Submitted via [SolarHub Citizen Science](https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo})*
`;
}

// ---------------------------------------------------------------------------
// GitHub token helper
// ---------------------------------------------------------------------------

/**
 * getGitHubToken
 *
 * Looks up a GitHub personal-access token stored in localStorage.
 * The key "solarhub_gh_token" lets power users supply their own token so
 * annotations are attributed to their GitHub account.
 *
 * Returns null if no token is available.
 */
function getGitHubToken(): string | null {
  try {
    return localStorage.getItem('solarhub_gh_token');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * submitAnnotation
 *
 * The primary submission pipeline:
 *  1. Constructs a full Annotation record from the user's input.
 *  2. Saves it to localStorage immediately (offline-first).
 *  3. Attempts to create a GitHub Issue for the annotation.
 *  4. On success, updates the local record with the issue number and returns.
 *  5. On failure, returns success=false with the error message; the local
 *     copy is preserved for future manual sync.
 *
 * @param input - The user's classification data
 * @returns AnnotationResult
 */
export async function submitAnnotation(input: AnnotationInput): Promise<AnnotationResult> {
  // ── Build the full annotation record ──────────────────────────────────────
  const annotation: Annotation = {
    id:           `ann_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`,
    task_id:      input.task_id,
    user_label:   input.user_label,
    confidence:   input.confidence,
    comments:     input.comments,
    session_id:   generateSessionId(),
    timestamp:    new Date().toISOString(),
  };

  // ── Persist locally first (offline-first strategy) ───────────────────────
  saveAnnotationLocally(annotation);

  // ── Attempt GitHub Issue creation ────────────────────────────────────────
  const token = getGitHubToken();

  if (!token) {
    // Without a token we can't create issues; that's fine – the local record
    // is the source of truth.
    return {
      success: false,
      annotation,
      error:   'No GitHub token found. Annotation saved locally.',
    };
  }

  try {
    const issueTitle = `[Annotation] ${annotation.user_label} – Task ${annotation.task_id}`;
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
        labels: ['annotation', annotation.user_label],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`GitHub API ${response.status}: ${errBody}`);
    }

    const issueData = (await response.json()) as { number: number; html_url: string };

    // ── Update the local record with the GitHub issue number ─────────────
    const annotations       = getLocalAnnotations();
    const targetIndex       = annotations.findIndex(a => a.id === annotation.id);
    if (targetIndex !== -1) {
      annotations[targetIndex].github_issue_number = issueData.number;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(annotations));
      } catch {
        // Non-fatal
      }
    }

    return {
      success:    true,
      annotation: { ...annotation, github_issue_number: issueData.number },
      issueUrl:   issueData.html_url,
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AnnotationService] GitHub submission failed:', message);

    return {
      success:    false,
      annotation,
      error:      message,
    };
  }
}
