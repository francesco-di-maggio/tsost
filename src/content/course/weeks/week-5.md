---
title: "Week 5"
order: 5
date: 2026-05-26
time: "13:30–17:00"
facts: [["Location", "Neuron 0.356"]]
summary: "Object Pitches + Technical Setup"
---

## In class

- Group presentations of object-centered ethnographies: 
	- Pairs pitch their chosen object and sensor — what did you pick and why?

- Francesco introduces [TESI](/tsost/course/tools/tesi/).

- Technical setup – two steps:
	1. **Upload code**: view, edit, and upload the [Starter Sketch](/tsost/course/resources/starter-sketch/) (or your own code), open the [Serial Monitor](/tsost/course/tools/serial/), confirm values are moving and stable
	2. **Stream data**: confirm data arrives in Max or Plugdata via serial communication, then **go wireless** (connect to Wi-Fi, send [OSC](/tsost/course/tools/osc/) to your laptop)

Troubleshoot together — bring your hardware.

## The setup

Your [ESP32](/tsost/course/tools/esp32/) reads a sensor and sends data to your laptop through [Serial](/tsost/course/tools/serial/) or [Wireless](/tsost/course/tools/wireless/) communication. Sound is generated and designed in [Max](/tsost/course/tools/max/) or [Plugdata](/tsost/course/tools/plugdata/). [Ableton Live](/tsost/course/tools/ableton-live/) is an optional sound-design partner, driven by MIDI or OSC from your patch.

```
ESP32 + sensor → Serial Monitor   (verify, fallback)
ESP32 + sensor → Wi-Fi → OSC → Max / Plugdata → sound
```

## Key tools

- [ESP32](/tsost/course/tools/esp32/) — the microcontroller platform for this course
- [Max](/tsost/course/tools/max/) — visual programming environment for sound and interaction
- [Plugdata](/tsost/course/tools/plugdata/) — free alternative to Max
- [Ableton Live](/tsost/course/tools/ableton-live/) — optional DAW for sound design
- [OSC](/tsost/course/tools/osc/) — sending sensor data to Max/Plugdata
- [Arduino IDE](/tsost/course/tools/arduino-ide/) — programming your microcontroller
- [Starter Sketch](/tsost/course/resources/starter-sketch/) — starting point for your sensor sketch
- [Serial Monitor](/tsost/course/tools/serial/) — verify sensor data before going wireless
- [Wireless](/tsost/course/tools/wireless/) — Wi-Fi setup and practical tips
- [Troubleshooting](/tsost/course/resources/troubleshooting/) — common problems and fixes

## Homework — pairs

Your sensor should be sending data to Max or Plugdata reliably before Week 6:
1. Test your connection at home — does it work outside the classroom?
2. Check the range of your sensor values — minimum, maximum, typical value in use
3. Note any instability or dropout — you will need a stable signal before you can design with it
