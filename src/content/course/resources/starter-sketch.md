---
group: "Help"
title: "Starter Sketch"
order: 0
---

This is a starting point example sketch built around an LDR (Light Dependent Resistor) sensor. It contains all the patterns you need for your sensor: normalization, smoothing, change detection, and rate-limited sending over serial or OSC. 

To adapt it to a different sensor, use the Sensor patterns section below:

- Update `OSC_ADDRESS` to match your sensor
- Replace the body of `read()` with the relevant snippet
- For **digital sensors**: add `pinMode(SENSOR_PIN, INPUT_PULLUP)` to `setup()`
- For **I2C sensors**: also add the listed includes, global variable, and `begin()` call to `setup()`

## The sketch

```cpp
// ============================================================
// The Sound of Smart Things — Starter Sketch
// ID TU/e, 2026
// ============================================================

// --- 1. Communication mode ---
// Uncomment ONE, or both to run simultaneously:
#define USE_SERIAL   // debug output to Serial Monitor
#define USE_OSC      // send over WiFi

// --- 2. WiFi & OSC (only needed with OSC) ---
#define WIFI_SSID    "your-network"
#define WIFI_PASS    "your-password"
#define OSC_IP       "192.168.8.100"  // your laptop's IP on the hotspot
#define OSC_PORT     9000
#define OSC_ADDRESS  "/sensor/light"  // OSC address — change to match your sensor

// --- 3. Pin ---
// Must be an ADC1 pin (32, 33, 34, 35, 36, 39) — ADC2 pins don't work while WiFi is on.
#define SENSOR_PIN    34    // analog input pin — adjust to match your wiring

// --- 4. Behavior ---
#define RATE          20      // ms between sends (~50 Hz)
#define THRESHOLD     0.005f  // minimum change required to send — prevents spamming the network
#define SMOOTHING     0.1f    // exponential moving average: 0.0 = frozen, 1.0 = raw signal

// --- 5. Other ---
#define WIFI_TIMEOUT  10000   // ms to wait for WiFi before giving up

// ============================================================
// Includes
// ============================================================

#ifdef USE_OSC
  #include <WiFi.h>
  #include <WiFiUdp.h>
  #include <OSCMessage.h>
  WiFiUDP udp;
#endif

// ============================================================
// State
// ============================================================

float smoothed = 0.0f;   // current smoothed sensor value (0.0–1.0)
float lastSent = -1.0f;  // last value sent — initialised to -1 so first read always sends
unsigned long lastSendTime = 0;   // timestamp of last send, used for rate limiting

// ============================================================
// Functions
// ============================================================

// Read sensor and update smoothed value
void read() {
  float raw = analogRead(SENSOR_PIN) / 4095.0f;     // normalise to 0.0–1.0 (12-bit ADC)
  smoothed += SMOOTHING * (raw - smoothed);  // exponential moving average
}

// Returns true if the value has changed enough to be worth sending
bool changed() {
  return abs(smoothed - lastSent) > THRESHOLD;
}

// Output current value via the active communication mode
void send() {
  #ifdef USE_SERIAL
    Serial.println(smoothed);
  #endif

  #ifdef USE_OSC
    OSCMessage msg(OSC_ADDRESS);
    msg.add(smoothed);
    udp.beginPacket(OSC_IP, OSC_PORT);
    msg.send(udp);
    udp.endPacket();
    msg.empty();
  #endif
}

// Send at a fixed rate, only when the value has changed
void stream() {
  unsigned long now = millis();
  if (now - lastSendTime >= RATE) {
    lastSendTime = now;
    if (changed()) {
      lastSent = smoothed;
      send();
    }
  }
}

// ============================================================
// Setup & Loop
// ============================================================

#ifdef USE_OSC
// Connect to WiFi and open UDP port (gives up after WIFI_TIMEOUT)
void connect() {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi: connecting to ");
  Serial.print(WIFI_SSID);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_TIMEOUT) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi: connected, IP ");
    Serial.println(WiFi.localIP());
    Serial.print("OSC: -> ");
    Serial.print(OSC_IP);
    Serial.print(":");
    Serial.print(OSC_PORT);
    Serial.print(" ");
    Serial.println(OSC_ADDRESS);
    udp.begin(OSC_PORT);
  } else {
    Serial.println("WiFi: timeout — check SSID/password. OSC will not send.");
  }
}
#endif

void setup() {
  Serial.begin(115200);
  delay(500); // give the Serial Monitor a moment to attach
  analogReadResolution(12); // 0–4095 range, matches /4095.0f in read()
  Serial.println();
  Serial.println("--- Sound of Smart Things — Starter Sketch ---");
  Serial.println();
  Serial.print("Modes: ");
  #ifdef USE_SERIAL
    Serial.print("SERIAL ");
  #endif
  #ifdef USE_OSC
    Serial.print("OSC");
  #endif
  Serial.println();
  Serial.print("Sensor pin: ");
  Serial.println(SENSOR_PIN);

  #ifdef USE_OSC
    connect();
  #endif

  Serial.println();
  Serial.println("Ready.");
  Serial.println();
}

void loop() {
  read();
  stream();
}
```

## Sensor patterns

Swap the body of `read()` with the relevant snippet. All patterns normalize to `0.0–1.0` before smoothing is applied.

### Analog
LDR, FSR, pot, microphone (MAX4466). 

```cpp
// Wiring: signal → SENSOR_PIN, with voltage divider or pull-down as required
float raw = analogRead(SENSOR_PIN) / 4095.0f;  // 12-bit ADC → 0.0–1.0
```

### Digital
Button, reed switch.

```cpp
// Add to setup(): pinMode(SENSOR_PIN, INPUT_PULLUP);
// Wiring: one leg → SENSOR_PIN, other leg → GND — LOW = active with pull-up
float raw = (digitalRead(SENSOR_PIN) == LOW) ? 1.0f : 0.0f;
```

Digital sensors give a binary value (0 or 1). Smoothing has no meaningful effect — you may want to remove it, or repurpose the EMA as a debounce filter.

### I2C — BNO055 (orientation / motion)

```cpp
// Libraries: Adafruit_Sensor, Adafruit_BNO055
// Globals:   Adafruit_BNO055 bno = Adafruit_BNO055(55, 0x28);
// setup():   if (!bno.begin()) { while(1); }  // halt if sensor not found

sensors_event_t event;
bno.getEvent(&event);
// Pitch (forward/back tilt): -90 to +90 degrees → 0.0–1.0
float raw = constrain((event.orientation.z + 90.0f) / 180.0f, 0.0f, 1.0f);
// Swap .z (pitch) for .y (roll) or .x (heading 0–360°) as needed
```

### I2C — MPR121 (capacitive touch / proximity)

```cpp
// Library: Adafruit_MPR121
// Globals: Adafruit_MPR121 mpr;
// setup(): mpr.begin(0x5A);

// filteredData returns raw capacitance — lower value = more touch / closer proximity
// Calibrate the divisor (600.0f) to your sensor and environment
float raw = constrain(1.0f - (mpr.filteredData(0) / 600.0f), 0.0f, 1.0f);
// Long wire tip: attach a wire to channel 0 electrode — it becomes a proximity antenna (~20–30cm range)
```

### HC-SR04 (ultrasonic distance)

```cpp
// Wiring: Trig → pin 5, Echo → pin 18, VCC → 5V, GND → GND
// Add globals: const int trigPin = 5; const int echoPin = 18;
// Add to setup(): pinMode(trigPin, OUTPUT); pinMode(echoPin, INPUT);

digitalWrite(trigPin, LOW); delayMicroseconds(2);
digitalWrite(trigPin, HIGH); delayMicroseconds(10);
digitalWrite(trigPin, LOW);
long duration = pulseIn(echoPin, HIGH, 30000); // timeout 30ms
float cm = duration * 0.034f / 2.0f;
float raw = constrain(1.0f - (cm / 80.0f), 0.0f, 1.0f); // invert: closer = 1.0, max range 80cm
```

### I2C — VL53L0X (time-of-flight distance)

```cpp
// Library: Adafruit_VL53L0X
// Globals: Adafruit_VL53L0X lox;
// setup(): lox.begin();

VL53L0X_RangingMeasurementData_t measure;
lox.rangingTest(&measure, false);
float cm = (measure.RangeStatus != 4) ? measure.RangeMilliMeter / 10.0f : 200.0f;
float raw = constrain(1.0f - (cm / 200.0f), 0.0f, 1.0f); // invert: closer = 1.0, max range 200cm
```

### I2C — MPU-6050 (orientation / motion)

```cpp
// Library: Adafruit MPU6050
// Globals: Adafruit_MPU6050 mpu;
// setup(): mpu.begin();
// Note: raw accelerometer data is noisier than BNO055 — use a lower SMOOTHING value (e.g. 0.05)

sensors_event_t a, g, temp;
mpu.getEvent(&a, &g, &temp);
float pitch = atan2(a.acceleration.y, a.acceleration.z) * 180.0f / PI;
float raw = constrain((pitch + 90.0f) / 180.0f, 0.0f, 1.0f); // -90°–+90° → 0.0–1.0
```

### DHT22 (temperature / humidity)

```cpp
// Library: DHT sensor library (Adafruit)
// Globals: DHT dht(SENSOR_PIN, DHT22);
// setup(): dht.begin();
// Note: DHT22 reads take ~500ms — set RATE to at least 500 in the config above

float temp = dht.readTemperature();
float raw = isnan(temp) ? smoothed : constrain((temp - 15.0f) / 20.0f, 0.0f, 1.0f); // 15–35°C → 0.0–1.0
// For humidity instead: float raw = constrain(dht.readHumidity() / 100.0f, 0.0f, 1.0f);
```

## Related

- [Arduino IDE](/tsost/course/tools/arduino-ide/)
- [ESP32](/tsost/course/tools/esp32/)
- [Sensors](/tsost/course/tools/sensors/)
- [OSC](/tsost/course/tools/osc/)
- [Serial Monitor](/tsost/course/tools/serial/)
