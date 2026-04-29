import { getStoredToken, getStoredUser } from './githubAuthService';

type SquashResult = { ok: true; sha: string } | { ok: false; error: string };

async function api<T>(path: string, method = 'GET', token?: string, body?: any): Promise<T> {
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}

export async function squashBranch({ owner, repo, branch = 'main', token, allowRepoOverride = false }: { owner?: string; repo?: string; branch?: string; token?: string; allowRepoOverride?: boolean; }): Promise<SquashResult> {
  try {
    const tkn = token ?? getStoredToken();
    if (!tkn) return { ok: false, error: 'No GitHub token available' };

    // Default to signed-in user's solarhub-data repo when owner/repo not provided
    const storedUser = getStoredUser();
    let targetOwner = owner ?? storedUser?.login;
    const targetRepo = repo ?? 'solarhub-data';

    // Safety guard: prevent accidentally running against the upstream repo
    if (!allowRepoOverride && targetOwner === 'space-gen' && targetRepo === 'solarhub') {
      return { ok: false, error: 'Refusing to run squash against space-gen/solarhub. Use per-user solarhub-data or set allowRepoOverride.' };
    }

    // If we still don't have an owner (e.g., token present but no stored user), fetch the authenticated user from the API
    if (!targetOwner) {
      try {
        const me = await api<any>('/user', 'GET', tkn);
        targetOwner = me.login;
      } catch (err) {
        return { ok: false, error: 'Could not determine repository owner from token. Sign in or provide owner explicitly.' };
      }
    }

    // 1) Get branch ref
    const ref = await api<any>(`/repos/${targetOwner}/${targetRepo}/git/ref/heads/${branch}`, 'GET', tkn);
    const latestSha = ref.object.sha;

    // 2) Get commit to retrieve tree sha
    const commit = await api<any>(`/repos/${targetOwner}/${targetRepo}/git/commits/${latestSha}`, 'GET', tkn);
    const treeSha = commit.tree.sha;

    // 3) Create new commit with same tree but no parents
    const message = `Daily progress snapshot (frontend triggered) @ ${new Date().toISOString()}`;
    const newCommit = await api<any>(`/repos/${targetOwner}/${targetRepo}/git/commits`, 'POST', tkn, {
      message,
      tree: treeSha,
      parents: [],
    });
    const newSha = newCommit.sha;

    // 4) Force-update the branch
    await api<any>(`/repos/${targetOwner}/${targetRepo}/git/refs/heads/${branch}`, 'PATCH', tkn, { sha: newSha, force: true });

    return { ok: true, sha: newSha };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export function shouldAutoRun(): boolean {
  try {
    return localStorage.getItem('solarhub_auto_squash') === '1';
  } catch {
    return false;
  }
}

export function setAutoRun(enabled: boolean): void {
  try {
    localStorage.setItem('solarhub_auto_squash', enabled ? '1' : '0');
  } catch {}
}

export function lastRunDate(): string | null {
  try { return localStorage.getItem('solarhub_auto_squash_last') } catch { return null }
}

export function setLastRunDate(iso: string): void {
  try { localStorage.setItem('solarhub_auto_squash_last', iso) } catch {}
}

export function isSameUTCDate(aIso: string | null, bIso: string | null): boolean {
  if (!aIso || !bIso) return false;
  const a = new Date(aIso);
  const b = new Date(bIso);
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

export default { squashBranch, shouldAutoRun, setAutoRun, lastRunDate, setLastRunDate, isSameUTCDate };
