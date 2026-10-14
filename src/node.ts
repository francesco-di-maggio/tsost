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

// One ID per tab: two tabs are two nodes.
function id() {
  let value = read("tsost-node-id");
  if (!value) {
    value = `${kind()}-${Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0")}`;
    write("tsost-node-id", value);
  }
  return value;
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
function ping() {
  if (!client?.connected) return;
  unlock();
  const now = performance.now();
  if (now - lastPing < PING_GAP_MS) return;
  lastPing = now;
  blip(pitch(id()));
  client.publish(`${PREFIX}/ping/${id()}`, String(Date.now()));
}

function onPing(from: string, payload: string) {
  if (from === id()) return;
  const now = performance.now();
  if (now - (heard.get(from) ?? 0) < PING_GAP_MS) return;
  heard.set(from, now);
  blip(pitch(from));
  client?.publish(`${PREFIX}/pong/${from}/${id()}`, payload);
}

function onPong(by: string, payload: string) {
  const sent = Number(payload);
  if (!sent) return;
  blip(pitch(by));
  const entry = devices.get(by);
  if (entry) entry.rtt = Date.now() - sent;
  render();
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
  const name = toId(( $("node-name") as HTMLInputElement).value) || id();
  write("tsost-node-id", name);
  write("tsost-node-on", "1");
  unlock();
  setStatus("connecting", "busy");
  $("node-connect").setAttribute("disabled", "");
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
    $("node-connect").removeAttribute("disabled");
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
  if (document.activeElement !== name) name.value = id();
  name.disabled = connected;
  if (connected && client?.connected) setStatus(`${id()} · ${list.length}`, "ok");
  else if (!connected) setStatus("Connect", "off");
  $("node-live").hidden = !connected;
  $("node-list").replaceChildren(...list.map(([n, d]) => row(n === id() ? `${n} (you)` : n, [d.path, d.rtt !== undefined && `${d.rtt} ms`].filter(Boolean).join(" · "))));
  const button = $("node-connect");
  button.removeAttribute("disabled");
  button.textContent = connected ? "Disconnect" : "Connect";
  button.classList.toggle("on", connected);
  renderHere(connected, list);
  (window as unknown as { tsostDevices: unknown }).tsostDevices = { self: id(), list, connected };
  window.dispatchEvent(new CustomEvent("tsost:devices"));
}

// Devices on the current page, shown at the end of the page.
function renderHere(connected: boolean, list: [string, Device][]) {
  const here = document.getElementById("node-here");
  if (!here) return;
  here.hidden = !connected;
  $("node-here-list").textContent = list.filter(([, d]) => d.path === page()).map(([n]) => n).join(", ") || "—";
}

function togglePanel() {
  const panel = $("node-panel");
  panel.hidden = !panel.hidden;
  $("node-status").setAttribute("aria-expanded", String(!panel.hidden));
}

export function start() {
  $("node-status").addEventListener("click", togglePanel);
  $("node-connect").addEventListener("click", () => (client ? disconnect() : connect()));
  $("node-ping").addEventListener("click", ping);
  $("node-name").addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement;
    input.value = toId(input.value) || id();
    write("tsost-node-id", input.value);
  });
  document.addEventListener("astro:page-load", () => {
    if (client?.connected && ready) client.publishAsync(`${deviceTopic()}/page/path`, page(), RETAINED);
    render();
  });
  render();
  if (read("tsost-node-on")) connect();
}
