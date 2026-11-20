import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ARCHIVE_END, archiveId, directionFor, nearestFrameUrl, nextArchiveTasks, urlFromId, type DayLister } from '../src/services/archiveTasks.ts';

// Frames every two hours: 000000, 020000, 040000 ...
const frames = (date: string, count: number) =>
  Array.from({ length: count }, (_, i) => `${date.replaceAll('-', '')}_${String(i * 2).padStart(2, '0')}0000_1024_0193.jpg`);

test('ids and urls round-trip', () => {
  const id = archiveId('0193', '20261117_110805_1024_0193.jpg')!;
  assert.equal(id, 'aia193-20261117110805');
  assert.equal(urlFromId(id), 'https://sdo.gsfc.nasa.gov/assets/img/browse/2026/11/17/20261117_110805_1024_0193.jpg');
  assert.equal(archiveId('0211', '20261117_110805_1024_0193.jpg'), null);
});

test('walks back from the start date, newest first, every frame', async () => {
  const asked: string[] = [];
  const list: DayLister = async date => { asked.push(date); return frames(date, 2); };
  const { tasks } = await nextArchiveTasks('aia_193', null, () => false, 3, 'back', list);
  assert.deepEqual(asked.slice(0, 2), ['2026-11-20', '2026-11-19']);
  assert.deepEqual(tasks.map(t => t.id), ['aia193-20261120020000', 'aia193-20261120000000', 'aia193-20261119020000']);
});

test('resumes strictly before the saved picture and skips full or done ones', async () => {
  const list: DayLister = async date => frames(date, 3);
  const after = 'aia193-20261119020000';
  const { tasks } = await nextArchiveTasks('aia_193', after, id => id === 'aia193-20261119000000', 2, 'back', list);
  assert.deepEqual(tasks.map(t => t.id), ['aia193-20261118040000', 'aia193-20261118020000']);
});

test('a saved place from another channel is ignored', async () => {
  const list: DayLister = async date => frames(date, 1);
  const { tasks } = await nextArchiveTasks('aia_193', 'aia211-20200101000000', () => false, 1, 'back', list);
  assert.equal(tasks[0].id, 'aia193-20261120000000');
});

test('stops at the archive end', async () => {
  const list: DayLister = async date => frames(date, 1);
  const { tasks, finished } = await nextArchiveTasks('aia_193', 'aia193-20161002000000', () => false, 5, 'back', list);
  assert.deepEqual(tasks.map(t => t.date), ['2016-10-01']);
  assert.equal(finished, true);
  assert.equal(ARCHIVE_END, '2016-10-01');
});

test('a batch of empty days still moves the saved place back', async () => {
  const list: DayLister = async () => [];
  const { tasks, cursor } = await nextArchiveTasks('aia_193', null, () => false, 5, 'back', list);
  assert.equal(tasks.length, 0);
  assert.ok(cursor && cursor < 'aia193-20261001000000', cursor ?? '');
});

test('walking forward starts at the archive end and resumes after the saved picture', async () => {
  const list: DayLister = async date => frames(date, 2);
  const first = await nextArchiveTasks('aia_193', null, () => false, 3, 'forward', list);
  assert.deepEqual(first.tasks.map(t => t.id), ['aia193-20161001000000', 'aia193-20161001020000', 'aia193-20161002000000']);
  const next = await nextArchiveTasks('aia_193', first.cursor, () => false, 1, 'forward', list);
  assert.equal(next.tasks[0].id, 'aia193-20161002020000');
});

test('the coin toss is stable per person and splits people about evenly', () => {
  assert.equal(directionFor('Ana'), directionFor('ana'));
  const back = Array.from({ length: 1000 }, (_, i) => directionFor(`user${i}`)).filter(d => d === 'back').length;
  assert.ok(back > 430 && back < 570, String(back));
});

test('the comparison frame is the one nearest in time on the same day', async () => {
  const list: DayLister = async (_date, code) => [`20200304_115000_1024_${code}.jpg`, `20200304_120400_1024_${code}.jpg`];
  assert.equal(await nearestFrameUrl('aia193-20200304120100', '0304', list), 'https://sdo.gsfc.nasa.gov/assets/img/browse/2020/03/04/20200304_120400_1024_0304.jpg');
});

test('daily sampling takes the frame nearest noon; windows group 3-hour movies', async () => {
  const list: DayLister = async date => frames(date, 12);
  const daily = await nextArchiveTasks('aia_193', null, () => false, 2, 'back', list, 'daily');
  assert.deepEqual(daily.tasks.map(t => t.id), ['aia193-20261120120000', 'aia193-20261119120000']);
  const movies = await nextArchiveTasks('aia_304', null, () => false, 2, 'forward', async date => frames(date, 12).map(n => n.replace('0193', '0304')), 'windows');
  assert.deepEqual(movies.tasks.map(t => [t.id, t.frames?.length]), [['aia304-20161001000000', 2], ['aia304-20161001040000', 1]]);
});
