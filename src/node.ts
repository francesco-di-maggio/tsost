import type { MqttClient } from "mqtt";
import type { IPublishPacket } from "mqtt";
import { NOTES, blip, drop, fall, noteHz, pitch, resume, rise, unlock } from "./sound";

const BROKER = "wss://public.cloud.shiftr.io";
const USERNAME = "public";
const PASSWORD = "public";
const PREFIX = "tsost";
// Homie 5: attributes and the page property are retained, QoS 2.
const RETAINED = { qos: 2, retain: true } as const;
const DESCRIPTION = {
  homie: "5.0",
  name: "TSOST visitor",
  nodes: {
    page: { name: "Page", properties: { path: { name: "Path", datatype: "string" } } },
    sound: { name: "Sound", properties: { note: { name: "Note", datatype: "integer" } } },
  },
};
const PING_GAP_MS = 300;
// Retained states arrive this soon after subscribing; the free note is picked after them.
const SETTLE_MS = 300;

export type Device = { state: string; path?: string; rtt?: number; note?: number };

const devices = new Map<string, Device>();
let client: MqttClient | null = null;
let ready = false;
// This device's note: the lowest one not taken by the devices online, kept until Disconnect.
let note: number | null = null;
let lastPing = 0;
const heard = new Map<string, number>();

const $ = (id: string) => document.getElementById(id)!;
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const deviceTopic = () => `${PREFIX}/5/${id()}`;
// Homie topic level IDs: lowercase a-z, 0-9 and hyphens.
const toId = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s/g, "-").replace(/[^a-z0-9-]/g, "");

// One ID per tab: two tabs are two nodes. The generated default is kept, so an emptied field returns to it.
function defaultId() {
  let value = read("tsost-node-default");
  if (!value) {
    value = `${kind()}-${Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0")}`;
    write("tsost-node-default", value);
  }
  return value;
}

function id() {
  return read("tsost-node-id") || defaultId();
}

function kind() {
  if (navigator.maxTouchPoints === 0) return "computer";
  return Math.min(screen.width, screen.height) < 600 ? "phone" : "tablet";
}

// The ID is per tab (sessionStorage); being on is kept across visits (localStorage), so a returning visitor connects at once.
function store(key: string) {
  return key === "tsost-node-on" ? localStorage : sessionStorage;
}

function read(key: string) {
  try { return store(key).getItem(key); } catch { return null; }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) store(key).removeItem(key);
    else store(key).setItem(key, value);
  } catch {}
}

function page() {
  const path = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : location.pathname;
  return path || "/";
}

// Stops when Disconnect is tapped meanwhile, so a closing connection announces nothing more.
async function announce(c: MqttClient) {
  ready = false;
  const messages = [["$state", "init"], ["$description", JSON.stringify(DESCRIPTION)], ["page/path", page()], ["sound/note", String(note)], ["$state", "ready"]];
  for (const [key, value] of messages) {
    if (c !== client) return;
    await c.publishAsync(`${deviceTopic()}/${key}`, value, RETAINED);
  }
  ready = c === client;
}

function freeNote() {
  const taken = new Set(online().filter(([n]) => n !== id()).map(([, d]) => d.note));
  for (let n = 0; n < NOTES; n++) if (!taken.has(n)) return n;
  return online().length % NOTES;
}

function tone(device: string) {
  if (device === id() && note !== null) return noteHz(note);
  const n = devices.get(device)?.note;
  return n === undefined ? pitch(device) : noteHz(n);
}

// Ping: every device plays the caller's tone and replies; the caller hears each reply as it arrives.
export function ping() {
  if (!client?.connected) return;
  const now = performance.now();
  if (now - lastPing < PING_GAP_MS) return;
  lastPing = now;
  client.publish(`${PREFIX}/ping/${id()}`, String(Date.now()));
}

// The caller hears its own ping when it comes back from the broker: the delay is the round trip.
function onPing(from: string, payload: string) {
  if (from === id()) {
    blip(tone(from));
    signal("ping", from);
    return;
  }
  const now = performance.now();
  if (now - (heard.get(from) ?? 0) < PING_GAP_MS) return;
  heard.set(from, now);
  blip(tone(from));
  signal("ping", from);
  client?.publish(`${PREFIX}/pong/${from}/${id()}`, payload);
}

function onPong(by: string, payload: string) {
  const sent = Number(payload);
  if (!sent) return;
  blip(tone(by));
  signal("pong", by);
  const entry = devices.get(by);
  if (entry) entry.rtt = Date.now() - sent;
  render();
}

// Tells views (the Graph) that a device pinged or replied.
function signal(kind: "ping" | "pong", device: string) {
  window.dispatchEvent(new CustomEvent("tsost:signal", { detail: { kind, device } }));
  if (kind === "ping") echo();
}

// The logo ripples once when a ping is sent, on every page. The class is removed afterwards, so navigating does not replay it.
function echo() {
  const mark = document.querySelector<SVGElement>(".mark svg");
  if (!mark) return;
  mark.classList.remove("heard");
  void mark.getBoundingClientRect();
  mark.classList.add("heard");
  mark.addEventListener("animationend", () => mark.classList.remove("heard"), { once: true });
}

function onMessage(topic: string, payload: Buffer, packet: IPublishPacket) {
  const [, kindOf, device, ...rest] = topic.split("/");
  if (kindOf === "ping") return onPing(device, String(payload));
  if (kindOf === "pong") return onPong(rest[0], String(payload));
  const entry = devices.get(device) ?? { state: "" };
  const key = rest.join("/");
  const before = entry.state;
  if (key === "$state") entry.state = String(payload);
  if (key === "page/path") entry.path = String(payload);
  if (key === "sound/note") entry.note = Number(payload);
  devices.set(device, entry);
  if (key !== "$state" || packet.retain) return render();
  // A late will from this tab's previous connection (after a reload, or a tab the phone suspended): this device is still here.
  if (device === id() && entry.state === "lost" && ready) client?.publish(`${deviceTopic()}/$state`, "ready", RETAINED);
  // Others arriving and leaving are heard, and this device when its announced "ready" comes back from the broker; the stored states replayed on subscribing are not.
  if (device !== id() || before === "init") announced(device, before, entry.state);
  render();
}

function announced(device: string, before: string, state: string) {
  if (state === "ready" && before !== "ready") rise(tone(device));
  else if (before === "ready" && state === "disconnected") fall(tone(device));
  else if (before === "ready" && state === "lost") drop(tone(device));
}

function setStatus(text: string, state: string) {
  $("node-status-text").textContent = text;
  $("node-status").className = state;
}

async function connect() {
  if (client) return;
  write("tsost-node-on", "1");
  unlock();
  setStatus("connecting", "busy");
  try {
    const { default: mqtt } = await import("mqtt");
    client = mqtt.connect(BROKER, {
      username: USERNAME,
      password: PASSWORD,
      keepalive: 10,
      will: { topic: `${deviceTopic()}/$state`, payload: "lost", ...RETAINED },
    });
  } catch (err) {
    write("tsost-node-on", null);
    setStatus((err as Error).message, "err");
    return;
  }
  render();
  // MQTT.js reconnects by itself; every connection announces the device again.
  client.on("connect", async () => {
    const c = client!;
    await c.subscribeAsync([`${PREFIX}/5/+/$state`, `${PREFIX}/5/+/page/path`, `${PREFIX}/5/+/sound/note`, `${PREFIX}/ping/+`, `${PREFIX}/pong/${id()}/+`]);
    if (note === null) {
      await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
      note = freeNote();
    }
    if (c !== client) return;
    announce(c);
    render();
  });
  client.on("reconnect", () => {
    ready = false;
    setStatus("reconnecting", "busy");
  });
  client.on("error", (err) => setStatus(err.message, "err"));
  client.on("message", onMessage);
}

async function disconnect() {
  if (!client) return;
  const closing = client;
  client = null;
  if (ready) fall(tone(id()));
  ready = false;
  note = null;
  write("tsost-node-on", null);
  if (closing.connected) await closing.publishAsync(`${deviceTopic()}/$state`, "disconnected", RETAINED).catch(() => {});
  closing.removeAllListeners();
  await closing.endAsync();
  devices.clear();
  render();
}


// Online: devices under the prefix whose $state is ready.
export function online(): [string, Device][] {
  return [...devices].filter(([, d]) => d.state === "ready").sort(([a], [b]) => a.localeCompare(b));
}

function row(name: string, note: string) {
  const el = document.createElement("div");
  el.className = "device";
  const label = document.createElement("span");
  label.textContent = name;
  const value = document.createElement("span");
  value.className = "label";
  value.textContent = note;
  el.append(label, value);
  return el;
}

function render() {
  const connected = Boolean(client);
  const list = online();
  const name = $("node-name") as HTMLInputElement;
  name.placeholder = defaultId();
  if (document.activeElement !== name) name.value = id();
  // As in the mqtt-max Remote: the ID is locked while connected; disconnect to change it.
  name.disabled = connected;
  $("node-locked").hidden = !connected;
  $("node-online").hidden = !connected;
  const button = $("node-connect");
  button.textContent = connected ? "Disconnect" : "Connect";
  button.classList.toggle("on", connected);
  // Online once this device's own "ready" has come back from the broker, with its rise.
  if (connected && client?.connected && devices.get(id())?.state === "ready") setStatus(`${id()} · ${list.length}`, "ok");
  else if (!connected) setStatus("Offline", "off");
  $("header-ping").hidden = !connected;
  $("node-list").replaceChildren(...list.map(([n, d]) => row(n, n === id() ? "this device" : [d.path, d.rtt !== undefined && `${d.rtt} ms`].filter(Boolean).join(" · "))));
  (window as unknown as { tsostDevices: unknown }).tsostDevices = { self: id(), list, connected };
  window.dispatchEvent(new CustomEvent("tsost:devices"));
}

function showPanel(open: boolean) {
  $("node-panel").hidden = !open;
  $("node-status").setAttribute("aria-expanded", String(open));
}

// Closes on a click outside, on Esc, and when a link is followed.
function closeOnOutside(e: Event) {
  const target = e.target as Node;
  if ($("node-panel").hidden || $("node-panel").contains(target) || $("node-status").contains(target)) return;
  showPanel(false);
}

export function start() {
  // The header button shows the state and opens the panel, where Connect and Disconnect are.
  $("node-status").addEventListener("click", () => showPanel(Boolean($("node-panel").hidden)));
  document.addEventListener("pointerdown", closeOnOutside);
  document.addEventListener("keydown", (e) => e.key === "Escape" && showPanel(false));
  document.addEventListener("astro:before-preparation", () => showPanel(false));
  // Disconnect keeps the panel open, offline: the ID can be changed, then Connect again.
  $("node-connect").addEventListener("click", () => (client ? disconnect() : connect()));
  $("header-ping").addEventListener("click", ping);
  $("node-name").addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement;
    const name = toId(input.value) || defaultId();
    write("tsost-node-id", name === defaultId() ? null : name);
    input.value = name;
  });
  document.addEventListener("astro:page-load", () => {
    if (client?.connected && ready) client.publishAsync(`${deviceTopic()}/page/path`, page(), RETAINED);
    render();
  });
  render();
  // Browsers pause audio after a reload without a tap, and phones when the screen locks or the app changes: any tap resumes it.
  addEventListener("pointerup", resume);
  addEventListener("keydown", resume);
  if (read("tsost-node-on")) connect();
}
