import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import ChannelGuide from '@/components/ChannelGuide';
import FlareTask from '@/components/FlareTask';
import SectionEditor from '@/components/SectionEditor';
import SpotQuestions from '@/components/SpotQuestions';
import { liveImage, SOLAR_VIEWS, viewFor, type SolarView } from '@/data/solarViews';
import TapStage from '@/components/TapStage';
import { useStoredUser } from '@/hooks/useStoredUser';
import { fetchAuroraTasksByType, type AuroraTask } from '@/services/auroraService';
import { ANSWERS_WANTED, ARCHIVE_CODES, answerCounts, nextArchiveTasks } from '@/services/archiveTasks';
import { findCandidates, SIZE as FINDER_SIZE } from '@/utils/finder';
import { loadProgressFromGitHub } from '@/services/githubSyncService';
import { doneIds, doneToday, pendingCount, saveAnnotation } from '@/services/submissionQueue';
import {
  buildReview,
  confidenceFor,
  findMarkAt,
  IMAGE_SIZE,
  isOnSun,
  pickSection,
  remainingAfter,
  SECTION_COUNT,
  spreadOrder,
  viewAround,
  type Mark,
  type MarkKind,
  type Section,
} from '@/utils/annotationLogic';
import { getCorrectDateFromUrl } from '@/utils/jsocDateExtractor';
import { addOutline, circlePolygon, outlineFromMask, reshapeMark, simplifyOutline, snapOutline, type Point, type Raster } from '@/utils/outline';

const TAP_OUTLINE_RADIUS = 30;
const AIA_LIMB = 404;

/** Dark features are wanted on the disk; in 304, bright prominences are wanted above the limb. */
function snapPolarity(kind: MarkKind, points: Point[]): 'dark' | 'bright' | undefined {
  if (kind === 'aia_193' || kind === 'aia_211') return 'dark';
  if (kind !== 'aia_304') return undefined;
  const x = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const y = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return Math.hypot(x - IMAGE_SIZE / 2, y - IMAGE_SIZE / 2) > AIA_LIMB ? 'bright' : 'dark';
}

const browseImage = (url: string) => url.replace('https://sdo.gsfc.nasa.gov/assets/img/browse/', '/api/sdo/browse/');

/** The whole picture as grey levels, converted the way Aurora's Python finder (Pillow "L") does. */
function loadGray(src: string): Promise<Float32Array | null> {
  return new Promise(resolve => {
    const image = new Image();
    image.onerror = () => resolve(null);
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = FINDER_SIZE;
        canvas.height = FINDER_SIZE;
        const context = canvas.getContext('2d', { willReadFrequently: true })!;
        context.drawImage(image, 0, 0, FINDER_SIZE, FINDER_SIZE);
        const rgba = context.getImageData(0, 0, FINDER_SIZE, FINDER_SIZE).data;
        const gray = new Float32Array(FINDER_SIZE * FINDER_SIZE);
        for (let i = 0; i < gray.length; i++) gray[i] = (rgba[i * 4] * 19595 + rgba[i * 4 + 1] * 38470 + rgba[i * 4 + 2] * 7471 + 0x8000) >> 16;
        resolve(gray);
      } catch {
        resolve(null);
      }
    };
    image.src = src;
  });
}

const REFILL_BELOW = 3;
const BATCH = 10;

/** Reads one part of the Sun so drawings can snap; drawing still works if this fails. */
function loadRaster(src: string, section: Section): Promise<Raster | null> {
  return new Promise(resolve => {
    const image = new Image();
    image.onerror = () => resolve(null);
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = section.size;
        canvas.height = section.size;
        const context = canvas.getContext('2d', { willReadFrequently: true })!;
        const scale = image.naturalWidth / IMAGE_SIZE;
        context.drawImage(image, section.x * scale, section.y * scale, section.size * scale, section.size * scale, 0, 0, section.size, section.size);
        const rgba = context.getImageData(0, 0, section.size, section.size).data;
        const data = new Uint8Array(section.size * section.size);
        for (let index = 0; index < data.length; index++) {
          data[index] = 0.299 * rgba[index * 4] + 0.587 * rgba[index * 4 + 1] + 0.114 * rgba[index * 4 + 2];
        }
        resolve({ x: section.x, y: section.y, width: section.size, height: section.size, data });
      } catch {
        resolve(null);
      }
    };
    image.src = src;
  });
}

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

function ImageTask({ task, view, onDone, onSkip, onHelp }: { task: AuroraTask; view: SolarView; onDone: () => void; onSkip: () => void; onHelp?: () => void }) {
  const kind = view.kind;
  const copy = view;
  const checking = Boolean(view.learn && Array.isArray(task.candidates));
  const [assignment] = useState(() => (checking ? pickSection(task.candidates!, contributorId(), task.id) : null));
  const section = assignment?.section;
  const [marks, setMarks] = useState<Mark[]>(() => assignment?.items.map(({ mask, ...mark }) => {
    const outline = mask ? outlineFromMask(mask) : undefined;
    return { ...mark, label: null, finder: { x: mark.x, y: mark.y, r: mark.r }, ...(outline ? { outline } : {}) };
  }) ?? []);
  const [history, setHistory] = useState<Mark[][]>([]);
  const [raster, setRaster] = useState<Raster | null>(null);
  const [message, setMessage] = useState('');
  const [describing, setDescribing] = useState<number | null>(checking && marks.length ? 0 : null);
  const [reshaping, setReshaping] = useState<{ index: number; whole: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  const date = getCorrectDateFromUrl(task.url) || task.date;
  const editorImage = browseImage(task.url);
  const area = section && reshaping ? viewAround(marks[reshaping.index], section) : section;
  const areaX = area?.x;
  const areaY = area?.y;
  const areaSize = area?.size;

  useEffect(() => {
    if (areaX === undefined || areaY === undefined || !areaSize) return;
    let active = true;
    setRaster(null);
    void loadRaster(editorImage, { index: 0, x: areaX, y: areaY, size: areaSize }).then(result => { if (active) setRaster(result); });
    return () => { active = false; };
  }, [editorImage, areaX, areaY, areaSize]);

  const finish = (allMarks: Mark[]) => {
    const finalMarks = allMarks.filter(mark => !mark.deleted && !mark.merged);
    const labelled = finalMarks.find(mark => mark.label && mark.label !== 'none');
    saveAnnotation({
      ...(section ? { review: buildReview(allMarks, section) } : {}),
      task_id: task.id,
      serial_number: task.serialNumber,
      image_url: task.url,
      task_type: kind,
      user_label: (labelled?.label ?? 'none') as never,
      // In checking mode, "None of these" is a real answer rather than uncertainty.
      confidence: checking ? 80 : confidenceFor(finalMarks),
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

  const applyDrawing = (points: Point[]) => {
    const outline = raster ? snapOutline(points, raster, snapPolarity(kind, points)) : simplifyOutline(points);
    const result = addOutline(marks, outline);
    setHistory([...history, marks]);
    setMarks(result.marks);
    setMessage(result.joined === null ? 'New outline added.' : `Shape of feature ${result.joined + 1} updated.`);
  };

  const handleEditorTap = (x: number, y: number) => {
    const existing = marks.findIndex(mark => !mark.deleted && !mark.merged && Math.hypot(mark.x - x, mark.y - y) <= Math.max(mark.r, 20));
    if (existing >= 0 && marks[existing].added) {
      setHistory([...history, marks]);
      setMarks(marks.filter((_, index) => index !== existing));
      setMessage('New outline removed.');
    } else if (existing >= 0) {
      setMessage('Draw around this feature to reshape it.');
    } else {
      applyDrawing(circlePolygon(x, y, TAP_OUTLINE_RADIUS));
    }
  };

  const advance = (next: Mark[]) => {
    setMarks(next);
    const remaining = next.findIndex(mark => mark.label === null);
    if (remaining >= 0) setDescribing(remaining);
    else if (checking) setDescribing(null);
    else finish(next);
  };

  const applyReshape = (points: Point[]) => {
    if (!reshaping) return;
    const outline = raster ? snapOutline(points, raster, snapPolarity(kind, points)) : simplifyOutline(points);
    const next = reshapeMark(marks, reshaping.index, outline, reshaping.whole);
    if (!next) {
      setMessage('Your line must touch the highlighted feature.');
      return;
    }
    setHistory([...history, marks]);
    setMarks(next);
    setMessage('');
    setDescribing(reshaping.index);
    setReshaping(null);
  };

  const previousMark = (index: number) => {
    for (let at = index - 1; at >= 0; at--) if (!marks[at].merged) return at;
    return null;
  };

  const answered = marks.filter(mark => mark.label !== null);
  const unanswered = marks.findIndex(mark => mark.label === null);

  if (failed) {
    return (
      <div className="measure py-10">
        <h1 className="text-3xl font-bold">This picture did not load</h1>
        <button type="button" className="btn btn-primary big mt-5" onClick={onSkip}>Show another picture</button>
      </div>
    );
  }

  if (reshaping && area) {
    const { index, whole } = reshaping;
    const prompt = whole ? 'Draw around the whole thing' : 'Draw the correct edge';
    return (
      <Workspace stage={<SectionEditor src={editorImage} section={area} marks={marks} active={index} label={prompt} onDraw={applyReshape} onTap={() => setMessage('Draw a line around it.')} />}>
        <p className="text-haze">Feature {index + 1} is highlighted</p>
        <h1 className="text-4xl font-bold" tabIndex={-1}>{prompt}</h1>
        <p role="status" className="min-h-7 text-lg text-haze">{message || (whole ? 'Start on the highlighted piece. Marks inside your line join it.' : 'A rough line is fine. It will snap to the edge.')}</p>
        {whole && (
          <button type="button" className="btn big" onClick={() => { setReshaping(null); advance(marks.map((mark, position) => (position === index ? { ...mark, label: 'part_of_larger', partOfLarger: true } : mark))); }}>
            I can't see where it ends
          </button>
        )}
        <button type="button" className="btn" onClick={() => { setMessage(''); setReshaping(null); setDescribing(index); }}>Back</button>
      </Workspace>
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
        onEdit={checking ? next => setMarks(marks.map((mark, index) => (index === describing ? { ...next, edited: !mark.added } : mark))) : undefined}
        onDelete={checking ? () => advance(
          marks[describing].added
            ? marks.filter((_, index) => index !== describing)
            : marks.map((mark, index) => (index === describing ? { ...mark, label: 'none', deleted: true } : mark)),
        ) : undefined}
        onRedraw={checking ? () => { setReshaping({ index: describing, whole: false }); setDescribing(null); } : undefined}
        onBack={checking && previousMark(describing) === null ? undefined : () => setDescribing(previousMark(describing))}
        checking={checking}
        section={section}
        onHelp={onHelp}
        onSkip={checking ? onSkip : undefined}
        onFinish={checking && answered.length ? () => finish(answered) : undefined}
        onAnswer={label => {
          if (checking && label === 'part_of_larger') {
            setReshaping({ index: describing, whole: true });
            setDescribing(null);
          } else {
            advance(marks.map((mark, index) => (index === describing ? { ...mark, label } : mark)));
          }
        }}
      />
    );
  }

  if (section) {
    const prompt = view.missed ?? 'Did we miss anything here?';
    return (
      <Workspace stage={<SectionEditor src={editorImage} section={section} marks={marks} label={prompt} onDraw={applyDrawing} onTap={handleEditorTap} />}>
        <p className="text-haze">Part {section.index + 1} of {SECTION_COUNT}</p>
        <h1 className="text-4xl font-bold" tabIndex={-1}>{prompt}</h1>
        <p role="status" className="min-h-7 text-lg text-haze">{message || 'Roughly draw around a feature. The line will snap to its edge.'}</p>
        {unanswered >= 0
          ? <button type="button" className="btn btn-primary big" onClick={() => setDescribing(unanswered)}>Describe the new outline</button>
          : <button type="button" className="btn btn-primary big" onClick={() => finish(marks)}>Nothing else, finish</button>}
        {history.length > 0 && (
          <button type="button" className="btn" onClick={() => { setMarks(history[history.length - 1]); setHistory(history.slice(0, -1)); setMessage('Last change undone.'); }}>Undo</button>
        )}
      </Workspace>
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
  const walk = useRef<{ lastId: string | null; finished: boolean; busy: boolean; skip: (id: string) => boolean }>({ lastId: null, finished: false, busy: false, skip: () => false });

  // Research pictures are worked out from NASA's archive, walking back from the fixed start date.
  const refill = useCallback(async () => {
    const state = walk.current;
    if (state.busy || state.finished) return;
    state.busy = true;
    try {
      const { tasks, finished, cursor } = await nextArchiveTasks(kind, state.lastId, state.skip, BATCH);
      state.finished = finished;
      state.lastId = cursor;
      setQueue(current => [...(current ?? []), ...tasks]);
    } catch {
      // NASA or the network failed; stop here rather than retrying in a loop, and show the empty message.
      state.finished = true;
      setQueue(current => [...(current ?? [])]);
    } finally {
      state.busy = false;
    }
  }, [kind]);

  useEffect(() => {
    if (!archive) return;
    let active = true;
    void Promise.all([answerCounts(kind), loadProgressFromGitHub().catch(() => null)]).then(([counts, progress]) => {
      if (!active) return;
      const done = doneIds();
      walk.current = {
        // Carry on from the last picture this person finished, saved in their solarhub-data repo.
        lastId: progress?.lastCompletedIdsByType[kind] ?? null,
        finished: false,
        busy: false,
        skip: id => done.has(id) || (counts[id] ?? 0) >= ANSWERS_WANTED,
      };
      void refill();
    });
    return () => { active = false; };
  }, [archive, kind, refill]);

  const head = queue?.[0];
  useEffect(() => {
    if (archive && queue && queue.length < REFILL_BELOW) void refill();
  }, [archive, queue, refill]);

  // Each picture gets the finder's suggestions before it is shown; a picture that will not load is dropped.
  useEffect(() => {
    if (!archive || !head || head.candidates) return;
    let active = true;
    void loadGray(browseImage(head.url)).then(gray => {
      if (!active) return;
      setQueue(current => {
        if (!current?.length || current[0].id !== head.id) return current;
        return gray ? [{ ...current[0], candidates: findCandidates(gray, kind) }, ...current.slice(1)] : current.slice(1);
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
  const preparing = archive && (queue === null || (head && !head.candidates) || (!head && !walk.current.finished));

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
      ) : showGuide ? (
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
      ) : task ? (
        <ImageTask
          key={task.id}
          task={task}
          view={view}
          onDone={() => { setSaved('Saved. Thank you!'); nextImage(false); }}
          onSkip={() => { setSaved(''); nextImage(true); }}
          onHelp={view.learn ? () => setShowGuide(true) : undefined}
        />
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
