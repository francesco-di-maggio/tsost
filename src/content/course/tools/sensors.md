---
group: "Hardware"
title: "Sensors"
order: 0
---

A sensor is a transducer — it converts a physical phenomenon into an electrical signal or digital data that a microcontroller can read.

Choosing the right sensor for your object is a design decision. It shapes what your object is sensitive to, and therefore what kind of presence it has in the space.

## Sensor types relevant to this course

### Motion & presence

**PIR (Passive Infrared)** — detects body heat moving through its field of view. Good for detecting whether someone is in a space. Binary: presence or absence.

**Ultrasonic distance** (e.g. HC-SR04) — measures distance to the nearest object using sound pulses. Good for proximity detection. Range: 2cm–80cm.

**Time-of-Flight** (e.g. VL53L0X) — more accurate distance sensing using laser. Compact, precise. Range: 5cm-4m.

### Touch & pressure

**Capacitive touch** — detects the proximity of a hand or finger without physical contact. Good for surfaces.

**Force-sensitive resistor (FSR)** — changes resistance under pressure. Good for weight, squeeze, push.

**Piezoelectric** — generates a voltage when physically deformed. Good for detecting vibration or impact.

### Environment

**Light (LDR / photoresistor)** — changes resistance with ambient light level. Simple, cheap, effective.

**Sound (microphone / MAX4466)** — measures ambient sound level. Feeds back into your sound system — be careful with feedback loops.

**Temperature** (e.g. DS18B20, DHT22) — measures ambient or surface temperature. Slow-changing, good for gradual drift.

**Humidity** (e.g. DHT22) — often paired with temperature.

### Orientation & movement

**IMU / Orientation** (e.g. BNO085) — measures acceleration, rotation, heading, pitch, and roll. Good for detecting tilt, shake, or movement. The BNO085 gives stable orientation as quaternions.

## Choosing a sensor for your object

Ask:
- What does this object *do* in its normal life? (A door opens. A cup is lifted. A chair is sat on.)
- What physical change accompanies that action?
- Which sensor type captures that change?
- What is the *range* of values the sensor will produce? (0–1? 0–1023? -1g to +1g?)

## Related

- [ESP32](/tsost/course/tools/esp32/)
- [Arduino IDE](/tsost/course/tools/arduino-ide/)
- [Lucid.Bar Whitelist](/tsost/course/resources/lucid-bar-whitelist/)
- [Mapping](/tsost/course/concepts/mapping/)
