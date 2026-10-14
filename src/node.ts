import type { MqttClient } from "mqtt";
import { blip, pitch, unlock } from "./sound";

const BROKER = "wss://public.cloud.shiftr.io";
const USERNAME = "public";
const PASSWORD = "public";
const PREFIX = "tsost";
// Homie 5: attributes and the page property are retained, QoS 2.
const RETAINED = { qos: 2, retain: true } as const;
const DESCRIPTION = {
  homie: "5.0",
  name: "TSOST visitor",
  nodes: { page: { name: "Page", properties: { path: { name: "Path", datatype: "string" } } } },
};
const PING_GAP_MS = 300;

export type Device = { state: string; path?: string; rtt?: number };

const devices = new Map<string, Device>();
let client: MqttClient | null = null;
let ready = false;
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

function read(key: string) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {}
}

function page() {
  const path = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : location.pathname;
  return path || "/";
}

async function announce(c: MqttClient) {
  ready = false;
  await c.publishAsync(`${deviceTopic()}/$state`, "init", RETAINED);
  await c.publishAsync(`${deviceTopic()}/$description`, JSON.stringify(DESCRIPTION), RETAINED);
  await c.publishAsync(`${deviceTopic()}/page/path`, page(), RETAINED);
  await c.publishAsync(`${deviceTopic()}/$state`, "ready", RETAINED);
  ready = true;
}

// Ping: every device plays the caller's tone and replies; the caller hears each reply as it arrives.
export function ping() {
  if (!client?.connected) return;
  unlock();
  const now = performance.now();
  if (now - lastPing < PING_GAP_MS) return;
  lastPing = now;
  blip(pitch(id()));
  signal("ping", id());
  client.publish(`${PREFIX}/ping/${id()}`, String(Date.now()));
}

function onPing(from: string, payload: string) {
  if (from === id()) return;
  const now = performance.now();
  if (now - (heard.get(from) ?? 0) < PING_GAP_MS) return;
  heard.set(from, now);
  blip(pitch(from));
  signal("ping", from);
  client?.publish(`${PREFIX}/pong/${from}/${id()}`, payload);
}

function onPong(by: string, payload: string) {
  const sent = Number(payload);
  if (!sent) return;
  blip(pitch(by));
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

function onMessage(topic: string, payload: Buffer) {
  const [, kindOf, device, ...rest] = topic.split("/");
  if (kindOf === "ping") return onPing(device, String(payload));
  if (kindOf === "pong") return onPong(rest[0], String(payload));
  const entry = devices.get(device) ?? { state: "" };
  const key = rest.join("/");
  if (key === "$state") entry.state = String(payload);
  if (key === "page/path") entry.path = String(payload);
  devices.set(device, entry);
  render();
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
  // MQTT.js reconnects by itself; every connection announces the device again.
  client.on("connect", () => {
    client!.subscribe([`${PREFIX}/5/+/$state`, `${PREFIX}/5/+/page/path`, `${PREFIX}/ping/+`, `${PREFIX}/pong/${id()}/+`]);
    announce(client!);
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
  ready = false;
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
  $("node-online").hidden = !connected;
  const button = $("node-connect");
  button.textContent = connected ? "Disconnect" : "Connect";
  button.classList.toggle("on", connected);
  if (connected && client?.connected) setStatus(`${id()} · ${list.length}`, "ok");
  else if (!connected) setStatus("Connect", "off");
  $("header-ping").hidden = !connected;
  $("node-list").replaceChildren(...list.map(([n, d]) => row(n === id() ? `${n} (you)` : n, [d.path, d.rtt !== undefined && `${d.rtt} ms`].filter(Boolean).join(" · "))));
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
  // Offline, the header button connects at once with the generated ID; online, it opens the panel.
  $("node-status").addEventListener("click", () => (client ? showPanel(Boolean($("node-panel").hidden)) : connect()));
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
  if (read("tsost-node-on")) connect();
}
