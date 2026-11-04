/**
 * PORSCHE — Cinematic Visual Configuration
 * Central source of truth for section heights, chapter ranges, frame sequences,
 * cinematic video reels, telemetry, dismantle callouts, and vehicle lineup.
 */

window.PORSCHE_CONFIG = {
  // Brand details
  brand: {
    name: "PORSCHE",
    tagline: "Driven by Dreams.",
    subline: "The city is asleep. We bring the light.",
    year: 2026,
  },

  // Color tokens (Luxury monochrome + Guard's Red & Xenon highlights)
  colors: {
    asphalt: "#060709",
    graphite: "#0E1014",
    fog: "#8A8F98",
    bone: "#EDEAE4",
    xenon: "#CFE3FF",
    guardsRed: "#E1251B",
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
    cinemaHeightVh: 100,
    dismantleHeightVh: 350,
    lineupHeightVh: 100,
    reserveHeightVh: 100,
  },

  // Hero Scrollytelling Chapters & Telemetry
  hero: {
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
        endProgress: 0.14,
        title: "PORSCHE",
        subline: "The city is asleep.",
        hint: "SCROLL TO WAKE IT",
        alignment: "top-left",
        coords: { x: "8vw", y: "16vh" },
      },
      {
        id: "ch-02",
        label: "02/04",
        startProgress: 0.22,
        endProgress: 0.40,
        title: "It doesn't need the city's light.",
        subline: "Engineered in Weissach.",
        alignment: "top-left",
        coords: { x: "8vw", y: "20vh" },
      },
      {
        id: "ch-03",
        label: "03/04",
        startProgress: 0.50,
        endProgress: 0.68,
        title: "It brings its own.",
        subline: "HD Matrix LED Architecture.",
        alignment: "top-left",
        coords: { x: "8vw", y: "20vh" },
      },
      {
        id: "ch-04",
        label: "04/04",
        startProgress: 0.80,
        endProgress: 1.00,
        title: "TAYCAN TURBO GT",
        specs: "0–100 KM/H 2.2S · 554 KM RANGE · 760 KW (1,034 PS)",
        ctaText: "Discover the Model →",
        ctaHref: "#lineup",
        alignment: "top-left",
        coords: { x: "8vw", y: "18vh" },
      },
    ],
  },

  // Cinematic Video Theater Section
  cinema: {
    eyebrow: "03 — THE NIGHT DRIVE",
    headline: "Pure cinematic immersion.",
    subline: "Shot in 4K resolution across urban nightscapes. Feel the precision, silence, and sudden surge of 1,000+ horsepower.",
    scenes: [
      {
        id: "scene-1",
        title: "SCENE 01 / REAR LIGHT SIGNATURE",
        caption: "Continuous LED light strip illuminating the wet tarmac.",
        src: "assets/videos/hero_cinematic_1.mp4",
        poster: "assets/videos/hero_cinematic_1_poster.webp",
      },
      {
        id: "scene-2",
        title: "SCENE 02 / HIGH-SPEED TRACKING",
        caption: "Sweeping camera arc transitioning from rear 3/4 to full profile.",
        src: "assets/videos/hero_cinematic_2.mp4",
        poster: "assets/videos/hero_cinematic_2_poster.webp",
      },
      {
        id: "scene-3",
        title: "SCENE 03 / SIDE PROFILE CRUISE",
        caption: "Aerodynamic silhouette cutting through midnight fog at 120 km/h.",
        src: "assets/videos/hero_cinematic_3.mp4",
        poster: "assets/videos/hero_cinematic_3_poster.webp",
      },
      {
        id: "scene-4",
        title: "SCENE 04 / MECHANICAL DISMANTLE",
        caption: "Exploded engineering flow revealing the structural battery and dual motors.",
        src: "assets/videos/flow_dismantle.mp4",
        poster: "assets/videos/flow_dismantle_poster.webp",
      },
    ],
  },

  // Statement section
  statement: {
    label: "02 — ENGINEERING PHILOSOPHY",
    sentence: "Every part was designed to disappear into one line of light.",
  },

  // Dismantle Scrollytelling
  dismantle: {
    title: "Look closer.",
    subtitle: "Weissach performance architecture, deconstructed layer by layer.",
    calloutsStartProgress: 0.70,
    callouts: [
      {
        id: "body",
        label: "MONOCOQUE",
        description: "Carbon composite safety cell & lightweight aluminum skin",
        triggerProgress: 0.72,
        pinX: 52,
        pinY: 26,
        cardX: 62,
        cardY: 18,
      },
      {
        id: "battery",
        label: "PERFORMANCE BATTERY",
        description: "110 kWh 800V structural pack with active cooling",
        triggerProgress: 0.79,
        pinX: 52,
        pinY: 74,
        cardX: 64,
        cardY: 82,
      },
      {
        id: "drive",
        label: "DUAL PSM POWERTRAIN",
        description: "Axial-flux motors delivering 760 kW / 1,034 PS",
        triggerProgress: 0.86,
        pinX: 27,
        pinY: 60,
        cardX: 12,
        cardY: 68,
      },
      {
        id: "light",
        label: "HD MATRIX LIGHT",
        description: "Razor-thin 32,000-pixel LED light bar signature",
        triggerProgress: 0.93,
        pinX: 16,
        pinY: 50,
        cardX: 10,
        cardY: 38,
      },
    ],
  },

  // Lineup section (5 Porsche models)
  lineup: {
    eyebrow: "04 — THE PORSCHE LINEUP",
    headline: "Five ways to drive the night.",
    defaultActiveIndex: 0,
    models: [
      {
        id: "taycan-turbo-gt",
        indexStr: "01",
        name: "TAYCAN TURBO GT",
        descriptor: "The all-electric grand tourer.",
        image: "assets/cars/gt-e.webp",
        alt: "Porsche Taycan Turbo GT matte graphite grand tourer side profile",
        specs: [
          { label: "RANGE (WLTP)", value: "554 KM" },
          { label: "0–100 KM/H", value: "2.2 S" },
          { label: "MAX POWER", value: "760 KW (1,034 PS)" },
        ],
        swatches: ["#121418", "#EDEAE4", "#1C2331", "#07080A"],
        swatchNames: ["Volcano Grey Metallic", "Carrara White Metallic", "Gentian Blue Metallic", "Jet Black Metallic"],
        linkText: "Configure Taycan →",
      },
      {
        id: "panamera-turbo",
        indexStr: "02",
        name: "PANAMERA TURBO E-HYBRID",
        descriptor: "Executive sport sedan, uncompromising.",
        image: "assets/cars/s.webp",
        alt: "Porsche Panamera Turbo E-Hybrid satin bone white sedan side profile",
        specs: [
          { label: "RANGE (COMBINED)", value: "600 KM" },
          { label: "0–100 KM/H", value: "3.2 S" },
          { label: "MAX POWER", value: "500 KW (680 PS)" },
        ],
        swatches: ["#EDEAE4", "#121418", "#2A2D34", "#07080A"],
        swatchNames: ["Chalk / Crayon", "Volcano Grey", "Aventurine Green", "Deep Black"],
        linkText: "Configure Panamera →",
      },
      {
        id: "cayenne-turbo-gt",
        indexStr: "03",
        name: "CAYENNE TURBO GT",
        descriptor: "Higher, never heavier. The athlete.",
        image: "assets/cars/x.webp",
        alt: "Porsche Cayenne Turbo GT coupe midnight blue SUV side profile",
        specs: [
          { label: "TOP SPEED", value: "305 KM/H" },
          { label: "0–100 KM/H", value: "3.3 S" },
          { label: "MAX POWER", value: "485 KW (659 PS)" },
        ],
        swatches: ["#1C2433", "#121418", "#4A4E57", "#EDEAE4"],
        swatchNames: ["Midnight Blue Metallic", "Volcano Grey", "Arctic Grey", "Carrara White"],
        linkText: "Configure Cayenne →",
      },
      {
        id: "911-gt3-rs",
        indexStr: "04",
        name: "911 GT3 RS",
        descriptor: "Motorsport DNA. King of the Nürburgring.",
        image: "assets/cars/r.webp",
        alt: "Porsche 911 GT3 RS satin black track coupe with rear wing side profile",
        specs: [
          { label: "DOWNFORCE (285 KM/H)", value: "860 KG" },
          { label: "0–100 KM/H", value: "3.0 S" },
          { label: "MAX POWER", value: "386 KW (525 PS)" },
        ],
        swatches: ["#0A0A0B", "#1A1C20", "#E1251B", "#40444C"],
        swatchNames: ["Satin Black Carbon", "Exposed Carbon Weave", "Guards Red Accent", "GT Silver Metallic"],
        linkText: "Configure GT3 RS →",
      },
      {
        id: "mission-x",
        indexStr: "05",
        name: "MISSION X",
        descriptor: "The hypercar of tomorrow, realized today.",
        image: "assets/cars/one.webp",
        alt: "Porsche Mission X liquid silver concept hypercar side profile",
        specs: [
          { label: "POWER TO WEIGHT", value: "1:1 KG/PS" },
          { label: "0–100 KM/H", value: "< 1.9 S" },
          { label: "VOLTAGE", value: "900V SYSTEM" },
        ],
        swatches: ["#D9DEE5", "#121418", "#CFE3FF", "#07080A"],
        swatchNames: ["Rocket Metallic Silver", "Carbon Core", "Electric Blue", "Obsidian"],
        linkText: "Explore Concept →",
      },
    ],
  },

  // Reserve section
  reserve: {
    headline: "Drive the night.",
    subline: "Bespoke production allocations for the Porsche portfolio are strictly managed. Connect with your Porsche Centre to secure delivery.",
    cta: "COMMISSION YOUR PORSCHE",
  },

  // Reduced motion static frame indices
  reducedMotion: {
    heroFrames: [1, 209, 389, 598],
    dismantleFrames: [1, 200],
  },
};

// Backwards-compatible alias
window.NOCTIS_CONFIG = window.PORSCHE_CONFIG;
