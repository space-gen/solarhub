import { ENDPOINTS } from '../config/endpoints'

export interface Annotation {
  task_id: string
  user_label: string
  confidence: number
  comments: string
}

/**
 * Submits an annotation as a GitHub issue to the solarhub-data repository.
 * Requires a valid GitHub personal access token with `repo` scope.
 */
export async function submitAnnotation(
  annotation: Annotation,
  githubToken: string,
): Promise<{ issueUrl: string }> {
  const { task_id, user_label, confidence, comments } = annotation

  const issueBody = `## Solar Classification Annotation

**Task ID:** \`${task_id}\`
**User Label:** \`${user_label}\`
**Confidence:** ${Math.round(confidence * 100)}%
**Comments:** ${comments || '_No comments provided_'}

---
*Submitted via SolarHub citizen-science platform*`

  const response = await fetch(ENDPOINTS.ANNOTATIONS_ISSUE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      title: `[Annotation] Task ${task_id} – ${user_label}`,
      body: issueBody,
      labels: ['annotation', user_label],
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      (error as { message?: string }).message ??
        `Submission failed: ${response.statusText}`,
    )
  }

  const issue = (await response.json()) as { html_url: string }
  return { issueUrl: issue.html_url }
}

/**
 * Saves an annotation locally (localStorage) as a fallback when
 * no GitHub token is available.
 */
export function saveAnnotationLocally(annotation: Annotation): void {
  const stored = localStorage.getItem('solarhub_annotations')
  const existing: Annotation[] = stored ? JSON.parse(stored) : []
  existing.push(annotation)
  localStorage.setItem('solarhub_annotations', JSON.stringify(existing))
}

/** Returns all locally stored annotations. */
export function getLocalAnnotations(): Annotation[] {
  const stored = localStorage.getItem('solarhub_annotations')
  return stored ? JSON.parse(stored) : []
}
