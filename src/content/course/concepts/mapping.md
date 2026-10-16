---
group: "Systems"
title: "Mapping"
order: 0
---

Mapping is the design decision of how one parameter space connects to another — how an input drives an output. The same input can produce very different results depending on how it is mapped.

## Types of mapping

<img src="/tsost/course/media/mapping.svg" alt="Mapping">

**One-to-one** — one input → one output. Simple and legible, least expressive.

**One-to-many** — one input → multiple outputs. More expressive.

**Many-to-one** — multiple inputs → one output. They combine into a single control.

**Many-to-many** — multiple inputs → multiple outputs. Hard to predict and control.

## Shaping the signal

How an input value is transformed before it reaches the output.

**Calibration** — a sensor seldom reaches its theoretical limits. The working range is the minimum and maximum actually observed.

**Scaling** — an input rarely matches the range of the output (e.g. an audible range of 20 Hz–20 kHz). Scaling maps one range onto the other.

**Smoothing** — raw input is noisy. Smoothing removes abrupt jumps so the output changes gradually.

**Linear vs non-linear** — a linear mapping treats every step equally. Because pitch and loudness are perceived closer to logarithmically, a curved mapping can better match their behaviour.

**Quantization** — snapping a continuous input to discrete steps, such as the notes of a scale.

**Direction** — a mapping can rise or fall with the input.

## Continuous and triggered

Two basic relationships between input and output.

1. **Continuous** — direct mapping. The output follows the input.

2. **Triggered** — nothing happens until a condition is met, at which point an event fires.

## Triggers

Ways to refine when a triggered event happens.

**Threshold** — an event fires when a value crosses a set point.

**Hysteresis** — a single threshold reacts repeatedly when the input rests near it. Two values, one to trigger and a lower one to release, prevent this.

**Hold** — the value must stay past the threshold for a set time before it counts, ignoring brief spikes.

**Debounce** — after an event fires, further triggers are ignored for a short time, removing rapid repeats.

**Rate of change** — the response depends on how fast a value moves rather than its level. This distinguishes a tap or a shake from a slow movement.

## Related

- [Sound Design](/tsost/course/concepts/sound-design/)
- [Psychoacoustics](/tsost/course/concepts/psychoacoustics/)
- [Max](/tsost/course/tools/max/)
- [Plugdata](/tsost/course/tools/plugdata/)
- [Week 6](/tsost/course/weeks/week-6/)
