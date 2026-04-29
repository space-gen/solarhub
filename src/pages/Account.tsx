/**
 * src/pages/Account.tsx
 * Renamed from Connect — central account & GitHub auth page.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGitHubAuth } from '@/hooks/useGitHubAuth';
import StarField from '@/components/StarField';
import { squashBranch } from '@/services/githubSquash';
import { getStoredToken } from '@/services/githubAuthService';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-dark rounded-2xl border border-white/10 shadow-glass-lg p-6">
      {children}
    </div>
  );
}

export default function Account() {
  const navigate = useNavigate();

  const {
    user: ghUser,
    loading: ghLoading,
    isConfigured: ghConfigured,
    deviceFlow,
    generateDeviceCode,
    startPolling,
    cancel,
    connectWithToken,
    signOut: ghSignOut,
  } = useGitHubAuth();
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [nusStatus, setNusStatus] = useState<string | null>(null);

  const canGenerate = useMemo(() => {
    if (!ghConfigured) return false;
    if (ghUser) return false;
    return deviceFlow.status === 'idle' || deviceFlow.status === 'error';
  }, [ghConfigured, ghUser, deviceFlow.status]);

  const canPoll = useMemo(() => {
    if (ghUser) return false;
    return deviceFlow.status === 'pending' && Boolean(deviceFlow.device_code);
  }, [ghUser, deviceFlow.status, deviceFlow.device_code]);

  const showCode = deviceFlow.status === 'pending' || deviceFlow.status === 'polling';

  async function copyCode() {
    const code = deviceFlow.user_code;
    if (!code) return;
    try { await navigator.clipboard?.writeText?.(code); } catch { /* ignore */ }
  }

  async function handleTokenConnect() {
    setTokenError(null);
    try {
      await connectWithToken(tokenInput);
      setTokenInput('');
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : 'Failed to connect with token.');
    }
  }

  async function runSquash() {
    setNusStatus(null);
    const token = getStoredToken();
    if (!token) { setNusStatus('No token - sign in first'); return; }
    setNusStatus('running');
    const res = await squashBranch({ token });
    if (res.ok) { setNusStatus(`succeeded ${res.sha.slice(0,7)}`); } else { setNusStatus(`error: ${res.error}`); }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 cosmic-bg relative">
      <StarField />
      <div className="max-w-3xl mx-auto flex flex-col gap-6 relative z-10">

        <div className="text-center flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-100">Account</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Connect <span className="text-solar-300">GitHub</span> with Device Flow. On first login, the app creates a public repository named <code className="text-slate-300">solarhub-data</code> in your account and stores your progress in <code className="text-slate-300">progress.json</code>.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-bold text-slate-100">1) Connect GitHub</h2>
                  <p className="text-sm text-slate-400">
                    This authorizes issue creation plus writing to your public progress repository. The token stays in local session storage on this browser only.
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-solar-500/15 text-solar-300 border border-solar-500/25">Required</span>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {ghUser ? (
                  <div className="text-sm text-slate-300">
                    Signed in as <span className="font-semibold">{ghUser.login}</span>
                    {ghUser.name ? <span className="text-slate-500"> ({ghUser.name})</span> : null}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Not signed in</div>
                )}

                <div className="flex items-center gap-2">
                  {!ghUser ? (
                    <>
                      <button
                        onClick={generateDeviceCode}
                        disabled={!canGenerate || ghLoading}
                        className="btn-solar px-4 py-2 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {ghLoading && deviceFlow.status === 'starting' ? 'Generating…' : 'Generate device code'}
                      </button>
                      {showCode && (
                        <button
                          onClick={cancel}
                          className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={ghSignOut}
                      className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-bold text-slate-100">2) Create your public progress repo</h2>
                  <p className="text-sm text-slate-400">
                    After GitHub login, SolarHub creates or reuses a public repository named <code className="text-slate-300">solarhub-data</code> in your account. The only tracked file is <code className="text-slate-300">progress.json</code>, updated on every successful submit.
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-white/5 text-slate-300 border border-white/10">Automatic</span>
              </div>

              {!ghConfigured && (
                <div className="mt-4 text-sm text-rose-300">
                  AUTH_CONFIG.clientId is not set. Update <code className="text-slate-200">src/config/endpoints.ts</code>.
                </div>
              )}

              {deviceFlow.status === 'error' && deviceFlow.error && (
                <div className="mt-4 text-sm text-rose-300">
                  {deviceFlow.error}
                </div>
              )}

              {ghUser && (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={ghUser.avatar_url} alt={ghUser.login} className="w-10 h-10 rounded-full ring-1 ring-solar-500/40" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-200">{ghUser.login}</span>
                      <a className="text-xs text-slate-500 hover:text-slate-300" href={ghUser.html_url} target="_blank" rel="noopener noreferrer">
                        View profile
                      </a>
                      <div className="mt-1 flex items-center gap-3">
                        <a className="text-xs text-slate-500 hover:text-slate-300" href={`https://github.com/${ghUser.login}/solarhub-data`} target="_blank" rel="noopener noreferrer">
                          Open progress repo: {ghUser.login}/solarhub-data
                        </a>
                        <button
                          onClick={runSquash}
                          className="ml-2 px-3 py-1 rounded-lg border border-white/10 text-xs text-slate-200 hover:bg-white/5"
                          title="Run squash on your solarhub-data"
                        >
                          Run Squash
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-300 border border-emerald-500/20 bg-emerald-500/10 rounded-full px-3 py-1">
                    Public repo ready
                  </div>
                </div>
              )}

              {showCode && !ghUser && (
                <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">Your code</span>
                      <span className="text-lg font-black tracking-wider text-slate-100">{deviceFlow.user_code ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyCode}
                        className="px-3 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm"
                      >
                        Copy
                      </button>
                      <a
                        href={deviceFlow.verification_uri_complete ?? deviceFlow.verification_uri ?? 'https://github.com/login/device'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm"
                      >
                        Open URL
                      </a>
                    </div>
                  </div>
                  <a
                    href={deviceFlow.verification_uri_complete ?? deviceFlow.verification_uri ?? 'https://github.com/login/device'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-solar-300 px-3 py-1 rounded border border-solar-500/20 hover:bg-white/5 break-all"
                  >
                    {deviceFlow.verification_uri_complete ?? deviceFlow.verification_uri ?? 'https://github.com/login/device'}
                  </a>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <button
                      onClick={startPolling}
                      disabled={!canPoll || ghLoading}
                      className="btn-solar px-4 py-2 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {ghLoading && deviceFlow.status === 'polling' ? 'Connecting…' : 'Start (I entered the code)'}
                    </button>
                    <span className="text-xs text-slate-500">
                      This will poll GitHub until you approve the code or it expires.
                    </span>
                  </div>
                </div>
              )}

              {!ghUser && (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-amber-200">Fallback hack: paste a token</span>
                    <span className="text-xs text-slate-400">
                      If device flow is blocked on GitHub Pages/incognito by proxy or anti-bot checks, use a GitHub token with
                      <code className="text-slate-300 ml-1">public_repo</code>.
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={e => setTokenInput(e.target.value)}
                      placeholder="github_pat_... or ghp_..."
                      className="flex-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-solar-400"
                    />
                    <button
                      onClick={handleTokenConnect}
                      disabled={!tokenInput.trim() || ghLoading}
                      className="px-4 py-2 rounded-xl border border-white/10 text-slate-200 hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Connect with token
                    </button>
                  </div>
                  {tokenError && <div className="mt-2 text-xs text-rose-300">{tokenError}</div>}
                </div>
              )}
            </Card>
          </div>

        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={runSquash} className="btn-solar px-4 py-2 rounded-xl text-sm" title="Run manual squash on your solarhub-data repo">Run Squash (solarhub-data)</button>

          <div className="text-xs text-slate-300">{nusStatus ?? ''}</div>

          <button
            onClick={() => navigate('/classify')}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
          >
            Go to Classify
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
          >
            Back Home
          </button>
        </div>

      </div>
    </div>
  );
}
