/**
 * NOCTIS Configuration
 * All section heights, chapter ranges, frame counts, frame paths,
 * callout positions and lineup car specs are centralized here.
 */

window.NOCTIS_CONFIG = {
  // Brand details
  brand: {
    name: "NOCTIS",
    tagline: "The city is asleep.",
    year: 2026,
  },

  // Color tokens
  colors: {
    asphalt: "#07080A",
    graphite: "#121418",
    fog: "#8A8F98",
    bone: "#EDEAE4",
    xenon: "#CFE3FF",
    taillight: "#E1251B",
    hairline: "rgba(237, 234, 228, 0.12)",
  },

  // Animation easing and lerp factors
  motion: {
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    cursorLerp: 0.18,
    frameLerp: 0.15,
    hoverDebounceMs: 80,
    grainFps: 8,
    grainOpacity: 0.035,
  },

  // Frame sequences
  frames: {
    hero: {
      count: 598,
      desktopPath: "assets/frames/hero/frame_{index}.webp",
      mobilePath: "assets/frames/hero-mobile/frame_{index}.webp",
      initialPreloadCount: 40,
      width: 1600,
      height: 900,
    },
    dismantle: {
      count: 200,
      desktopPath: "assets/frames/dismantle/frame_{index}.webp",
      mobilePath: "assets/frames/dismantle-mobile/frame_{index}.webp",
      width: 1600,
      height: 900,
    },
  },

  // Section heights
  sections: {
    heroHeightVh: 600,
    statementHeightVh: 100,
    dismantleHeightVh: 350,
    lineupHeightVh: 100,
    reserveHeightVh: 100,
  },

  // Hero Scrollytelling Chapters & Telemetry
  hero: {
    // Canvas fades to black over last 5% of scroll
    canvasFadeOutStart: 0.95,
    canvasFadeOutEnd: 1.00,

    telemetry: {
      speedMaxKmH: 118,
      distanceMaxKm: 4.2,
    },

    chapters: [
      {
        id: "ch-01",
        label: "01/04",
        startProgress: 0.00,
        endProgress: 0.12,
        title: "NOCTIS",
        subline: "The city is asleep.",
        hint: "SCROLL TO WAKE IT",
        alignment: "top-left",
        // Positioned in empty sky, never over the car
        coords: { x: "8vw", y: "16vh" },
      },
      {
        id: "ch-02",
        label: "02/04",
        startProgress: 0.22,
        endProgress: 0.40,
        title: "It doesn't need the city's light.",
        subline: "",
        alignment: "top-left",
        coords: { x: "8vw", y: "20vh" },
      },
      {
        id: "ch-03",
        label: "03/04",
        startProgress: 0.50,
        endProgress: 0.68,
        title: "It brings its own.",
        subline: "",
        alignment: "top-left",
        coords: { x: "8vw", y: "20vh" },
      },
      {
        id: "ch-04",
        label: "04/04",
        startProgress: 0.80,
        endProgress: 1.00,
        title: "GT-E",
        specs: "0–100 KM/H 3.1S · 640 KM RANGE · DUAL MOTOR",
        ctaText: "Discover the GT-E",
        ctaHref: "#lineup",
        alignment: "top-left",
        coords: { x: "8vw", y: "18vh" },
      },
    ],
  },

  // Statement section
  statement: {
    label: "02 — ENGINEERING",
    sentence: "Every part was designed to disappear into one line of light.",
  },

  // Dismantle Scrollytelling
  dismantle: {
    title: "Look closer.",
    calloutsStartProgress: 0.70,
    // Callouts appear sequentially after 70% progress
    callouts: [
      {
        id: "body",
        label: "BODY",
        description: "Carbon composite monocoque",
        triggerProgress: 0.72,
        // Relative coordinates on the 16:9 canvas space (0-100%)
        pinX: 52, // Target dot on the carbon monocoque roof
        pinY: 26,
        cardX: 62, // Callout text position
        cardY: 18,
      },
      {
        id: "battery",
        label: "BATTERY",
        description: "110 kWh structural pack",
        triggerProgress: 0.79,
        pinX: 52, // Target dot on battery pack bottom plate
        pinY: 74,
        cardX: 64,
        cardY: 82,
      },
      {
        id: "drive",
        label: "DRIVE",
        description: "Dual axial-flux motors, 680 kW",
        triggerProgress: 0.86,
        pinX: 27, // Target dot on front motor & suspension assembly
        pinY: 60,
        cardX: 12,
        cardY: 68,
      },
      {
        id: "light",
        label: "LIGHT",
        description: "Single-line LED signature",
        triggerProgress: 0.93,
        pinX: 16, // Target dot on the front glowing xenon light bar
        pinY: 50,
        cardX: 10,
        cardY: 38,
      },
    ],
  },

  // Lineup section
  lineup: {
    eyebrow: "03 — THE LINEUP",
    headline: "Five ways to drive the night.",
    defaultActiveIndex: 0,
    models: [
      {
        id: "gt-e",
        indexStr: "01",
        name: "GT-E",
        descriptor: "The grand tourer.",
        image: "assets/cars/gt-e.webp",
        alt: "NOCTIS GT-E matte graphite electric grand tourer coupe side profile",
        specs: [
          { label: "RANGE", value: "640 KM" },
          { label: "0–100 KM/H", value: "3.1 S" },
          { label: "POWER", value: "680 KW" },
        ],
        swatches: ["#121418", "#EDEAE4", "#1C2331", "#07080A"],
        swatchNames: ["Matte Graphite", "Satin Bone", "Midnight Blue", "Asphalt Void"],
        linkText: "Configure →",
      },
      {
        id: "s",
        indexStr: "02",
        name: "S",
        descriptor: "Four doors, no compromise.",
        image: "assets/cars/s.webp",
        alt: "NOCTIS S satin bone white electric sport sedan side profile",
        specs: [
          { label: "RANGE", value: "600 KM" },
          { label: "0–100 KM/H", value: "3.6 S" },
          { label: "POWER", value: "520 KW" },
        ],
        swatches: ["#EDEAE4", "#121418", "#2A2D34", "#07080A"],
        swatchNames: ["Satin Bone", "Matte Graphite", "Stealth Grey", "Obsidian"],
        linkText: "Configure →",
      },
      {
        id: "x",
        indexStr: "03",
        name: "X",
        descriptor: "Higher, never heavier.",
        image: "assets/cars/x.webp",
        alt: "NOCTIS X midnight blue electric coupe SUV side profile",
        specs: [
          { label: "RANGE", value: "560 KM" },
          { label: "0–100 KM/H", value: "4.2 S" },
          { label: "POWER", value: "480 KW" },
        ],
        swatches: ["#1C2433", "#121418", "#4A4E57", "#EDEAE4"],
        swatchNames: ["Midnight Blue", "Graphite", "Storm Tint", "Satin Bone"],
        linkText: "Configure →",
      },
      {
        id: "r",
        indexStr: "04",
        name: "R",
        descriptor: "Built for the track.",
        image: "assets/cars/r.webp",
        alt: "NOCTIS R satin black electric track coupe with rear wing side profile",
        specs: [
          { label: "RANGE", value: "420 KM" },
          { label: "0–100 KM/H", value: "2.4 S" },
          { label: "POWER", value: "900 KW" },
        ],
        swatches: ["#0A0A0B", "#1A1C20", "#E1251B", "#40444C"],
        swatchNames: ["Satin Black", "Exposed Carbon", "Apex Red", "Titanium"],
        linkText: "Configure →",
      },
      {
        id: "one",
        indexStr: "05",
        name: "ONE",
        descriptor: "The future, early.",
        image: "assets/cars/one.webp",
        alt: "NOCTIS ONE liquid silver concept hypercar side profile",
        specs: [
          { label: "RANGE", value: "CONCEPT" },
          { label: "0–100 KM/H", value: "< 1.9 S" },
          { label: "POWER", value: "1200 KW" },
        ],
        swatches: ["#D9DEE5", "#121418", "#CFE3FF", "#07080A"],
        swatchNames: ["Liquid Silver", "Void Black", "Xenon Ion", "Asphalt"],
        linkText: "Configure →",
      },
    ],
  },

  // Reserve section
  reserve: {
    headline: "Drive the night.",
    subline: "Production allocations for the NOCTIS portfolio are strictly limited. Secure your delivery position.",
    cta: "RESERVE YOUR NOCTIS",
  },

  // Reduced motion static frame indices
  reducedMotion: {
    heroFrames: [1, 209, 389, 598], // 0%, ~35%, ~65%, 100%
    dismantleFrames: [1, 200], // first and last
  },
};

