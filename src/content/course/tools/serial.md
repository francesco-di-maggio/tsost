---
group: "Middleware"
title: "Serial"
order: 0
---

The Serial Monitor is built into the [Arduino IDE](/tsost/course/tools/arduino-ide/). It displays text sent from your microcontroller over USB. Use it to verify your sensor is working before adding wireless complexity.

## How to use it

In your sketch, initialize serial communication in `setup()`:

```cpp
Serial.begin(115200);
```

Then print sensor values in `loop()`:

```cpp
Serial.println(sensorValue);
```

Open the Serial Monitor: **Tools → Serial Monitor** (or Cmd+Shift+M). Set the baud rate to match your sketch (115200).

You should see values updating in real time.

## What to check

- Is the value changing when you interact with the sensor?
- What is the range — minimum, maximum, typical?
- Is the signal stable, or does it jump erratically?

Answer these before moving on to wireless. A noisy or flat signal is usually a hardware problem. 

## Setup in this course

**On the microcontroller (Arduino):**

- Separate each value with a space (e.g., using `Serial.print(" ");`)

**In Max:**

- Use the `serial` object with baudrate set to 115200
- Parse the serial message with the `unjoin` object (e.g., `unjoin 2` if you have two values)

**In Plugdata:**

Use the `comport` external for connecting Arduino to PlugData. You can find it by installing the library via Deken (Help > Find externals) within the software. Search for `comport` and install it.

- Use `comport` with deviceID and baudrate set to 115200
 
Tutorial: [Max/MSP to Arduino | Pure Data to Arduino](https://www.youtube.com/watch?v=VYWQaqf6yL0)

## One reader at a time

The serial port can only be open in one place at a time. If the Arduino Serial Monitor is open, Max or Plugdata cannot read from the same port — and vice versa. Close the Serial Monitor before trying to receive serial data in your patch.

## Serial as a fallback

If WiFi drops during the event, USB serial is a reliable fallback. Max and Plugdata can both receive serial data.

## Related

- [Arduino IDE](/tsost/course/tools/arduino-ide/)
- [ESP32](/tsost/course/tools/esp32/)
- [OSC](/tsost/course/tools/osc/)
- [Wireless](/tsost/course/tools/wireless/)
