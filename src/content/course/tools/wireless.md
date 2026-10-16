---
group: "Middleware"
title: "Wireless"
order: 0
summary: "For the installation to work, your sensor prototype needs to send data to your laptop without a cable."
---

This course uses Wi-Fi as the primary wireless medium, via the [ESP32](/tsost/course/tools/esp32/)'s built-in radio.

## Why Wi-Fi?

- Range sufficient for a room or café
- High bandwidth — can send many values per second
- Supported natively by the [ESP32](/tsost/course/tools/esp32/)

## OSC over Wi-Fi

Your microcontroller connects to the local Wi-Fi network and sends UDP packets directly to your laptop's IP address.

See [OSC](/tsost/course/tools/osc/) for setup details.

## Practical tips

- Use a **phone hotspot** — turn on your phone's personal hotspot and connect both your laptop and ESP32 to it
- Do not use eduroam — it blocks device-to-device communication
- Keep your sketch's Wi-Fi credentials in a separate header file — never share them publicly
- If the connection drops, the ESP32 will need to reconnect — build reconnection logic into your sketch

## Power for the installation

For [Assignment 2](/tsost/course/assignments/assignment-2/), your prototype must run untethered. Options:

- **USB power bank** — easiest, widely available, 5V USB-C output
- **LiPo battery** — smaller, requires a charging circuit (some boards like [CodeCell](/tsost/course/tools/codecell/) have one built in)

## Related

- [ESP32](/tsost/course/tools/esp32/)
- [OSC](/tsost/course/tools/osc/)
