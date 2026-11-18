import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import SpotQuestions from '@/components/SpotQuestions';
import { liveImage, SOLAR_VIEWS, viewFor, type SolarView } from '@/data/solarViews';
import TapStage from '@/components/TapStage';
import { useStoredUser } from '@/hooks/useStoredUser';
import { fetchAuroraTasksByType, type AuroraTask } from '@/services/auroraService';
import { loadProgressFromGitHub } from '@/services/githubSyncService';
import { doneIds, doneToday, pendingCount, saveAnnotation } from '@/services/submissionQueue';
import {
  confidenceFor,
  findMarkAt,
  isOnSun,
  remainingAfter,
  spreadOrder,
  type Mark,
  type MarkKind,
} from '@/utils/annotationLogic';
import { getCorrectDateFromUrl } from '@/utils/jsocDateExtractor';

const PRACTICE_FOUND: Partial<Record<MarkKind, string>> = {
  sunspot: 'You found both spots.',
  magnetogram: 'You found both patches.',
};

function practiceImage(kind: MarkKind) {
  const body = kind === 'sunspot'
    ? `<circle cx="512" cy="512" r="468" fill="#ffc45e"/><circle cx="360" cy="420" r="30" fill="#c8611f"/><circle cx="360" cy="420" r="14" fill="#21101a"/><circle cx="655" cy="625" r="24" fill="#c8611f"/><circle cx="655" cy="625" r="11" fill="#21101a"/>`
    : `<circle cx="512" cy="512" r="468" fill="#777"/><ellipse cx="350" cy="420" rx="46" ry="38" fill="#000"/><ellipse cx="425" cy="425" rx="42" ry="34" fill="#fff"/><ellipse cx="650" cy="630" rx="48" ry="36" fill="#fff"/>`;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#000"/>${body}</svg>`)}`;
}

const PRACTICE_TARGETS: Partial<Record<MarkKind, Array<[number, number]>>> = {
  sunspot: [[360, 420], [655, 625]],
  magnetogram: [[388, 422], [650, 630]],
};

function practiceDone(kind: MarkKind) {
  if (!PRACTICE_TARGETS[kind]) return true;
  try {
    return localStorage.getItem(`solarhub_practice_${kind}`) === '1';
  } catch {
    return true;
  }
}

function Practice({ view, onDone }: { view: SolarView; onDone: () => void }) {
  const kind = view.kind;
  const copy = view;
  const targets = PRACTICE_TARGETS[kind] ?? [];
  const [marks, setMarks] = useState<Mark[]>([]);
  const [message, setMessage] = useState('');
  const finished = marks.length === targets.length;

  const handleTap = (x: number, y: number) => {
    const target = targets.find(([tx, ty]) => Math.hypot(tx - x, ty - y) < 75);
    if (!target) {
      setMessage(`Not there. Look for a ${copy.thing}.`);
      return;
    }
    if (marks.some(mark => mark.x === target[0] && mark.y === target[1])) return;
    const next = [...marks, { x: target[0], y: target[1], r: copy.radius + 18, label: null }];
    setMarks(next);
    setMessage(next.length === targets.length ? PRACTICE_FOUND[kind] ?? 'You found them.' : 'Yes! Find one more.');
  };

  return (
    <Workspace
      stage={<TapStage src={practiceImage(kind)} alt="Practice picture of the Sun" instruction={copy.prompt} marks={marks} onTap={handleTap} onError={() => {}} />}
    >
      <p className="text-haze">Quick practice</p>
      <h1 className="text-4xl font-bold">{copy.prompt}</h1>
      <p role="status" className="min-h-7 text-lg">{message}</p>
      <button type="button" className={`btn ${finished ? 'btn-primary' : ''} big`} onClick={onDone}>
        {finished ? 'Start the real pictures' : 'Skip practice'}
      </button>
    </Workspace>
  );
}

function Workspace({ stage, children }: { stage: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_23rem] md:items-start">
      <div className="mx-auto w-full max-w-[min(100%,calc(100svh-15rem))] md:max-w-[min(100%,calc(100svh-11rem))]">{stage}</div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function ImageTask({ task, view, onDone, onSkip }: { task: AuroraTask; view: SolarView; onDone: () => void; onSkip: () => void }) {
  const kind = view.kind;
  const copy = view;
  const [marks, setMarks] = useState<Mark[]>([]);
  const [message, setMessage] = useState('');
  const [describing, setDescribing] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const date = getCorrectDateFromUrl(task.url) || task.date;

  const finish = (finalMarks: Mark[]) => {
    const labelled = finalMarks.find(mark => mark.label && mark.label !== 'none');
    saveAnnotation({
      task_id: task.id,
      serial_number: task.serialNumber,
      image_url: task.url,
      task_type: kind,
      user_label: (labelled?.label ?? 'none') as never,
      confidence: confidenceFor(finalMarks),
      comments: '',
      pixel_coords: finalMarks.map(mark => ({ x: Math.round(mark.x), y: Math.round(mark.y) })),
      pixel_labels: finalMarks.map(mark => mark.label as never),
      pixel_radii: finalMarks.map(mark => Math.round(mark.r)),
    });
    onDone();
  };

  const handleTap = (x: number, y: number) => {
    if (!isOnSun(x, y)) {
      setMessage('That is outside the Sun. Tap on the round part.');
      return;
    }
    const existing = findMarkAt(marks, x, y);
    if (existing >= 0) {
      setMarks(marks.filter((_, index) => index !== existing));
      setMessage(`Ring ${existing + 1} removed.`);
      return;
    }
    setMarks([...marks, { x, y, r: copy.radius, label: null }]);
    setMessage(`Ring ${marks.length + 1} added. Tap it again to remove it.`);
  };

  if (failed) {
    return (
      <div className="measure py-10">
        <h1 className="text-3xl font-bold">This picture did not load</h1>
        <button type="button" className="btn btn-primary big mt-5" onClick={onSkip}>Show another picture</button>
      </div>
    );
  }

  if (describing !== null) {
    return (
      <SpotQuestions
        key={describing}
        view={view}
        src={task.url}
        mark={marks[describing]}
        position={describing + 1}
        total={marks.length}
        onResize={r => setMarks(marks.map((mark, index) => (index === describing ? { ...mark, r } : mark)))}
        onBack={() => setDescribing(describing > 0 ? describing - 1 : null)}
        onAnswer={label => {
          const next = marks.map((mark, index) => (index === describing ? { ...mark, label } : mark));
          setMarks(next);
          if (describing + 1 < next.length) setDescribing(describing + 1);
          else finish(next);
        }}
      />
    );
  }

  return (
    <Workspace
      stage={
        <TapStage
          src={task.url}
          alt={`The whole Sun photographed by NASA's Solar Dynamics Observatory${date ? ` on ${date}` : ''}`}
          instruction={copy.prompt}
          marks={marks}
          onTap={handleTap}
          onError={() => setFailed(true)}
        />
      }
    >
      <h1 className="text-4xl font-bold" tabIndex={-1}>{copy.prompt}</h1>
      <p role="status" className="min-h-7 text-lg text-haze">{message || 'Press and slide to use the magnifier.'}</p>
      {marks.length > 0 ? (
        <button type="button" className="btn btn-primary big" onClick={() => setDescribing(0)}>
          Done marking
        </button>
      ) : (
        <button type="button" className="btn big" onClick={() => finish([])}>{copy.none}</button>
      )}
      <button type="button" className="btn" onClick={onSkip}>Show another picture</button>
    </Workspace>
  );
}

function Flow({ view }: { view: SolarView }) {
  const kind = view.kind;
  const user = useStoredUser();
  const topRef = useRef<HTMLDivElement>(null);
  const [queue, setQueue] = useState<AuroraTask[] | null>(null);
  const [practising, setPractising] = useState(() => !practiceDone(kind));
  const [saved, setSaved] = useState('');
  const [pending, setPending] = useState(pendingCount);
  const [today, setToday] = useState(doneToday);

  useEffect(() => {
    const sync = () => { setPending(pendingCount()); setToday(doneToday()); };
    window.addEventListener('solarhub:queue-changed', sync);
    return () => window.removeEventListener('solarhub:queue-changed', sync);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([fetchAuroraTasksByType(kind), loadProgressFromGitHub().catch(() => null)]).then(([tasks, progress]) => {
      if (!active) return;
      // Older AIA tasks are JP2 files that browsers cannot load from JSOC.
      const ordered = spreadOrder((tasks ?? []).filter(task => /\.jpe?g$/i.test(task.url)));
      setQueue(remainingAfter(ordered, progress?.lastCompletedIdsByType[kind] ?? null, doneIds()));
    });
    return () => { active = false; };
  }, [kind]);

  const nextImage = useCallback((rotate: boolean) => {
    setQueue(current => {
      if (!current?.length) return current;
      return rotate ? [...current.slice(1), current[0]] : current.slice(1);
    });
    window.scrollTo(0, 0);
    requestAnimationFrame(() => topRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }));
  }, []);

  const task = queue?.[0];

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

      {practising ? (
        <Practice
          view={view}
          onDone={() => {
            try { localStorage.setItem(`solarhub_practice_${kind}`, '1'); } catch { /* storage may be blocked */ }
            setPractising(false);
          }}
        />
      ) : queue === null ? (
        <p role="status" className="py-16 text-lg">Finding pictures…</p>
      ) : task ? (
        <ImageTask
          key={task.id}
          task={task}
          view={view}
          onDone={() => { setSaved('Saved. Thank you!'); nextImage(false); }}
          onSkip={() => { setSaved(''); nextImage(true); }}
        />
      ) : (
        <div className="measure py-12">
          <h1 className="text-4xl font-bold" tabIndex={-1}>{kind.startsWith('aia_') ? 'New pictures are on the way' : 'You finished every picture here'}</h1>
          <p className="mt-4 text-lg text-haze">Try another color of the Sun above while this one updates.</p>
        </div>
      )}
    </div>
  );
}

export default function Classify() {
  const { taskType } = useParams<{ taskType?: string }>();
  const view = viewFor(taskType);
  if (!view) return <Navigate to="/classify/sunspot" replace />;
  return <Flow key={view.kind} view={view} />;
}
