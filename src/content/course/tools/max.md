---
group: "Software"
title: "Max"
order: 0
action: { label: "Download", title: "Max", caption: "From Cycling '74, with a 30-day free trial.", href: "https://cycling74.com/products/max" }
summary: "Max is a visual programming environment for music, audio, and multimedia, developed by Cycling '74."
---

In Max, you build programs by connecting objects with patch cords — a dataflow approach that is well-suited to real-time audio and sensor work.

## Getting started

- Download and install [Max](https://cycling74.com/products/max)
- A free 30-day trial is available. Student licences are discounted
- Alternatively, use [Plugdata](/tsost/course/tools/plugdata/) — free, open-source

## Key concepts

**Objects** — the building blocks of a Max patch. Each object does one thing: receive a number, generate a tone, scale a value, send an OSC message.

**Patch cords** — connections between objects. Data flows from outlet to inlet. Gray cords are for messages. Green cords for audio. 

**Messages** — the data that flows through cords. Numbers, symbols, lists, bangs.

**Audio vs control rate** — Max distinguishes between audio-rate signals (continuous, 44100 samples/sec) and control-rate messages (discrete events). Both are used in this course.

## Relevant to this course

- Receiving [OSC](/tsost/course/tools/osc/) data from your sensor
- Scaling and mapping sensor values
- Generating and controlling sound output

## Related

- [Plugdata](/tsost/course/tools/plugdata/) — free alternative
- [OSC](/tsost/course/tools/osc/)
- [Mapping](/tsost/course/concepts/mapping/)
- [Sound Design](/tsost/course/concepts/sound-design/)
- [Ableton Live](/tsost/course/tools/ableton-live/)
