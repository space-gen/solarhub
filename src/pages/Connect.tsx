/**
 * src/pages/Connect.tsx
 *
 * Dedicated auth page (requested):
 *  1) Sign in with Puter
 *  2) Connect GitHub via Device Flow
 *
 * This keeps auth UX out of the header and makes each step explicit.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePuterAuth } from '@/hooks/usePuterAuth';
import { useGitHubAuth } from '@/hooks/useGitHubAuth';
import { AUTH_CONFIG } from '@/config/endpoints';
import StarField from '@/components/StarField';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-dark rounded-2xl border border-white/10 shadow-glass-lg p-6">
      {children}
    </div>
  );
}

export default function Connect() {
  const navigate = useNavigate();

  const {
    user: puterUser,
    loading: puterLoading,
    signIn: puterSignIn,
    signOut: puterSignOut,
  } = usePuterAuth();

  const {
    user: ghUser,
    loading: ghLoading,
    isConfigured: ghConfigured,
    deviceFlow,
    generateDeviceCode,
    startPolling,
    cancel,
    signOut: ghSignOut,
  } = useGitHubAuth(Boolean(puterUser));

  const canGenerate = useMemo(() => {
    if (!ghConfigured) return false;
    if (!puterUser) return false;
    if (ghUser) return false;
    return deviceFlow.status === 'idle' || deviceFlow.status === 'error';
  }, [ghConfigured, puterUser, ghUser, deviceFlow.status]);

  const canPoll = useMemo(() => {
    if (!puterUser) return false;
    if (ghUser) return false;
    return deviceFlow.status === 'pending' && Boolean(deviceFlow.device_code);
  }, [puterUser, ghUser, deviceFlow.status, deviceFlow.device_code]);

  const showCode = deviceFlow.status === 'pending' || deviceFlow.status === 'polling';

  async function copyCode() {
    const code = deviceFlow.user_code;
    if (!code) return;
    try { await navigator.clipboard?.writeText?.(code); } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 cosmic-bg relative">
      <StarField />
      <div className="max-w-3xl mx-auto flex flex-col gap-6 relative z-10">

        <div className="text-center flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-100">Connect your accounts</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Step 1 signs you into <span className="text-solar-300">Puter</span> so this app can store your GitHub token in <em>your own</em> cloud account.
            Step 2 connects <span className="text-solar-300">GitHub</span> using the official Device Flow.
          </p>
        </div>

        <div className="flex flex-col gap-4">

          {/* Step 1: Puter */}
          <div>
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-bold text-slate-100">1) Sign in with Puter</h2>
                  <p className="text-sm text-slate-400">
                    Used for <code className="text-slate-300">puter.net.fetch</code> (CORS-bypassing calls) and <code className="text-slate-300">puter.kv</code> (store your GitHub token privately).
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-solar-500/15 text-solar-300 border border-solar-500/25">Required</span>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {puterUser ? (
                  <div className="text-sm text-slate-300">
                    Signed in as <span className="font-semibold">{puterUser.username}</span>
                    <span className="text-slate-500"> ({puterUser.uuid})</span>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Not signed in</div>
                )}

                <div className="flex items-center gap-2">
                  {!puterUser ? (
                    <button
                      onClick={puterSignIn}
                      className="btn-solar px-4 py-2 rounded-xl"
                      disabled={puterLoading}
                    >
                      {puterLoading ? 'Signing in…' : 'Sign in to Puter'}
                    </button>
                  ) : (
                    <button
                      onClick={puterSignOut}
                      className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                      disabled={puterLoading}
                    >
                      Sign out
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Step 2: GitHub */}
          <div>
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-bold text-slate-100">2) Connect GitHub (Device Flow)</h2>
                  <p className="text-sm text-slate-400">
                    You will get a short <strong>device code</strong>. Then you manually paste it at{' '}
                    <a className="px-3 py-2 rounded-xl border border-solar-500/20 text-solar-300 hover:bg-white/5 transition-colors inline-block" href="https://github.com/login/device" target="_blank" rel="noopener noreferrer">
                      github.com/login/device
                    </a>.
                    GitHub will ask permission for this app to create issues on your behalf (
                    <code className="text-slate-300">{(AUTH_CONFIG.scopes ?? []).join(' ') || 'public_repo'}</code>).
                    Only after approving, click “Start” below and we’ll poll for your token.
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-white/5 text-slate-300 border border-white/10">Explicit</span>
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

              <div className="mt-4 flex flex-col gap-3">
                {ghUser ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={ghUser.avatar_url} alt={ghUser.login} className="w-10 h-10 rounded-full ring-1 ring-solar-500/40" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-200">{ghUser.login}</span>
                        <a className="text-xs text-slate-500 hover:text-slate-300" href={ghUser.html_url} target="_blank" rel="noopener noreferrer">
                          View profile
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={ghSignOut}
                      className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <button
                        onClick={generateDeviceCode}
                        disabled={!canGenerate || ghLoading}
                        className="btn-solar px-4 py-2 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                        title={!puterUser ? 'Sign in to Puter first' : undefined}
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
                    </div>

                    {showCode && (
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
                  </>
                )}
              </div>
            </Card>
          </div>

        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
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
