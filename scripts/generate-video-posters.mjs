import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv']);
const PREFERENCE = ['.mp4', '.m4v', '.webm', '.mov', '.ogv'];

function ffmpegAvailable() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function walkVideos(dir, relBase, byStem) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const rel = path.join(relBase, ent.name);
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkVideos(full, rel, byStem);
      continue;
    }
    const ext = path.extname(ent.name).toLowerCase();
    if (!VIDEO_EXT.has(ext)) continue;
    const stem = path.basename(ent.name, ext);
    const key = path.join(path.dirname(rel), stem).replace(/\\/g, '/');
    const existing = byStem.get(key);
    if (!existing) {
      byStem.set(key, full);
      continue;
    }
    const curPref = PREFERENCE.indexOf(ext);
    const exExt = path.extname(existing).toLowerCase();
    const exPref = PREFERENCE.indexOf(exExt);
    if (curPref !== -1 && (exPref === -1 || curPref < exPref)) {
      byStem.set(key, full);
    }
  }
}

function main() {
  if (!fs.existsSync(publicDir)) {
    return;
  }

  const byStem = new Map();
  walkVideos(publicDir, '', byStem);
  const videos = [...byStem.values()];

  if (videos.length === 0) {
    return;
  }

  if (!ffmpegAvailable()) {
    console.error(
      'generate-video-posters: found video file(s) in public/ but ffmpeg is not installed. Install ffmpeg (brew install ffmpeg / apt install ffmpeg).',
    );
    process.exit(1);
  }

  let generated = 0;
  let skipped = 0;

  for (const videoAbs of videos) {
    const dir = path.dirname(videoAbs);
    const stem = path.basename(videoAbs, path.extname(videoAbs));
    const posterAbs = path.join(dir, `${stem}-poster.jpg`);

    let skip = false;
    try {
      if (fs.existsSync(posterAbs)) {
        const vStat = fs.statSync(videoAbs);
        const pStat = fs.statSync(posterAbs);
        if (pStat.mtimeMs >= vStat.mtimeMs) skip = true;
      }
    } catch {
      skip = false;
    }
    if (skip) {
      skipped += 1;
      continue;
    }

    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        videoAbs,
        '-ss',
        '0.1',
        '-vframes',
        '1',
        '-q:v',
        '3',
        posterAbs,
      ],
      { stdio: 'inherit' },
    );
    generated += 1;
  }

  if (videos.length > 0) {
    console.log(
      `generate-video-posters: ${videos.length} video(s), ${generated} poster(s) written, ${skipped} skipped (up to date).`,
    );
  }
}

main();
