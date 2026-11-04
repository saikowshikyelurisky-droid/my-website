/**
 * NOCTIS — Main Engine
 * Vanilla JavaScript implementation of scrollytelling image scrubbers,
 * custom headlight cursor, accordion lineup, HUD telemetry, and film grain.
 */

(function () {
  'use strict';

  const cfg = window.NOCTIS_CONFIG;
  if (!cfg) {
    console.error('NOCTIS: config.js must be loaded before main.js');
    return;
  }

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) {
    document.body.classList.add('reduced-motion');
  }

  // Mobile viewport detection
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

    // Create a 128x128 offscreen noise tile
    const tileSize = 128;
    const tile = document.createElement('canvas');
    tile.width = tileSize;
    tile.height = tileSize;
    const tCtx = tile.getContext('2d');
    const imgData = tCtx.createImageData(tileSize, tileSize);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const val = (Math.random() * 255) | 0;
      data[i] = val;     // R
      data[i + 1] = val; // G
      data[i + 2] = val; // B
      data[i + 3] = 255; // A
    }
    tCtx.putImageData(imgData, 0, 0);

    function resizeGrain() {
      grainCanvas.width = window.innerWidth;
      grainCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeGrain, { passive: true });
    resizeGrain();

    // Redraw pattern with random shift ~8 times per second (125ms interval)
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

    // Cursor tracking with lerp
    function cursorLoop() {
      const lerp = cfg.motion.cursorLerp || 0.18;
      cursorX += (mouseX - cursorX) * lerp;
      cursorY += (mouseY - cursorY) * lerp;

      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      requestAnimationFrame(cursorLoop);
    }
    requestAnimationFrame(cursorLoop);

    // Hover detection delegation
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-cursor], a, button, .lineup-slide');
      if (target) {
        cursor.classList.add('is-hovered');

        // Lineup slide specific cursor
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
    let initialRevealed = false;

    // Helper to decode an Image
    function loadSingleFrame(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        if (img.decode) {
          img.decode()
            .then(() => resolve(img))
            .catch(() => resolve(img)); // Fallback if decode errors
        } else {
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
        }
      });
    }

    // Step 1: Preload initial hero frames (1..40)
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

    Promise.all(initialPromises).then(() => {
      initialRevealed = true;
      if (preloader) {
        preloader.classList.add('flash');
        setTimeout(() => {
          preloader.classList.add('is-finished');
          if (onInitialComplete) onInitialComplete();
        }, 150);
      } else if (onInitialComplete) {
        onInitialComplete();
      }

      // Step 2: Continue background loading of remaining Hero frames (41..598)
      loadRemainingFrames('hero', initialHeroTarget + 1, heroStore.totalCount, heroStore, () => {
        heroStore.isReady = true;
        // Step 3: Preload Dismantle frames (1..200) in order
        loadRemainingFrames('dismantle', 1, dismantleStore.totalCount, dismantleStore, () => {
          dismantleStore.isReady = true;
        });
      });
    });

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
          // Schedule next batch on idle
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

  // Draw nearest loaded frame if current frame is still loading
  function getNearestFrame(store, requestedIndex) {
    if (store.images[requestedIndex] && store.images[requestedIndex].complete) {
      return store.images[requestedIndex];
    }
    // Search outwards
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
     5. CANVAS RENDERING ENGINE (Cover-fit on landscape, contain-fit on portrait)
     ========================================================================== */
  function renderFrameToCanvas(canvas, ctx, img) {
    if (!canvas || !ctx || !img) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    ctx.fillStyle = cfg.colors.asphalt;
    ctx.fillRect(0, 0, cW, cH);

    const isLandscape = cW >= cH;
    let drawW, drawH, drawX, drawY;

    if (isLandscape) {
      // Cover-fit
      const scale = Math.max(cW / imgW, cH / imgH);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = (cW - drawW) * 0.5;
      drawY = (cH - drawH) * 0.5;
    } else {
      // Portrait: Contain-fit, vertically centered on --asphalt so car is never cropped
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
     6. SECTION 1 — HERO SCROLLYTELLING
     ========================================================================== */
  function initHeroScrolly() {
    const wrapper = document.getElementById('hero');
    const canvas = document.getElementById('hero-canvas');
    if (!wrapper || !canvas) return;
    const ctx = canvas.getContext('2d');

    const blackFade = document.getElementById('hero-black-fade');
    const progressFill = document.getElementById('hero-progress-fill');
    const hudChapter = document.getElementById('hud-chapter-val');
    const hudSpeed = document.getElementById('hud-speed-val');
    const hudDistance = document.getElementById('hud-distance-val');

    const chapters = [
      { el: document.getElementById('ch-1'), start: 0.00, end: 0.15, label: '01/04' },
      { el: document.getElementById('ch-2'), start: 0.20, end: 0.42, label: '02/04' },
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

      // Target frame 0..597
      targetFrame = Math.round(progress * (heroStore.totalCount - 1));

      // Lerp frame
      currentFrame += (targetFrame - currentFrame) * (cfg.motion.frameLerp || 0.15);
      const roundedFrame = Math.round(currentFrame);

      if (roundedFrame !== lastDrawnFrame) {
        const img = getNearestFrame(heroStore, roundedFrame);
        if (img) {
          renderFrameToCanvas(canvas, ctx, img);
          lastDrawnFrame = roundedFrame;
        }
      }

      // Progress bar fill
      if (progressFill) {
        progressFill.style.width = (progress * 100) + '%';
      }

      // Fade canvas to solid black over last 5% (0.95 -> 1.00)
      if (blackFade) {
        const fadeProg = Math.min(Math.max((progress - 0.95) / 0.05, 0), 1);
        blackFade.style.opacity = fadeProg;
      }

      // Chapter activation
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

      // Left-edge HUD telemetry
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
      lastDrawnFrame = -1; // force redraw on resize
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
      // Calculate progress while section passes center of viewport
      const start = viewportH * 0.85;
      const end = viewportH * 0.25;
      const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);

      const totalWords = wordSpans.length;
      wordSpans.forEach((span, idx) => {
        const wordThreshold = idx / totalWords;
        if (progress > wordThreshold) {
          span.style.opacity = '1';
        } else {
          span.style.opacity = '0.15';
        }
      });
    }

    window.addEventListener('scroll', updateStatementScroll, { passive: true });
    updateStatementScroll();
  }

  /* ==========================================================================
     8. SECTION 3 — DISMANTLE SCROLLYTELLING & 4 CALLOUTS
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

    // Build callout DOM elements from config
    const calloutsData = cfg.dismantle.callouts || [];
    calloutElementsContainer.innerHTML = '';

    const calloutDOMs = calloutsData.map((data) => {
      const item = document.createElement('div');
      item.className = 'callout-item';
      item.id = `callout-${data.id}`;

      // Xenon pin dot on vehicle part
      const dot = document.createElement('div');
      dot.className = 'callout-pin-dot';
      dot.style.left = data.pinX + '%';
      dot.style.top = data.pinY + '%';

      // Text block
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

      return {
        data,
        item,
        dot,
        content,
      };
    });

    // Draw 1px hairlines connecting pin dots to labels
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
        const cy = (c.data.cardY / 100) * h + 14; // align with label text baseline

        // Crisp 1px orthogonal hairline
        const midX = (px + cx) / 2;
        svgHtml += `<path d="M ${px} ${py} L ${midX} ${py} L ${cx} ${cy}" stroke="rgba(207,227,255,0.4)" stroke-width="1" fill="none" />`;
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

      // Callout triggers (after 70% progress, fading in one by one)
      let needsSvgUpdate = false;
      calloutDOMs.forEach((c) => {
        const wasVisible = c.item.classList.contains('is-visible');
        const isVisible = progress >= c.data.triggerProgress;
        if (isVisible !== wasVisible) {
          if (isVisible) {
            c.item.classList.add('is-visible');
          } else {
            c.item.classList.remove('is-visible');
          }
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
     9. SECTION 4 — LINEUP ACCORDION (Debounced Hover, Keyboard, Mobile)
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

      // Shared floor line at 72%
      const floorLine = document.createElement('div');
      floorLine.className = 'slide-floor-line';
      slide.appendChild(floorLine);

      // Closed state view
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

      // Closed background cropped image
      const bgCrop = document.createElement('img');
      bgCrop.className = 'slide-bg-crop';
      bgCrop.src = model.image;
      bgCrop.alt = '';
      bgCrop.loading = 'lazy';
      slide.appendChild(bgCrop);

      // Open state car image stage
      const carStage = document.createElement('div');
      carStage.className = 'slide-car-stage';
      const carImg = document.createElement('img');
      carImg.className = 'slide-car-image';
      carImg.src = model.image;
      carImg.alt = model.alt;
      carImg.loading = 'lazy';
      carStage.appendChild(carImg);
      slide.appendChild(carStage);

      // Open state full details
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

      // 3-column specs grid
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

      // Actions row (swatches & configure link)
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
          swatchesRow.querySelectorAll('.color-swatch-box').forEach((box) => box.classList.remove('is-active'));
          sw.classList.add('is-active');
        });
        swatchesRow.appendChild(sw);
      });

      const configLink = document.createElement('a');
      configLink.href = '#reserve';
      configLink.className = 'slide-config-link';
      configLink.textContent = model.linkText || 'Configure →';
      configLink.setAttribute('data-cursor', 'CONFIGURE');

      actionsRow.appendChild(swatchesRow);
      actionsRow.appendChild(configLink);

      openBottom.appendChild(specsGrid);
      openBottom.appendChild(actionsRow);

      openView.appendChild(openTop);
      openView.appendChild(openBottom);
      slide.appendChild(openView);

      // Event handlers: debounced hover (80ms)
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

      // Click / Tap
      slide.addEventListener('click', () => {
        setActiveSlide(idx);
      });

      // Keyboard arrow navigation
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

    // Scroll into view reveal stagger (slides rise 40px and fade in one after another)
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
     10. INITIALIZATION
     ========================================================================== */
  window.addEventListener('DOMContentLoaded', () => {
    initFilmGrain();
    initCustomCursor();
    initNavigation();
    initStatementSection();
    initLineupAccordion();

    // Start preloader and scrollytelling sequences
    preloadSequence(() => {
      initHeroScrolly();
      initDismantleScrolly();
    });
  });

})();

