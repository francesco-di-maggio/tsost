// Short tones for the node. The context starts on a tap (Connect or Ping), as browsers require.
const SCALE = [0, 2, 4, 7, 9]; // major pentatonic
let context: AudioContext | null = null;

export function unlock() {
  context ??= new AudioContext();
  if (context.state === "suspended") context.resume();
}

// Each device ID maps to one pitch, so a device is recognisable by ear.
export function pitch(id: string) {
  let h = 0x811c9dc5;
  for (const c of id) h = Math.imul(h ^ c.codePointAt(0)!, 0x01000193);
  h >>>= 0;
  const note = 60 + 12 * (h % 2) + SCALE[(h >>> 1) % SCALE.length];
  return 440 * 2 ** ((note - 69) / 12);
}

export function blip(frequency: number) {
  if (!context) return;
  const t = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "triangle";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.2, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(gain).connect(context.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}
