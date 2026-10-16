---
title: "TESI"
order: 0
---

TESI (Tangible Embodied Sound Interaction) is a modular toolkit designed to support tangible and embodied sound interaction as a distributed system. It consists of three main components:

1. **Hardware** device integrating multiple sensors, 
2. **Middleware** for network communication, 
3. **Software** for real-time sensor-to-sound mapping.

- Repository: [github.com/francesco-di-maggio/tesi](https://github.com/francesco-di-maggio/tesi)
- Paper: [TESI: A Toolkit for Tangible and Embodied Sound Interaction](https://dl.acm.org/doi/10.1145/3731459.3779334)

## What it is

TESI is a custom PCB built around an [ESP32](/tsost/course/tools/esp32/) that integrates multiple sensors — IMU (motion), light, time-of-flight distance, and capacitive touch sensors. Sensor data is transmitted wirelessly via [OSC](/tsost/course/tools/osc/) / [OOCSI](/tsost/course/tools/oocsi/) to [Max](/tsost/course/tools/max/) and [Ableton Live](/tsost/course/tools/ableton-live/) for processing and sound mapping.

<img src="/tsost/course/media/tesi.png" alt="TESI" width="520">

The architecture is the same as the one you are learning in this course:

```
sensors → ESP32 → OSC → Max / Plugdata → sound
```

## Related

- [ESP32](/tsost/course/tools/esp32/)
- [Max](/tsost/course/tools/max/)
- [Sensors](/tsost/course/tools/sensors/)
- [OSC](/tsost/course/tools/osc/)
- [OOCSI](/tsost/course/tools/oocsi/)
- [Mapping](/tsost/course/concepts/mapping/)
- [Thing-Centeredness](/tsost/course/concepts/thing-centeredness/)
