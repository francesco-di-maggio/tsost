---
group: "Middleware"
title: "mqtt-max Remote"
order: 0
---

A web page that turns a phone, tablet or computer into an MQTT device. It sends a touch pad, slider, button, motion and microphone level as Homie values. In Max, [mqtt-max](https://francescodimaggio.nl/mqtt-max/) receives them.

Use it to:
- send live data from your phone to Max, without wiring
- connect to another broker, with its own address, user, password and prefix

Open it: [francescodimaggio.nl/mqtt-max/remote](https://francescodimaggio.nl/mqtt-max/remote/)

A link can carry the settings, so everyone starts the same way. The Remote saves them and clears them from the address bar:

```
https://francescodimaggio.nl/mqtt-max/remote/?broker=wss://public.cloud.shiftr.io&prefix=tsost&inputs=pad,slider
```

| Parameter | Sets |
|---|---|
| `broker` | Broker address (WebSocket) |
| `user`, `password` | Login |
| `prefix` | Topic prefix |
| `id` | Device ID |
| `inputs` | Inputs to send: `pad`, `slider`, `button`, `motion`, `mic`, `round-trip` |

Related: [Max](/tsost/course/tools/max/) · [Wireless](/tsost/course/tools/wireless/)
