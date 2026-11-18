import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LazySolarScene from '@/components/LazySolarScene';
import { useGitHubAuth } from '@/hooks/useGitHubAuth';
import { getStoredToken } from '@/services/githubAuthService';
import { squashBranch } from '@/services/githubSquash';
import { pendingCount } from '@/services/submissionQueue';

export default function Account({ points, streak }: { points: number; streak: number }) {
  const { user, deviceFlow, beginSignIn, cancel, signOut, connectWithToken } = useGitHubAuth();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const codeLinkRef = useRef<HTMLAnchorElement>(null);
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [tidyStatus, setTidyStatus] = useState('');
  const pending = pendingCount();
  const waiting = deviceFlow.status === 'waiting' ? deviceFlow : null;

  useEffect(() => {
    if (user) headingRef.current?.focus();
  }, [user]);

  useEffect(() => {
    if (waiting) codeLinkRef.current?.focus();
  }, [waiting?.userCode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:items-center">
      <div className="flex flex-col gap-5">
        {user ? (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="text-5xl font-bold">Hello, {user.name ?? user.login}</h1>
            <div className="flex items-center gap-4">
              <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-full" />
              <p className="text-lg">{points} {points === 1 ? 'point' : 'points'}, {streak} day streak</p>
            </div>
            {pending > 0 && <p role="status">Sending {pending === 1 ? 'your picture' : `${pending} pictures`} now.</p>}
            <div className="flex flex-wrap gap-3">
              <Link to="/classify" className="btn btn-primary big">Mark pictures</Link>
              <button type="button" className="btn big" onClick={signOut}>Sign out</button>
            </div>
            <p className="text-haze">
              Your progress is saved in{' '}
              <a className="link" href={`https://github.com/${user.login}/solarhub-data`} target="_blank" rel="noopener noreferrer">
                your solarhub-data repository
              </a>.
            </p>
            <details>
              <summary className="cursor-pointer py-2 font-semibold">Tidy progress history</summary>
              <p className="my-2 text-haze">This combines the history of your solarhub-data repository into one commit. It cannot be undone.</p>
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  setTidyStatus('Working…');
                  const result = await squashBranch({ token: getStoredToken() ?? undefined });
                  setTidyStatus(result.ok ? 'History tidied.' : `Could not tidy history: ${result.error}`);
                }}
              >
                Tidy history
              </button>
              <p role="status" className="mt-2">{tidyStatus}</p>
            </details>
          </>
        ) : waiting ? (
          <>
            <h1 className="text-5xl font-bold">Enter this code on GitHub</h1>
            <p aria-label={`Your code is ${waiting.userCode.split('').join(' ')}`} className="select-all text-6xl font-bold tracking-wider text-sun sm:text-7xl">
              {waiting.userCode}
            </p>
            <a
              ref={codeLinkRef}
              href={waiting.verificationUri}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary big"
              onClick={() => {
                void navigator.clipboard?.writeText(waiting.userCode).then(() => setCopied(true)).catch(() => {});
              }}
            >
              Copy code and open GitHub
            </a>
            <p role="status" className="text-lg">
              {copied ? 'Code copied. ' : ''}This page will continue by itself after you approve.
            </p>
            <button type="button" className="btn self-start" onClick={cancel}>Cancel</button>
          </>
        ) : (
          <>
            <h1 className="text-5xl font-bold md:text-6xl">Send your work to scientists</h1>
            <p className="measure text-lg text-haze">
              Sign in with a free GitHub account so your marks can be saved and credited to you.
            </p>
            {pending > 0 && <p className="font-semibold">{pending === 1 ? 'One picture is' : `${pending} pictures are`} ready to send.</p>}
            <button type="button" className="btn btn-primary big self-start" disabled={deviceFlow.status === 'starting'} onClick={beginSignIn}>
              {deviceFlow.status === 'starting' ? 'Getting your code…' : 'Sign in with GitHub'}
            </button>
            {deviceFlow.status === 'error' && <p role="alert" className="text-flare">{deviceFlow.error}</p>}
            <p className="measure text-haze">
              Your marks become public issues on space-gen/aurora, and SolarHub creates a public solarhub-data repository for your
              progress. The sign-in lets this site write to your public repositories, and it stays in this browser.
            </p>
            <details>
              <summary className="cursor-pointer py-2 font-semibold">Use a personal access token instead</summary>
              <form
                className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end"
                onSubmit={async event => {
                  event.preventDefault();
                  setTokenError('');
                  try {
                    await connectWithToken(token);
                    setToken('');
                  } catch {
                    setTokenError('GitHub did not accept that token. Check it and try again.');
                  }
                }}
              >
                <label className="flex-1">
                  <span className="mb-1 block">Token with public_repo access</span>
                  <input className="field" type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} />
                </label>
                <button className="btn" disabled={!token.trim()}>Connect</button>
              </form>
              {tokenError && <p role="alert" className="mt-2 text-flare">{tokenError}</p>}
            </details>
          </>
        )}
      </div>
      <div className="relative hidden aspect-square md:block">
        <LazySolarScene />
      </div>
    </div>
  );
}
