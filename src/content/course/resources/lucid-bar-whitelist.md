---
group: "Help"
title: "Lucid.Bar Whitelist"
order: 0
---

Approved objects and sensors for [Assignment 2](/tsost/course/assignments/assignment-2/).

Your object must come from the Lucid.Bar. Your sensor must be chosen from the list below. Both choices require motivation — see [Thing-Centeredness](/tsost/course/concepts/thing-centeredness/) for how to think about this.

## Approved Objects

Objects must have dynamic properties — something that changes, moves, or is regularly used or touched.

1. Drinking glass
2. Beer tap
3. Bar stool
4. Table lamp
5. Plant
6. Coat rack
7. Table football
8. Door

## Approved Sensors

All sensors interface with the [ESP32](/tsost/course/tools/esp32/) via the [Arduino IDE](/tsost/course/tools/arduino-ide/) environment.

1. **Proximity / distance** — HC-SR04 ultrasonic or VL53L0X time-of-flight. Detects presence and distance.
2. **Touch / capacitive** — MPR121 (I2C, 12 channels) or ESP32 built-in touch pins. MPR121 has strong noise rejection and tracks a baseline — a long wire attached to an electrode acts as an antenna, detecting proximity at 20–30cm without contact. Useful for objects that are approached before touched (coat rack, beer tap, door). ESP32 built-in touch pins are simpler but less robust.
3. **Light** — LDR (photoresistor) or APDS-9960. Detects ambient light level or proximity via IR.
4. **Sound level** — MAX4466 microphone module. Detects loudness in the environment.
5. **Orientation / motion** — any I2C IMU. BNO055 or BNO085 give Euler angles directly (recommended). MPU-6050 is cheaper and widely available but gives raw accelerometer and gyroscope values. Good for objects that tilt, rotate, or move.
6. **Pressure / force** — FSR (force-sensitive resistor). Detects weight or pressure applied to a surface.
7. **Temperature / humidity** — DHT22. Slow-changing — best suited for gradual, ambient sound behaviors.
8. **Reed switch** — detects open/closed states magnetically. Binary, no calibration, very simple to wire.

---

*If you want to propose an object or sensor not on this list, let us know before Week 5.*
