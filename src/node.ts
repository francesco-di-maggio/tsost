import type { MqttClient } from "mqtt";

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

type Device = { state: string; path?: string };

const devices = new Map<string, Device>();
let client: MqttClient | null = null;
let ready = false;

const $ = (id: string) => document.getElementById(id)!;
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const deviceTopic = () => `${PREFIX}/5/${id()}`;

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

function setStatus(text: string, state = "") {
  $("node-status-text").textContent = text;
  $("node-status").className = ("label " + state).trim();
}

async function announce(c: MqttClient) {
  ready = false;
  await c.publishAsync(`${deviceTopic()}/$state`, "init", RETAINED);
  await c.publishAsync(`${deviceTopic()}/$description`, JSON.stringify(DESCRIPTION), RETAINED);
  await c.publishAsync(`${deviceTopic()}/page/path`, page(), RETAINED);
  await c.publishAsync(`${deviceTopic()}/$state`, "ready", RETAINED);
  ready = true;
}

function onMessage(topic: string, payload: Buffer) {
  const [, , device, ...rest] = topic.split("/");
  const entry = devices.get(device) ?? { state: "" };
  const key = rest.join("/");
  if (key === "$state") entry.state = String(payload);
  if (key === "page/path") entry.path = String(payload);
  devices.set(device, entry);
  render();
}

async function connect() {
  if (client) return;
  write("tsost-node-on", "1");
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
    client!.subscribe([`${PREFIX}/5/+/$state`, `${PREFIX}/5/+/page/path`]);
    announce(client!);
    setStatus(`${PREFIX}/${id()}`, "ok");
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
  setStatus("offline");
  render();
}

// Online: devices under the prefix whose $state is ready.
function online() {
  return [...devices].filter(([, d]) => d.state === "ready").sort(([a], [b]) => a.localeCompare(b));
}

function row(name: string, note: string, className = "") {
  const el = document.createElement("div");
  el.className = ("device " + className).trim();
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
  $("node-id").textContent = `${PREFIX}/${id()}`;
  $("node-online").textContent = connected ? String(list.length) : "—";
  const rows = list.map(([name, d]) => row(name === id() ? `${name} (this)` : name, d.path ?? "—"));
  if (!rows.length) rows.push(row(connected ? "No devices" : "Not connected", "", "empty"));
  $("node-list").replaceChildren(...rows);
  const button = $("node-connect");
  button.removeAttribute("disabled");
  button.textContent = connected ? "Disconnect" : "Connect";
  button.classList.toggle("on", connected);
  renderHere(connected, list);
}

// Devices on the current page, shown at the end of the page.
function renderHere(connected: boolean, list: [string, Device][]) {
  const here = document.getElementById("node-here");
  if (!here) return;
  const names = list.filter(([, d]) => d.path === page()).map(([name]) => name);
  here.hidden = !connected;
  $("node-here-list").textContent = names.join(", ") || "—";
}

function togglePanel() {
  const panel = $("node-panel");
  panel.hidden = !panel.hidden;
  $("node-status").setAttribute("aria-expanded", String(!panel.hidden));
}

export function start() {
  $("node-status").addEventListener("click", togglePanel);
  $("node-connect").addEventListener("click", () => (client ? disconnect() : connect()));
  document.addEventListener("astro:page-load", () => {
    if (client?.connected && ready) client.publishAsync(`${deviceTopic()}/page/path`, page(), RETAINED);
    render();
  });
  render();
  if (read("tsost-node-on")) connect();
}
