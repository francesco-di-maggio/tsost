---
group: "Hardware"
title: "CodeCell"
order: 0
summary: "CodeCell is a compact ESP32-based microcontroller module developed by Microbots."
---

## Why CodeCell

- **Small** — fits inside or under almost any object
- **USB-C** — power and programming over one cable
- **Battery connector** — can run untethered

## Getting started

Follow the official setup guide: [microbots.io/pages/learn-codecell#arduino-setup](https://microbots.io/pages/learn-codecell#arduino-setup)

Key steps:
1. Install [Arduino IDE 2.x](/tsost/course/tools/arduino-ide/)
2. Add ESP32 board support
3. Install the CodeCell library
4. Connect via USB-C and select the correct board and port
5. Upload the basic example sketch to verify it works

## Sending data wirelessly

Once your sensor is working, you will send data to your laptop using [OSC](/tsost/course/tools/osc/).

Basic flow:
1. Read sensor value in your Arduino loop
2. Connect to Wi-Fi
3. Send an OSC message with the sensor value
4. Receive it in [Max](/tsost/course/tools/max/) or [Plugdata](/tsost/course/tools/plugdata/)

## Related

- [Arduino IDE](/tsost/course/tools/arduino-ide/)
- [Sensors](/tsost/course/tools/sensors/)
- [OSC](/tsost/course/tools/osc/)
