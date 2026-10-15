// Short tones for the node. The context starts on a tap (Connect or Ping), as browsers require.
const SCALE = [0, 2, 4, 7, 9]; // major pentatonic
// Notes are numbered upwards through the scale from C3: 15 notes, three octaves.
export const NOTES = 15;
const FIFTH = 2 ** (7 / 12);
let context: AudioContext | null = null;

export function unlock() {
  context ??= new AudioContext();
  if (context.state === "suspended") context.resume();
}

export function noteHz(note: number) {
  const n = ((note % NOTES) + NOTES) % NOTES;
  const midi = 48 + 12 * Math.floor(n / SCALE.length) + SCALE[n % SCALE.length];
  return 440 * 2 ** ((midi - 69) / 12);
}

// For a device that publishes no note: one pitch from its ID.
export function pitch(id: string) {
  let h = 0x811c9dc5;
  for (const c of id) h = Math.imul(h ^ c.codePointAt(0)!, 0x01000193);
  return noteHz((h >>> 0) % NOTES);
}

export function blip(frequency: number, { at = 0, gain = 0.2, decay = 0.25 } = {}) {
  if (!context) return;
  const t = context.currentTime + at;
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = "triangle";
  osc.frequency.value = frequency;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(gain, t + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.001, t + decay);
  osc.connect(amp).connect(context.destination);
  osc.start(t);
  osc.stop(t + decay + 0.05);
}

// A device arrives: its note, then a fifth up.
export function rise(frequency: number) {
  blip(frequency);
  blip(frequency * FIFTH, { at: 0.12 });
}

// A device leaves: its note, then a fifth down.
export function fall(frequency: number) {
  blip(frequency);
  blip(frequency / FIFTH, { at: 0.12 });
}

// A device drops (its will, "lost"): its note, short and quiet.
export function drop(frequency: number) {
  blip(frequency, { gain: 0.08, decay: 0.12 });
}
