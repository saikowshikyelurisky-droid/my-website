/**
 * PORSCHE — Cinematic Visual Engine
 * Scrollytelling canvas scrubbers, 4K ambient video theater, custom headlight cursor,
 * interactive model accordion, live SVG telemetry callouts, and commissioning modal.
 */

(function () {
  'use strict';

  const cfg = window.PORSCHE_CONFIG || window.NOCTIS_CONFIG;
  if (!cfg) {
    console.error('PORSCHE: config.js must be loaded before main.js');
    return;
  }

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) {
    document.body.classList.add('reduced-motion');
  }

  function isMobileViewport() {
    return window.innerWidth < 768;
  }

  /* ==========================================================================
     1. FIXED FILM GRAIN OVERLAY (~8 FPS offscreen noise tile)
     ========================================================================== */
  function initFilmGrain() {
    const grainCanvas = document.getElementById('grain-canvas');
    if (!grainCanvas) return;
    const ctx = grainCanvas.getContext('2d');
    if (!ctx) return;

    const tileSize = 128;
    const tile = document.createElement('canvas');
    tile.width = tileSize;
    tile.height = tileSize;
    const tCtx = tile.getContext('2d');
    const imgData = tCtx.createImageData(tileSize, tileSize);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const val = (Math.random() * 255) | 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
    tCtx.putImageData(imgData, 0, 0);

    function resizeGrain() {
      grainCanvas.width = window.innerWidth;
      grainCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeGrain, { passive: true });
    resizeGrain();

    let lastTime = 0;
    const interval = 1000 / (cfg.motion.grainFps || 8);

    function grainLoop(now) {
      if (now - lastTime >= interval) {
        lastTime = now;
        ctx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
        const ptrn = ctx.createPattern(tile, 'repeat');
        if (ptrn) {
          const shiftX = (Math.random() * tileSize) | 0;
          const shiftY = (Math.random() * tileSize) | 0;
          ctx.save();
          ctx.translate(shiftX, shiftY);
          ctx.fillStyle = ptrn;
          ctx.fillRect(-shiftX, -shiftY, grainCanvas.width + tileSize, grainCanvas.height + tileSize);
          ctx.restore();
        }
      }
      requestAnimationFrame(grainLoop);
    }
    requestAnimationFrame(grainLoop);
  }

  /* ==========================================================================
     2. CUSTOM CURSOR ("The Headlight")
     ========================================================================== */
  function initCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    const cursorLabel = document.getElementById('cursor-label');
    if (!cursor || !cursorLabel || isReducedMotion) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    let isDown = false;
    let currentLabel = '';

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      if (isDown) return;
      isDown = true;
      cursor.classList.add('is-down');
      setTimeout(() => {
        cursor.classList.remove('is-down');
        isDown = false;
      }, 120);
    });

    function cursorLoop() {
      const lerp = cfg.motion.cursorLerp || 0.18;
      cursorX += (mouseX - cursorX) * lerp;
      cursorY += (mouseY - cursorY) * lerp;

      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      requestAnimationFrame(cursorLoop);
    }
    requestAnimationFrame(cursorLoop);

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-cursor], a, button, .lineup-slide');
      if (target) {
        cursor.classList.add('is-hovered');

        if (target.classList.contains('lineup-slide')) {
          const isOpen = target.classList.contains('is-active');
          currentLabel = isOpen ? 'CONFIGURE' : 'OPEN';
        } else {
          currentLabel = target.getAttribute('data-cursor') || 'VIEW';
        }

        cursorLabel.textContent = currentLabel;
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-cursor], a, button, .lineup-slide');
      if (target) {
        cursor.classList.remove('is-hovered');
        cursorLabel.textContent = '';
      }
    });
  }

  /* ==========================================================================
     3. SITE NAVIGATION SHOW/HIDE
     ========================================================================== */
  function initNavigation() {
    const nav = document.getElementById('site-nav');
    if (!nav) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentY = window.scrollY;
          if (currentY > lastScrollY && currentY > 80) {
            nav.classList.add('nav-hidden');
          } else {
            nav.classList.remove('nav-hidden');
          }
          lastScrollY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ==========================================================================
     4. IMAGE SEQUENCE PRELOADER & STORE
     ========================================================================== */
  const heroStore = {
    images: [],
    loadedCount: 0,
    totalCount: cfg.frames.hero.count,
    isReady: false,
  };

  const dismantleStore = {
    images: [],
    loadedCount: 0,
    totalCount: cfg.frames.dismantle.count,
    isReady: false,
  };

  function getFramePath(type, index) {
    const isMobile = isMobileViewport();
    const frameCfg = cfg.frames[type];
    const pathTpl = isMobile ? frameCfg.mobilePath : frameCfg.desktopPath;
    const padded = String(index).padStart(4, '0');
    return pathTpl.replace('{index}', padded);
  }

  function preloadSequence(onInitialComplete) {
    const preloader = document.getElementById('preloader');
    const preloaderLine = document.getElementById('preloader-line');
    const preloaderCounter = document.getElementById('preloader-counter');

    const initialHeroTarget = cfg.frames.hero.initialPreloadCount || 40;
    let initialLoaded = 0;

    let completed = false;
    function finishPreloader() {
      if (completed) return;
      completed = true;
      if (preloader) {
        preloader.classList.add('flash');
        setTimeout(() => {
          preloader.classList.add('is-finished');
          if (onInitialComplete) onInitialComplete();
          if (window.location.hash) {
            const targetEl = document.querySelector(window.location.hash);
            if (targetEl) targetEl.scrollIntoView();
          }
        }, 150);
      } else if (onInitialComplete) {
        onInitialComplete();
        if (window.location.hash) {
          const targetEl = document.querySelector(window.location.hash);
          if (targetEl) targetEl.scrollIntoView();
        }
      }

      loadRemainingFrames('hero', initialHeroTarget + 1, heroStore.totalCount, heroStore, () => {
        heroStore.isReady = true;
      });
      loadRemainingFrames('dismantle', 6, dismantleStore.totalCount, dismantleStore, () => {
        dismantleStore.isReady = true;
      });
    }

    // Safety fallback: reveal after 2.5s regardless of network speed
    setTimeout(finishPreloader, 2500);

    function loadSingleFrame(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        const timer = setTimeout(() => resolve(img), 2000);
        if (img.decode) {
          img.decode()
            .then(() => { clearTimeout(timer); resolve(img); })
            .catch(() => { clearTimeout(timer); resolve(img); });
        } else {
          img.onload = () => { clearTimeout(timer); resolve(img); };
          img.onerror = () => { clearTimeout(timer); resolve(img); };
        }
      });
    }

    const initialPromises = [];
    for (let i = 1; i <= initialHeroTarget; i++) {
      const src = getFramePath('hero', i);
      const p = loadSingleFrame(src).then((img) => {
        heroStore.images[i - 1] = img;
        initialLoaded++;
        const pct = Math.min(Math.round((initialLoaded / initialHeroTarget) * 100), 100);
        if (preloaderLine) preloaderLine.style.width = pct + '%';
        if (preloaderCounter) preloaderCounter.textContent = String(pct).padStart(3, '0');
      });
      initialPromises.push(p);
    }
    for (let i = 1; i <= 5; i++) {
      const src = getFramePath('dismantle', i);
      const p = loadSingleFrame(src).then((img) => {
        dismantleStore.images[i - 1] = img;
      });
      initialPromises.push(p);
    }

    Promise.all(initialPromises).then(finishPreloader);

    function loadRemainingFrames(type, startIdx, endIdx, store, onComplete) {
      let curr = startIdx;
      function nextBatch() {
        if (curr > endIdx) {
          if (onComplete) onComplete();
          return;
        }
        const batchSize = 6;
        const batchPromises = [];
        for (let b = 0; b < batchSize && curr <= endIdx; b++, curr++) {
          const idx = curr;
          const src = getFramePath(type, idx);
          batchPromises.push(loadSingleFrame(src).then((img) => {
            store.images[idx - 1] = img;
            store.loadedCount++;
          }));
        }
        Promise.all(batchPromises).then(() => {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(nextBatch);
          } else {
            setTimeout(nextBatch, 16);
          }
        });
      }
      nextBatch();
    }
  }

  function getNearestFrame(store, requestedIndex) {
    if (store.images[requestedIndex] && store.images[requestedIndex].complete) {
      return store.images[requestedIndex];
    }
    for (let offset = 1; offset < store.totalCount; offset++) {
      const prev = requestedIndex - offset;
      if (prev >= 0 && store.images[prev] && store.images[prev].complete) {
        return store.images[prev];
      }
      const next = requestedIndex + offset;
      if (next < store.totalCount && store.images[next] && store.images[next].complete) {
        return store.images[next];
      }
    }
    return null;
  }

  /* ==========================================================================
     5. CANVAS RENDERING ENGINE
     ========================================================================== */
  function renderFrameToCanvas(canvas, ctx, img) {
    if (!canvas || !ctx || !img) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rect = canvas.getBoundingClientRect();
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const cW = canvas.width;
    const cH = canvas.height;
    const imgW = img.naturalWidth || img.width || 1600;
    const imgH = img.naturalHeight || img.height || 900;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = cfg.colors.asphalt;
    ctx.fillRect(0, 0, cW, cH);

    const isLandscape = cW >= cH;
    let drawW, drawH, drawX, drawY;

    if (isLandscape) {
      const scale = Math.max(cW / imgW, cH / imgH);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = (cW - drawW) * 0.5;
      drawY = (cH - drawH) * 0.5;
    } else {
      const scale = Math.min(cW / imgW, cH / imgH);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = (cW - drawW) * 0.5;
      drawY = (cH - drawH) * 0.5;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  /* ==========================================================================
     6. SECTION 1 — HERO SCROLLYTELLING & AMBIENT CINEMA TOGGLE
     ========================================================================== */
  function initHeroScrolly() {
    const wrapper = document.getElementById('hero');
    const canvas = document.getElementById('hero-canvas');
    const videoBg = document.getElementById('hero-video-bg');
    const btnScrub = document.getElementById('btn-mode-scrub');
    const btnAmbient = document.getElementById('btn-mode-ambient');
    if (!wrapper || !canvas) return;
    const ctx = canvas.getContext('2d');

    const blackFade = document.getElementById('hero-black-fade');
    const progressFill = document.getElementById('hero-progress-fill');
    const hudChapter = document.getElementById('hud-chapter-val');
    const hudSpeed = document.getElementById('hud-speed-val');
    const hudDistance = document.getElementById('hud-distance-val');

    let isAmbientMode = false;

    if (btnScrub && btnAmbient && videoBg) {
      btnScrub.addEventListener('click', () => {
        isAmbientMode = false;
        btnScrub.classList.add('active');
        btnAmbient.classList.remove('active');
        videoBg.classList.remove('is-active');
        videoBg.pause();
        canvas.style.opacity = '1';
      });

      btnAmbient.addEventListener('click', () => {
        isAmbientMode = true;
        btnAmbient.classList.add('active');
        btnScrub.classList.remove('active');
        videoBg.classList.add('is-active');
        videoBg.play().catch(() => {});
        canvas.style.opacity = '0';
      });
    }

    const chapters = [
      { el: document.getElementById('ch-1'), start: 0.00, end: 0.16, label: '01/04' },
      { el: document.getElementById('ch-2'), start: 0.22, end: 0.42, label: '02/04' },
      { el: document.getElementById('ch-3'), start: 0.48, end: 0.70, label: '03/04' },
      { el: document.getElementById('ch-4'), start: 0.78, end: 1.00, label: '04/04' },
    ];

    let currentFrame = 0;
    let targetFrame = 0;
    let lastDrawnFrame = -1;

    function updateHero() {
      const rect = wrapper.getBoundingClientRect();
      const scrollDist = wrapper.offsetHeight - window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / (scrollDist || 1), 0), 1);

      targetFrame = Math.round(progress * (heroStore.totalCount - 1));
      currentFrame += (targetFrame - currentFrame) * (cfg.motion.frameLerp || 0.15);
      const roundedFrame = Math.round(currentFrame);

      if (!isAmbientMode && roundedFrame !== lastDrawnFrame) {
        const img = getNearestFrame(heroStore, roundedFrame);
        if (img) {
          renderFrameToCanvas(canvas, ctx, img);
          lastDrawnFrame = roundedFrame;
        }
      }

      if (progressFill) {
        progressFill.style.width = (progress * 100) + '%';
      }

      if (blackFade) {
        const fadeProg = Math.min(Math.max((progress - 0.95) / 0.05, 0), 1);
        blackFade.style.opacity = fadeProg;
      }

      let activeChapterLabel = '01/04';
      chapters.forEach((ch) => {
        if (!ch.el) return;
        const isActive = progress >= ch.start && progress <= ch.end;
        if (isActive) {
          ch.el.classList.add('is-active', 'is-revealed');
          activeChapterLabel = ch.label;
        } else {
          ch.el.classList.remove('is-active', 'is-revealed');
        }
      });

      if (hudChapter) hudChapter.textContent = activeChapterLabel;
      if (hudSpeed) {
        const speed = Math.round(progress * (cfg.hero.telemetry.speedMaxKmH || 118));
        hudSpeed.textContent = String(speed).padStart(3, '0') + ' KM/H';
      }
      if (hudDistance) {
        const dist = (progress * (cfg.hero.telemetry.distanceMaxKm || 4.2)).toFixed(1);
        hudDistance.textContent = dist + ' KM';
      }

      requestAnimationFrame(updateHero);
    }

    requestAnimationFrame(updateHero);

    window.addEventListener('resize', () => {
      lastDrawnFrame = -1;
    }, { passive: true });
  }

  /* ==========================================================================
     7. SECTION 2 — STATEMENT (Word-by-word scroll reveal)
     ========================================================================== */
  function initStatementSection() {
    const quoteEl = document.getElementById('statement-quote');
    const statementSection = document.getElementById('statement');
    if (!quoteEl || !statementSection) return;

    const sentence = cfg.statement.sentence || "Every part was designed to disappear into one line of light.";
    const words = sentence.split(' ');
    quoteEl.innerHTML = '';

    const wordSpans = words.map((w) => {
      const span = document.createElement('span');
      span.className = 'word-token';
      span.textContent = w + ' ';
      quoteEl.appendChild(span);
      return span;
    });

    function updateStatementScroll() {
      const rect = statementSection.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const start = viewportH * 0.85;
      const end = viewportH * 0.25;
      const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);

      const totalWords = wordSpans.length;
      wordSpans.forEach((span, idx) => {
        const wordThreshold = idx / totalWords;
        span.style.opacity = progress > wordThreshold ? '1' : '0.15';
      });
    }

    window.addEventListener('scroll', updateStatementScroll, { passive: true });
    updateStatementScroll();
  }

  /* ==========================================================================
     8. SECTION 3 — CINEMA THEATER (The Night Drive Experience)
     ========================================================================== */
  function initCinemaTheater() {
    const cinemaSection = document.getElementById('cinema');
    const cinemaVideo = document.getElementById('cinema-video');
    const timecodeEl = document.getElementById('cinema-timecode');
    const btnPlay = document.getElementById('btn-cinema-play');
    const btnMute = document.getElementById('btn-cinema-mute');
    const btnScope = document.getElementById('btn-cinema-scope');
    const captionTitle = document.getElementById('cinema-caption-title');
    const captionDesc = document.getElementById('cinema-caption-desc');
    const scenePills = document.querySelectorAll('.scene-pill-btn');

    if (!cinemaSection || !cinemaVideo) return;

    const scenes = cfg.cinema.scenes || [];
    let currentSceneIdx = 0;

    // Timecode timer loop
    function updateTimecode() {
      if (cinemaVideo && timecodeEl) {
        const cur = cinemaVideo.currentTime || 0;
        const mins = String(Math.floor(cur / 60)).padStart(2, '0');
        const secs = String(Math.floor(cur % 60)).padStart(2, '0');
        const frames = String(Math.floor((cur % 1) * 24)).padStart(2, '0');
        timecodeEl.textContent = `${mins}:${secs}:${frames} REC`;
      }
      requestAnimationFrame(updateTimecode);
    }
    requestAnimationFrame(updateTimecode);

    // Scene Switcher
    function selectScene(index) {
      if (index < 0 || index >= scenes.length) return;
      currentSceneIdx = index;
      const sc = scenes[index];

      scenePills.forEach((p, idx) => {
        p.classList.toggle('active', idx === currentSceneIdx);
      });

      if (captionTitle) captionTitle.textContent = sc.title;
      if (captionDesc) captionDesc.textContent = sc.caption;

      cinemaVideo.style.opacity = '0.3';
      setTimeout(() => {
        cinemaVideo.src = sc.src;
        cinemaVideo.poster = sc.poster;
        cinemaVideo.load();
        cinemaVideo.play().catch(() => {});
        cinemaVideo.style.opacity = '1';
      }, 200);
    }

    scenePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const idx = parseInt(pill.getAttribute('data-scene'), 10);
        selectScene(idx);
      });
    });

    // Play / Pause toggle
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        if (cinemaVideo.paused) {
          cinemaVideo.play();
          btnPlay.querySelector('.btn-icon').textContent = '⏸';
          btnPlay.querySelector('.btn-text').textContent = 'PAUSE';
        } else {
          cinemaVideo.pause();
          btnPlay.querySelector('.btn-icon').textContent = '▶';
          btnPlay.querySelector('.btn-text').textContent = 'PLAY';
        }
      });
    }

    // Mute / Unmute toggle
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        cinemaVideo.muted = !cinemaVideo.muted;
        if (cinemaVideo.muted) {
          btnMute.querySelector('.btn-icon').textContent = '🔇';
          btnMute.querySelector('.btn-text').textContent = 'UNMUTE';
        } else {
          btnMute.querySelector('.btn-icon').textContent = '🔊';
          btnMute.querySelector('.btn-text').textContent = 'MUTED';
        }
      });
    }

    // Cinema Scope 2.39:1 Letterbox toggle
    if (btnScope) {
      btnScope.addEventListener('click', () => {
        cinemaSection.classList.toggle('scope-active');
        const isActive = cinemaSection.classList.contains('scope-active');
        btnScope.querySelector('.btn-text').textContent = isActive ? 'FULL VIEW' : 'CINEMA 2.39:1';
      });
    }
  }

  /* ==========================================================================
     9. SECTION 4 — DISMANTLE SCROLLYTELLING & CALLOUTS
     ========================================================================== */
  function initDismantleScrolly() {
    const wrapper = document.getElementById('dismantle');
    const canvas = document.getElementById('dismantle-canvas');
    if (!wrapper || !canvas) return;
    const ctx = canvas.getContext('2d');

    const progressFill = document.getElementById('dismantle-progress-fill');
    const calloutLayer = document.getElementById('callouts-layer');
    const calloutElementsContainer = document.getElementById('callout-elements');
    const calloutSvg = document.getElementById('callout-svg');

    const calloutsData = cfg.dismantle.callouts || [];
    calloutElementsContainer.innerHTML = '';

    const calloutDOMs = calloutsData.map((data) => {
      const item = document.createElement('div');
      item.className = 'callout-item';
      item.id = `callout-${data.id}`;

      const dot = document.createElement('div');
      dot.className = 'callout-pin-dot';
      dot.style.left = data.pinX + '%';
      dot.style.top = data.pinY + '%';

      const content = document.createElement('div');
      content.className = 'callout-content';
      content.style.left = data.cardX + '%';
      content.style.top = data.cardY + '%';

      const monoLabel = document.createElement('span');
      monoLabel.className = 'callout-mono';
      monoLabel.textContent = data.label;

      const bodyText = document.createElement('span');
      bodyText.className = 'callout-body';
      bodyText.textContent = data.description;

      content.appendChild(monoLabel);
      content.appendChild(bodyText);

      item.appendChild(dot);
      item.appendChild(content);
      calloutElementsContainer.appendChild(item);

      return { data, item, dot, content };
    });

    function updateCalloutLines() {
      if (!calloutSvg) return;
      const layerRect = calloutLayer.getBoundingClientRect();
      const w = layerRect.width;
      const h = layerRect.height;
      if (w === 0 || h === 0) return;

      let svgHtml = '';
      calloutDOMs.forEach((c) => {
        if (!c.item.classList.contains('is-visible')) return;
        const px = (c.data.pinX / 100) * w;
        const py = (c.data.pinY / 100) * h;
        const cx = (c.data.cardX / 100) * w;
        const cy = (c.data.cardY / 100) * h + 14;

        const midX = (px + cx) / 2;
        svgHtml += `<path d="M ${px} ${py} L ${midX} ${py} L ${cx} ${cy}" stroke="rgba(207,227,255,0.45)" stroke-width="1" fill="none" />`;
      });
      calloutSvg.innerHTML = svgHtml;
    }

    let currentFrame = 0;
    let targetFrame = 0;
    let lastDrawnFrame = -1;

    function updateDismantle() {
      const rect = wrapper.getBoundingClientRect();
      const scrollDist = wrapper.offsetHeight - window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / (scrollDist || 1), 0), 1);

      targetFrame = Math.round(progress * (dismantleStore.totalCount - 1));
      currentFrame += (targetFrame - currentFrame) * (cfg.motion.frameLerp || 0.15);
      const roundedFrame = Math.round(currentFrame);

      if (roundedFrame !== lastDrawnFrame) {
        const img = getNearestFrame(dismantleStore, roundedFrame);
        if (img) {
          renderFrameToCanvas(canvas, ctx, img);
          lastDrawnFrame = roundedFrame;
        }
      }

      if (progressFill) {
        progressFill.style.width = (progress * 100) + '%';
      }

      let needsSvgUpdate = false;
      calloutDOMs.forEach((c) => {
        const wasVisible = c.item.classList.contains('is-visible');
        const isVisible = progress >= c.data.triggerProgress;
        if (isVisible !== wasVisible) {
          c.item.classList.toggle('is-visible', isVisible);
          needsSvgUpdate = true;
        }
      });

      if (needsSvgUpdate) {
        updateCalloutLines();
      }

      requestAnimationFrame(updateDismantle);
    }

    requestAnimationFrame(updateDismantle);

    window.addEventListener('resize', () => {
      lastDrawnFrame = -1;
      updateCalloutLines();
    }, { passive: true });
  }

  /* ==========================================================================
     10. SECTION 5 — LINEUP ACCORDION (Debounced Hover & Commission Modal)
     ========================================================================== */
  function initLineupAccordion() {
    const accordion = document.getElementById('lineup-accordion');
    if (!accordion) return;

    const models = cfg.lineup.models || [];
    let activeIdx = cfg.lineup.defaultActiveIndex || 0;
    let hoverTimeout = null;

    accordion.innerHTML = '';

    const slideElements = models.map((model, idx) => {
      const slide = document.createElement('button');
      slide.className = `lineup-slide ${idx === activeIdx ? 'is-active' : ''}`;
      slide.setAttribute('role', 'tab');
      slide.setAttribute('aria-selected', idx === activeIdx ? 'true' : 'false');
      slide.setAttribute('aria-expanded', idx === activeIdx ? 'true' : 'false');
      slide.setAttribute('aria-label', `${model.name} — ${model.descriptor}`);
      slide.setAttribute('tabindex', '0');

      const floorLine = document.createElement('div');
      floorLine.className = 'slide-floor-line';
      slide.appendChild(floorLine);

      const closedView = document.createElement('div');
      closedView.className = 'slide-closed-view';

      const numEl = document.createElement('span');
      numEl.className = 'slide-number font-hud';
      numEl.textContent = model.indexStr;

      const rotatedName = document.createElement('span');
      rotatedName.className = 'slide-rotated-name font-hud';
      rotatedName.textContent = model.name;

      closedView.appendChild(numEl);
      closedView.appendChild(rotatedName);
      slide.appendChild(closedView);

      const bgCrop = document.createElement('img');
      bgCrop.className = 'slide-bg-crop';
      bgCrop.src = model.image;
      bgCrop.alt = '';
      bgCrop.loading = 'lazy';
      slide.appendChild(bgCrop);

      const carStage = document.createElement('div');
      carStage.className = 'slide-car-stage';
      const carImg = document.createElement('img');
      carImg.className = 'slide-car-image';
      carImg.src = model.image;
      carImg.alt = model.alt;
      carImg.loading = 'lazy';
      carStage.appendChild(carImg);
      slide.appendChild(carStage);

      const openView = document.createElement('div');
      openView.className = 'slide-open-view';

      const openTop = document.createElement('div');
      openTop.className = 'slide-open-top';

      const openName = document.createElement('h3');
      openName.className = 'slide-open-name font-display';
      openName.textContent = model.name;

      const openDesc = document.createElement('span');
      openDesc.className = 'slide-open-descriptor';
      openDesc.textContent = model.descriptor;

      openTop.appendChild(openName);
      openTop.appendChild(openDesc);

      const openBottom = document.createElement('div');
      openBottom.className = 'slide-open-bottom';

      const specsGrid = document.createElement('div');
      specsGrid.className = 'slide-specs-grid';
      model.specs.forEach((s) => {
        const cell = document.createElement('div');
        cell.className = 'spec-cell';
        const lbl = document.createElement('span');
        lbl.className = 'spec-cell-label';
        lbl.textContent = s.label;
        const val = document.createElement('span');
        val.className = 'spec-cell-value';
        val.textContent = s.value;
        cell.appendChild(lbl);
        cell.appendChild(val);
        specsGrid.appendChild(cell);
      });

      const actionsRow = document.createElement('div');
      actionsRow.className = 'slide-actions-row';

      const swatchesRow = document.createElement('div');
      swatchesRow.className = 'color-swatches-row';
      model.swatches.forEach((hex, sIdx) => {
        const sw = document.createElement('div');
        sw.className = `color-swatch-box ${sIdx === 0 ? 'is-active' : ''}`;
        sw.style.backgroundColor = hex;
        sw.title = (model.swatchNames && model.swatchNames[sIdx]) || hex;
        sw.addEventListener('click', (e) => {
          e.stopPropagation();
          swatchesRow.querySelectorAll('.color-swatch-box').forEach((b) => b.classList.remove('is-active'));
          sw.classList.add('is-active');
        });
        swatchesRow.appendChild(sw);
      });

      const configBtn = document.createElement('button');
      configBtn.type = 'button';
      configBtn.className = 'slide-config-btn font-hud';
      configBtn.textContent = model.linkText || 'Configure Model →';
      configBtn.setAttribute('data-cursor', 'CONFIGURE');
      configBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.openCommission(idx);
      });

      actionsRow.appendChild(swatchesRow);
      actionsRow.appendChild(configBtn);

      openBottom.appendChild(specsGrid);
      openBottom.appendChild(actionsRow);

      openView.appendChild(openTop);
      openView.appendChild(openBottom);
      slide.appendChild(openView);

      slide.addEventListener('mouseenter', () => {
        if (isMobileViewport()) return;
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          setActiveSlide(idx);
        }, cfg.motion.hoverDebounceMs || 80);
      });

      slide.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
      });

      slide.addEventListener('click', () => {
        setActiveSlide(idx);
      });

      slide.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (idx + 1) % models.length;
          slideElements[next].focus();
          setActiveSlide(next);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = (idx - 1 + models.length) % models.length;
          slideElements[prev].focus();
          setActiveSlide(prev);
        }
      });

      accordion.appendChild(slide);
      return slide;
    });

    function setActiveSlide(index) {
      if (index === activeIdx) return;
      activeIdx = index;
      slideElements.forEach((s, idx) => {
        const isActive = idx === activeIdx;
        s.classList.toggle('is-active', isActive);
        s.setAttribute('aria-selected', isActive ? 'true' : 'false');
        s.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      });
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          slideElements.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(40px)';
            el.style.transition = `opacity 0.8s var(--ease) ${i * 0.08}s, transform 0.8s var(--ease) ${i * 0.08}s, flex-grow 0.7s var(--ease)`;
            requestAnimationFrame(() => {
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            });
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    observer.observe(accordion);
  }

  /* ==========================================================================
     11. COMMISSIONING MODAL
     ========================================================================== */
  function initCommissionModal() {
    const modal = document.getElementById('commission-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const closeBtn = document.getElementById('modal-close-btn');
    const openBtn = document.getElementById('btn-open-commission');
    const modalTitle = document.getElementById('modal-title');
    const modalImg = document.getElementById('modal-car-img');
    const specsRow = document.getElementById('modal-specs-row');
    const successMsg = document.getElementById('modal-success-msg');

    if (!modal) return;

    window.openCommission = function (modelIdx = 0) {
      const models = cfg.lineup.models || [];
      const m = models[modelIdx] || models[0];

      if (modalTitle) modalTitle.textContent = m.name;
      if (modalImg) {
        modalImg.src = m.image;
        modalImg.alt = m.alt;
      }

      if (specsRow) {
        specsRow.innerHTML = '';
        m.specs.forEach((s) => {
          const col = document.createElement('div');
          col.innerHTML = `<span class="text-dim" style="display:block;font-size:9px;">${s.label}</span><strong>${s.value}</strong>`;
          specsRow.appendChild(col);
        });
      }

      if (successMsg) successMsg.style.display = 'none';
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (backdrop) backdrop.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (openBtn) openBtn.addEventListener('click', () => window.openCommission(0));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    window.submitCommission = function () {
      if (successMsg) {
        successMsg.style.display = 'block';
        setTimeout(closeModal, 2200);
      }
    };
  }

  /* ==========================================================================
     12. INITIALIZATION
     ========================================================================== */
  window.addEventListener('DOMContentLoaded', () => {
    initFilmGrain();
    initCustomCursor();
    initNavigation();
    initStatementSection();
    initCinemaTheater();
    initLineupAccordion();
    initCommissionModal();

    preloadSequence(() => {
      initHeroScrolly();
      initDismantleScrolly();
    });
  });

})();
