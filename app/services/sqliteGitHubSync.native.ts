import * as FileSystem from 'expo-file-system';

const GITHUB_API = 'https://api.github.com/repos';

type SyncConfig = {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
  token: string;
};

async function githubFetch(url: string, init: RequestInit, token: string): Promise<Response> {
  const bearerHeaders = {
    ...(init.headers ?? {}),
    Authorization: `Bearer ${token}`,
  };
  const bearerRes = await fetch(url, { ...init, headers: bearerHeaders });
  if (bearerRes.status !== 401 && bearerRes.status !== 403) return bearerRes;

  const tokenHeaders = {
    ...(init.headers ?? {}),
    Authorization: `token ${token}`,
  };
  return fetch(url, { ...init, headers: tokenHeaders });
}

async function githubGetFile(config: SyncConfig): Promise<{ sha: string; content: string } | null> {
  const ref = config.branch ? `?ref=${encodeURIComponent(config.branch)}` : '';
  const url = `${GITHUB_API}/${config.owner}/${config.repo}/contents/${config.path}${ref}`;
  const res = await githubFetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  }, config.token);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub download failed: ${res.status}`);
  const json = await res.json() as { sha: string; content: string };
  return { sha: json.sha, content: json.content.replace(/\n/g, '') };
}

async function githubPutFile(config: SyncConfig, base64Content: string, message: string, sha?: string): Promise<void> {
  const url = `${GITHUB_API}/${config.owner}/${config.repo}/contents/${config.path}`;
  const res = await githubFetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: base64Content,
      sha,
      branch: config.branch,
    }),
  }, config.token);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub upload failed: ${res.status} ${text}`);
  }
}

export async function downloadSqliteFromGitHub(config: SyncConfig, localFileUri: string): Promise<boolean> {
  const remote = await githubGetFile(config);
  if (!remote) return false;
  await FileSystem.writeAsStringAsync(localFileUri, remote.content, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return true;
}

export async function uploadSqliteToGitHub(config: SyncConfig, localFileUri: string, commitMessage: string): Promise<void> {
  const base64 = await FileSystem.readAsStringAsync(localFileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const remote = await githubGetFile(config);
  await githubPutFile(config, base64, commitMessage, remote?.sha);
}
