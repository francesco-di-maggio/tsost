---
group: "Software"
title: "Arduino IDE"
order: 0
action: { label: "Download", title: "Arduino IDE", caption: "Free, for Mac, Windows and Linux.", href: "https://www.arduino.cc/en/software" }
---

The Arduino IDE is the programming environment used to write and upload code to your microcontroller. It is free, cross-platform, and widely supported.

- Version: use Arduino IDE 2.x (current)

## Setup for this course

1. Download and install Arduino IDE 2.x
2. Add the ESP32 board package
   - Go to File → Preferences
   - Add this URL to "Additional boards manager URLs":
     `https://dl.espressif.com/dl/package_esp32_index.json`
   - Go to Tools → Board → Boards Manager, search "esp32", install
3. Install required libraries via Tools → Manage Libraries:
   - `OSC` — for sending sensor data to Max/Plugdata
   - `CodeCell` — by Microbots (if using [CodeCell](/tsost/course/tools/codecell/))

## Basic workflow

1. Write your sketch in the IDE
2. Select your board: Tools → Board → ESP32 → your specific board
3. Select your port: Tools → Port → (your device's USB port)
4. Upload: press the Upload button (→)
5. Open Serial Monitor to debug: Tools → Serial Monitor

## Tips

- If your board isn't recognized, you may need to install a USB driver (CP2102 or CH340 depending on your board)
- The Serial Monitor is your best friend for debugging — print sensor values to check they're working before sending them wirelessly
- Save your sketches frequently and keep versions — it's easy to break something that was working

## Related

- [ESP32](/tsost/course/tools/esp32/)
- [Sensors](/tsost/course/tools/sensors/)
- [OSC](/tsost/course/tools/osc/)
- [Starter Sketch](/tsost/course/resources/starter-sketch/)
