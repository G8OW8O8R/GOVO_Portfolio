/**
 * Stills for the Obok case study, all from real footage:
 * - public/projects/obok/shots/*.jpg – four frames of showreel.mp4, one per
 *   "most interesting solution", cropped to 16:10 around what it shows;
 * - public/projects/obok/scenes/*.jpg – the five weather scene posters,
 *   copied from the Obok repo (public/scenes/<id>/poster.jpg) at 1280 px.
 * Needs ffmpeg on PATH. Run after a new showreel or new scenes:
 *   node scripts/build-obok-media.ts [path to the Obok repo, default ../../OH-bok]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const OUT = "public/projects/obok";
const SHOWREEL = `${OUT}/showreel.mp4`;
const repo = process.argv[2] ?? "../../OH-bok";

/** Time in s and a 16:10 crop (x, y, w, h) in the 1920×950 showreel. */
const shots = [
  { id: "weather", t: 5.5, crop: [110, 0, 1520, 950] },
  { id: "live-data", t: 27, crop: [0, 20, 1440, 900] },
  { id: "windows", t: 15.5, crop: [135, 75, 1200, 750] },
  { id: "spotlight", t: 41, crop: [360, 40, 1200, 750] },
] as const;

/** Folder in the Obok repo → file name here (the five scenes of the case study, in order). */
const scenes = [
  ["sunny-lighthouse", "sunny"],
  ["cloudy-lighthouse", "cloudy"],
  ["rain-lighthouse", "rain"],
  ["night-clear", "night-clear"],
  ["night-cloudy", "night-cloudy"],
] as const;

const ffmpeg = (args: string[]) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });

fs.mkdirSync(`${OUT}/shots`, { recursive: true });
for (const { id, t, crop } of shots) {
  const [x, y, w, h] = crop;
  ffmpeg(["-ss", String(t), "-i", SHOWREEL, "-frames:v", "1", "-vf", `crop=${w}:${h}:${x}:${y},scale=1200:-2`, "-q:v", "3", `${OUT}/shots/${id}.jpg`]);
}

fs.mkdirSync(`${OUT}/scenes`, { recursive: true });
for (const [folder, id] of scenes) {
  const src = path.join(repo, "public/scenes", folder, "poster.jpg");
  if (!fs.existsSync(src)) throw new Error(`Missing ${src} – pass the Obok repo path as the first argument.`);
  ffmpeg(["-i", src, "-vf", "scale=1280:-2", "-q:v", "3", `${OUT}/scenes/${id}.jpg`]);
}

console.log(`obok media: ${shots.length} shots, ${scenes.length} scenes in ${OUT}`);
