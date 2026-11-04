# NOCTIS — The City is Asleep

A premium, minimal, single-page scrollytelling website for **NOCTIS**, a fictional electric car brand.

> *Mood: A city in total blackout at night where the car's light is the only light in the world. Quiet, expensive, and precise: huge empty space, few words, perfect motion.*

---

## Features

- **Pure Vanilla Stack**: Built with plain HTML5, CSS3, and vanilla JavaScript (`index.html`, `styles.css`, `main.js`, `config.js`). No libraries, frameworks, or bundlers.
- **Canvas-Scrubbed Scrollytelling**: High-performance `<canvas>` rendering engine with smooth lerp physics (`0.15`) for both Hero (598 frames) and Component Dismantle (200 frames).
- **Adaptive Fit**: Cover-fit on landscape displays; contain-fit centered on `--asphalt` (#07080A) on portrait screens so the car is never cropped.
- **Custom Headlight Cursor**: Precision 6px xenon dot inside a 28px hairline ring following the pointer with lerp `0.18`, morphing into the vehicle's signature 44×2px light bar over interactive elements.
- **Lineup Accordion**: Five luxury EV models (`GT-E`, `S`, `X`, `R`, `ONE`) in a debounced hover accordion with 6% entrance motion, spec sheets, flat swatches, and keyboard arrow navigation.
- **Engineering Dismantle**: Interactive explosion sequence with real-time SVG hairline callouts tracing the Carbon Monocoque, 110 kWh Battery Pack, Axial-Flux Motors, and LED Signature.
- **Telemetry HUD**: Real-time velocity and distance counters tied directly to scroll progress.
- **Film Grain Overlay**: Monochromatic noise tile generated offscreen and shifted at ~8 FPS with 3.5% opacity.
- **Accessibility & Performance**: Full support for `prefers-reduced-motion` and mobile touch displays.

---

## Local Development

Run with any simple static local server:

```bash
# Using Python
python -m http.server 5500

# Using VS Code
Right click index.html -> "Open with Live Server"
```

Open [http://localhost:5500](http://localhost:5500) in your browser.

