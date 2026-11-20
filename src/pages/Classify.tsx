import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import ChannelGuide from '@/components/ChannelGuide';
import EruptionTask from '@/components/EruptionTask';
import FlareTask from '@/components/FlareTask';
import PatchTask from '@/components/PatchTask';
import { liveImage, SOLAR_VIEWS, viewFor, type SolarView } from '@/data/solarViews';
import { useStoredUser } from '@/hooks/useStoredUser';
import { fetchAuroraTasksByType, type AuroraTask } from '@/services/auroraService';
import { ARCHIVE_CODES, directionFor, listDay, nearestFrameUrl, nextArchiveTasks, type Direction } from '@/services/archiveTasks';
import { fetchCatalogue } from '@/services/catalogue';
import { loadProgressFromGitHub } from '@/services/githubSyncService';
import { doneIds, doneToday, pendingCount } from '@/services/submissionQueue';
import { remainingAfter, spreadOrder, type MarkKind } from '@/utils/annotationLogic';

const browseImage = (url: string) => url.replace('https://sdo.gsfc.nasa.gov/assets/img/browse/', '/api/sdo/browse/');

const REFILL_BELOW = 3;
// Each NASA day listing can take seconds, so a batch is about one day's worth: one picture a day, or eight 3-hour movies.
const batchFor = (kind: MarkKind) => (kind === 'aia_304' ? 8 : 2);

function guideSeen(kind: MarkKind) {
  try {
    return localStorage.getItem(`solarhub_guide_${kind}`) === '1';
  } catch {
    return false;
  }
}

function contributorId() {
  try {
    const saved = localStorage.getItem('solarhub_contributor');
    if (saved) return saved;
    const created = crypto.randomUUID();
    localStorage.setItem('solarhub_contributor', created);
    return created;
  } catch {
    return 'guest';
  }
}

function Flow({ view }: { view: SolarView }) {
  const kind = view.kind;
  const user = useStoredUser();
  const topRef = useRef<HTMLDivElement>(null);
  const [queue, setQueue] = useState<AuroraTask[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showGuide, setShowGuide] = useState(() => Boolean(view.learn) && !guideSeen(kind));
  const [saved, setSaved] = useState('');
  const [pending, setPending] = useState(pendingCount);
  const [today, setToday] = useState(doneToday);

  useEffect(() => {
    const sync = () => { setPending(pendingCount()); setToday(doneToday()); };
    window.addEventListener('solarhub:queue-changed', sync);
    return () => window.removeEventListener('solarhub:queue-changed', sync);
  }, []);

  const archive = Boolean(ARCHIVE_CODES[kind]);
  const walk = useRef<{ lastId: string | null; finished: boolean; busy: boolean; skip: (id: string) => boolean; direction: Direction }>({ lastId: null, finished: false, busy: false, skip: () => false, direction: 'back' });

  // Research pictures are worked out from NASA's archive, walking back from the fixed start date.
  const refill = useCallback(async () => {
    const state = walk.current;
    if (state.busy || state.finished) return;
    state.busy = true;
    try {
      const { tasks, finished, cursor } = await nextArchiveTasks(kind, state.lastId, state.skip, batchFor(kind), state.direction, listDay, kind === 'aia_304' ? 'windows' : 'daily');
      // Signing in or out restarts the walk; drop results from the old one.
      if (walk.current !== state) return;
      state.finished = finished;
      state.lastId = cursor;
      setQueue(current => [...(current ?? []), ...tasks]);
    } catch {
      // NASA or the network failed even after retries; say so and let the person try again.
      state.finished = true;
      setLoadFailed(true);
      setQueue(current => [...(current ?? [])]);
    } finally {
      state.busy = false;
    }
  }, [kind]);

  useEffect(() => {
    if (!archive) return;
    let active = true;
    void loadProgressFromGitHub().catch(() => null).then(progress => {
      if (!active) return;
      const done = doneIds();
      setQueue(null);
      walk.current = {
        // Carry on from the last picture this person finished, saved in their solarhub-data repo.
        lastId: progress?.lastCompletedIdsByType[kind] ?? null,
        finished: false,
        busy: false,
        skip: id => done.has(id),
        // Signed-in people get the same direction on every device; guests get one per browser.
        direction: directionFor(user?.login ?? contributorId()),
      };
      void refill();
    });
    return () => { active = false; };
  }, [archive, kind, refill, user?.login]);

  const head = queue?.[0];
  useEffect(() => {
    if (archive && queue && queue.length < REFILL_BELOW) void refill();
  }, [archive, queue, refill]);

  // Each picture gets the finder's suggestions before it is shown; a picture that will not load is dropped.
  useEffect(() => {
    if (!archive || !head || head.candidates) return;
    if (kind === 'aia_304') {
      // Eruption movies need no detector: every quarter of the Sun is shown.
      setQueue(current => (current?.[0]?.id === head.id ? [{ ...current[0], candidates: [] }, ...current.slice(1)] : current));
      return;
    }
    let active = true;
    const stamp = head.id.slice(-14);
    const moment = new Date(`${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(8, 10)}:${stamp.slice(10, 12)}:${stamp.slice(12)}Z`);
    // Only catalogued dark patches are asked about: the pixel finder matched a real feature less than half the time.
    void Promise.all([fetchCatalogue(moment), nearestFrameUrl(head.id, '0304').catch(() => null)]).then(([found, compareUrl]) => {
      if (!active) return;
      if (found === null) {
        // The catalogue did not answer; stop rather than skip through every picture.
        walk.current.finished = true;
        setLoadFailed(true);
        setQueue(current => (current?.[0]?.id === head.id ? current.slice(1) : current));
        return;
      }
      setQueue(current => {
        if (!current?.length || current[0].id !== head.id) return current;
        // A day the catalogue has not reached, or with no dark patch, is passed over.
        if (!found.length) return current.slice(1);
        return [{ ...current[0], candidates: found, ...(compareUrl ? { compareUrl } : {}) }, ...current.slice(1)];
      });
    });
    return () => { active = false; };
  }, [archive, head, kind]);

  useEffect(() => {
    if (archive) return;
    let active = true;
    void Promise.all([fetchAuroraTasksByType(kind), loadProgressFromGitHub().catch(() => null)]).then(([tasks, progress]) => {
      if (!active) return;
      // Older AIA tasks are JP2 files that browsers cannot load from JSOC.
      const usable = (tasks ?? []).filter(task => /\.jpe?g$/i.test(task.url));
      const checkable = usable.filter(task => Array.isArray(task.candidates));
      // AIA images contain too many look-alikes for free marking, so only circled tasks are shown.
      const ordered = spreadOrder(view.learn ? checkable : usable);
      setQueue(remainingAfter(ordered, progress?.lastCompletedIdsByType[kind] ?? null, doneIds()));
    });
    return () => { active = false; };
  }, [archive, kind, view.learn]);

  const nextImage = useCallback((rotate: boolean) => {
    setQueue(current => {
      if (!current?.length) return current;
      return rotate ? [...current.slice(1), current[0]] : current.slice(1);
    });
    window.scrollTo(0, 0);
    requestAnimationFrame(() => topRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }));
  }, []);

  // Not ready until the finder has run, so nobody sees a picture without its suggestions.
  const task = archive && head && !head.candidates ? undefined : head;
  const preparing = archive && !loadFailed && (queue === null || (head && !head.candidates) || (!head && !walk.current.finished));

  return (
    <div ref={topRef} className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav aria-label="Choose a view of the Sun" className="-mx-4 flex w-screen max-w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:max-w-[calc(100%+3rem)] sm:px-6">
          {SOLAR_VIEWS.map(option => (
            <NavLink
              key={option.kind}
              to={`/classify/${option.kind}`}
              title={option.detail}
              className={({ isActive }) => `flex w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-md border p-1 text-center text-xs font-semibold leading-tight ${isActive ? 'border-sun bg-raised text-limb' : 'border-transparent text-haze hover:bg-raised'}`}
            >
              <img src={liveImage(option.code)} alt="" loading="lazy" className="h-11 w-11 rounded-full object-cover" />
              {option.name}
            </NavLink>
          ))}
        </nav>
        <p role="status" className="font-medium">
          {saved && <span className="text-corona">{saved} </span>}
          {today > 0 && <span className="text-haze">{today} done today</span>}
        </p>
        {!user && pending > 0 && (
          <Link to="/account" className="link ml-auto font-semibold">
            Sign in to send your {pending === 1 ? 'picture' : `${pending} pictures`}
          </Link>
        )}
      </div>

      {showGuide ? (
        <ChannelGuide
          view={view}
          onDone={() => {
            try { localStorage.setItem(`solarhub_guide_${kind}`, '1'); } catch { /* storage may be blocked */ }
            setShowGuide(false);
          }}
        />
      ) : queue === null || preparing ? (
        <p role="status" className="py-16 text-lg">Finding pictures…</p>
      ) : task && kind === 'flare_source' ? (
        <FlareTask
          key={task.id}
          task={task}
          onDone={() => { setSaved('Saved. Thank you!'); nextImage(false); }}
          onSkip={() => { setSaved(''); nextImage(true); }}
        />
      ) : task && kind === 'aia_304' ? (
        <EruptionTask
          key={task.id}
          task={task}
          frames={(task.frames ?? [task.url]).map(browseImage)}
          onDone={() => { setSaved('Saved. Thank you!'); nextImage(false); }}
          onSkip={() => { setSaved(''); nextImage(true); }}
          onHelp={() => setShowGuide(true)}
        />
      ) : task ? (
        <PatchTask
          key={task.id}
          task={task}
          src={browseImage(task.url)}
          compareSrc={task.compareUrl ? browseImage(task.compareUrl) : undefined}
          onDone={() => { setSaved('Saved. Thank you!'); nextImage(false); }}
          onSkip={() => { setSaved(''); nextImage(true); }}
          onHelp={() => setShowGuide(true)}
        />
      ) : loadFailed ? (
        <div className="measure py-12">
          <h1 className="text-4xl font-bold" tabIndex={-1}>NASA's picture archive did not answer</h1>
          <p className="mt-4 text-lg text-haze">This usually passes in a minute. Your place is kept.</p>
          <button
            type="button"
            className="btn btn-primary big mt-6"
            onClick={() => { setLoadFailed(false); walk.current.finished = false; void refill(); }}
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="measure py-12">
          <h1 className="text-4xl font-bold" tabIndex={-1}>{kind === 'flare_source' ? 'No unassigned flares right now' : archive ? 'No more pictures in this view right now' : 'You finished every picture here'}</h1>
          <p className="mt-4 text-lg text-haze">Try another view above while this one updates.</p>
        </div>
      )}
    </div>
  );
}

export default function Classify() {
  const { taskType } = useParams<{ taskType?: string }>();
  const view = viewFor(taskType);
  if (!view) return <Navigate to="/classify/aia_193" replace />;
  return <Flow key={view.kind} view={view} />;
}
