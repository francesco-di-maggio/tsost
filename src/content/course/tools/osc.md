---
group: "Middleware"
title: "OSC"
order: 0
summary: "OSC (Open Sound Control) is a communication protocol for sending data between devices over a network."
---

It was designed for real-time musical and multimedia applications and has become the standard for connecting sensors, computers, and sound software.

## How it works

OSC sends messages over UDP (a lightweight network protocol). Each message has an **address** (like a URL) and one or more **values**.

Example message:
```
/sensor/proximity 0.73
```

This says: the value at address `/sensor/proximity` is `0.73`.

Your microcontroller sends these messages over Wi-Fi. Your laptop receives them in Max or Plugdata.

## Setup in this course

**On the microcontroller (Arduino):**

- Connect to Wi-Fi
- Send OSC messages to your laptop's IP address on a chosen port (e.g. 9000)

**In Max:**

- Use the `udpreceive` object on port 9000
- Parse the OSC message with `route` or the `o.route` objects from the CNMAT externals

**In Plugdata:**

- Use `netreceive` or the `osc-route` abstraction

## Tips

- Use a phone hotspot — connect both your laptop and ESP32 to it. Do not use eduroam.
- Find your laptop's IP address: System Settings → Network → Wi-Fi → Details
- Use any port number consistently across your sketch and patch — 9000 is a common default

## Related

- [Max](/tsost/course/tools/max/)
- [Plugdata](/tsost/course/tools/plugdata/)
- [ESP32](/tsost/course/tools/esp32/)
