---
group: "Middleware"
title: "OOCSI"
order: 0
---

OOCSI (Out of Control for Semantic Interactivity) is a lightweight data exchange platform developed at TU/e for design research. It is designed to make it easy for multiple devices to communicate with each other in a shared network — without needing to know each other's IP addresses.

- Website: [oocsi.net](https://oocsi.net)

## OOCSI vs OSC

[OSC](/tsost/course/tools/osc/) requires you to know the IP address of every device you want to communicate with. In a room full of devices, that becomes complicated quickly.

OOCSI uses a **server** model — all devices connect to a central OOCSI server and exchange data through named **channels**. Your microcontroller publishes to a channel; your laptop subscribes to it. No IP address juggling.

For this course, OSC is simpler and sufficient — you are sending data from one ESP32 to one laptop on a shared hotspot. OOCSI becomes useful when you have many nodes that need to discover and talk to each other without manual configuration.

## How it works

1. All devices connect to the OOCSI server (provided by TU/e or run locally)
2. Your microcontroller publishes sensor data to a named channel (e.g. `TSOST-channel`)
3. Your Max or Plugdata patch subscribes to that channel and receives the data

## Setup

- Available via the Arduino Library Manager, search for `OOCSI`
- [Max](/tsost/course/tools/max/): download the OOCSI abstractions from [oocsi-max](https://github.com/francesco-di-maggio/oocsi-max)

## Related

- [OSC](/tsost/course/tools/osc/)
- [Max](/tsost/course/tools/max/)
- [Plugdata](/tsost/course/tools/plugdata/)
- [ESP32](/tsost/course/tools/esp32/)
