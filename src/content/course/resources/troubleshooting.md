---
group: "Help"
title: "Troubleshooting"
order: 0
summary: "Common problems and fixes."
---

Work through these before asking for help.

## Sensor reads 0 or a fixed value

- Check your wiring — is the sensor connected to the correct pin?
- Check the pin number in your sketch matches your wiring
- Open the [Serial Monitor](/tsost/course/tools/serial/) and print the raw value — is it changing at all?
- For analog sensors: make sure you are using an ADC-capable pin (on ESP32: GPIO 32–39)
- For I2C sensors: check the I2C address in your sketch matches the sensor (use an I2C scanner sketch to confirm)

## Serial Monitor shows garbage or nothing

- Check the baud rate in the Serial Monitor matches `Serial.begin()` in your sketch (should be 115200)
- Make sure you selected the correct port: Tools → Port
- Try unplugging and replugging the USB cable
- If using CodeCell or a clone board, you may need to install a USB driver (CP2102 or CH340)

## Wi-Fi won't connect

- Double-check your SSID and password in the sketch — they are case-sensitive
- Make sure your phone hotspot is on and visible
- Do not use eduroam — it blocks device-to-device communication
- After uploading, open the Serial Monitor to see the connection status — it will print the assigned IP address when connected

## Max or Plugdata not receiving OSC

- Confirm your laptop's IP address on the hotspot: System Settings → Network → Wi-Fi → Details
- Check that the IP in your sketch matches your laptop's current IP — it changes each time you reconnect
- Check that the port number in your sketch matches the port in your Max/Plugdata patch (default: 9000)
- Make sure your laptop and ESP32 are on the same network (the same hotspot)
- The Serial Monitor and Max/Plugdata cannot read the same serial port simultaneously — close one before opening the other

## Sensor signal is noisy or jumpy

- Increase the `SMOOTHING` value in the [Starter Sketch](/tsost/course/resources/starter-sketch/) (e.g. from 0.1 to 0.05 for more smoothing)
- Check your wiring for loose connections
- For capacitive sensors: keep wires short and away from power lines
- For analog sensors: add a small capacitor between signal and GND to filter noise

## Sound stops or cuts out during the installation

- If Wi-Fi drops, fall back to USB serial — see [Serial Monitor](/tsost/course/tools/serial/)
- Make sure your power bank has enough capacity — the ESP32 draws more current when transmitting Wi-Fi
- Build reconnection logic into your sketch so the ESP32 reconnects automatically if Wi-Fi drops

## Related

- [Serial Monitor](/tsost/course/tools/serial/)
- [Wireless](/tsost/course/tools/wireless/)
- [ESP32](/tsost/course/tools/esp32/)
- [Starter Sketch](/tsost/course/resources/starter-sketch/)
- [OSC](/tsost/course/tools/osc/)
