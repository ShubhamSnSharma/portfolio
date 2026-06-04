/* ═══════════════════════════════════════════════════════
   Shubham Sharma — Portfolio Experience
   All Chapter I interactions
   ═══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* ────────────────────────────────────────────────
     1. LENIS SMOOTH SCROLL
     ──────────────────────────────────────────────── */
  let lenis = null;

  function initLenis() {
    if (typeof Lenis === "undefined") return;

    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Let Lenis handle anchor clicks
    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const target = document.querySelector(anchor.getAttribute("href"));
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: 0 });
        }
      });
    });
  }

  /* ────────────────────────────────────────────────
     2. ENTRY ANIMATION (staggered fade-in)
     ──────────────────────────────────────────────── */
  function initEntryAnimation() {
    // Small delay so the browser finishes layout
    requestAnimationFrame(() => {
      const entries = $$(".anim-entry");
      entries.forEach((el) => {
        const delay = parseInt(el.dataset.delay || 0, 10);
        setTimeout(() => {
          el.style.opacity = "";
          el.style.transform = "";
          // Remove the class after the transition completes (0.9s = 900ms)
          // to prevent transition lag during scroll and parallax events
          setTimeout(() => {
            el.classList.remove("anim-entry");
          }, 900);
        }, delay);
      });

      // Remove the loading flag after all entries have animated (1400ms max delay + 900ms transition)
      setTimeout(() => {
        document.body.removeAttribute("data-loading");
      }, 2300);
    });
  }

  /* ────────────────────────────────────────────────
     3. PORTRAIT REVEAL + PARALLAX + TITLE TRACKING
     ──────────────────────────────────────────────── */
  const stage = $("[data-portrait-stage]");
  const hero = $(".hero");

  const reveal = {
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    targetSize: 0,
    currentSize: 0,
    hasPointer: false,
    // Parallax
    parallaxTargetX: 0,
    parallaxTargetY: 0,
    parallaxCurrentX: 0,
    parallaxCurrentY: 0,
    // Title transition tracking
    totalDistance: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    titleProgress: 0,
  };

  let currentScrollScale = 1.0;

  // High-performance state-driven requestAnimationFrame loop controls
  let isLoopActive = false;
  let rafHandle = null;

  function requestRender() {
    if (!isLoopActive) {
      isLoopActive = true;
      rafHandle = requestAnimationFrame(animateReveal);
    }
  }

  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  function setTargetFromEvent(event) {
    if (document.body.hasAttribute("data-test-registration")) return;
    const rect = stage.getBoundingClientRect();
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

    reveal.targetX = x;
    reveal.targetY = y;

    // Mobile: smaller reveal circle
    const maxSize = isMobile ? 420 : 820;
    const minSize = isMobile ? 280 : 520;
    reveal.targetSize = Math.min(Math.max(rect.width * 0.34, minSize), maxSize);

    // Parallax — map cursor to -6..6px range
    if (!isMobile) {
      const cx = (event.clientX / window.innerWidth - 0.5) * 2;
      const cy = (event.clientY / window.innerHeight - 0.5) * 2;
      reveal.parallaxTargetX = cx * 6;
      reveal.parallaxTargetY = cy * 4;
    }

    // Track movement distance for title transition
    if (reveal.hasPointer) {
      const dx = x - reveal.lastPointerX;
      const dy = y - reveal.lastPointerY;
      reveal.totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    reveal.lastPointerX = x;
    reveal.lastPointerY = y;

    if (!reveal.hasPointer) {
      reveal.currentX = x;
      reveal.currentY = y;
      reveal.hasPointer = true;
    }

    // Wake up the render loop to update position dynamically
    requestRender();
  }

  if (stage) {
    // Desktop pointer events
    stage.addEventListener("pointermove", setTargetFromEvent);
    stage.addEventListener("pointerenter", setTargetFromEvent);
    stage.addEventListener("pointerleave", () => {
      reveal.targetSize = 0;
      requestRender();
    });

    // Mobile touch events for reveal
    if (isTouchDevice) {
      stage.addEventListener("touchmove", (e) => {
        e.preventDefault();
        setTargetFromEvent(e);
      }, { passive: false });
      stage.addEventListener("touchstart", (e) => {
        setTargetFromEvent(e);
      });
      stage.addEventListener("touchend", () => {
        reveal.targetSize = 0;
        requestRender();
      });
    }
  }

  /* ────────────────────────────────────────────────
     4. LEARNER → BUILDER TITLE TRANSITION
     ──────────────────────────────────────────────── */
  // Threshold: after ~4000px of cumulative cursor movement, fully transition
  const TITLE_THRESHOLD = 4000;

  function updateTitleProgress() {
    const raw = Math.min(reveal.totalDistance / TITLE_THRESHOLD, 1);
    // Smooth easing
    const eased = raw < 0.5
      ? 2 * raw * raw
      : 1 - Math.pow(-2 * raw + 2, 2) / 2;

    reveal.titleProgress += (eased - reveal.titleProgress) * 0.05;

    document.documentElement.style.setProperty(
      "--title-progress",
      reveal.titleProgress.toFixed(4)
    );
  }

  /* ────────────────────────────────────────────────
     5. MAIN ANIMATION LOOP (portrait + parallax + title)
     ──────────────────────────────────────────────── */
  /* ────────────────────────────────────────────────
     4.5 DYNAMIC EYE COORDINATES
     ──────────────────────────────────────────────── */
  function updateEyeCoordinates() {
    if (!stage) return { eyeX: 0, eyeY: 0 };
    const rect = stage.getBoundingClientRect();
    const containerAspectRatio = rect.width / rect.height;
    const imageAspectRatio = 1672 / 941;
    const xEyePct = 0.4418;
    const yEyePct = 0.285;

    let eyeX = 0;
    let eyeY = 0;

    if (containerAspectRatio > imageAspectRatio) {
      // Container is wider than the image (cropped vertically, scaled by width)
      const scaledHeight = rect.width / imageAspectRatio;
      const yOffset = (rect.height - scaledHeight) / 2;
      eyeX = xEyePct * rect.width;
      eyeY = yOffset + yEyePct * scaledHeight;
    } else {
      // Container is taller than the image (cropped horizontally, scaled by height)
      const scaledWidth = rect.height * imageAspectRatio;
      const xOffset = (rect.width - scaledWidth) / 2;
      eyeX = xOffset + xEyePct * scaledWidth;
      eyeY = yEyePct * rect.height;
    }

    const s = stage.style;
    s.setProperty("--eye-x", `${eyeX}px`);
    s.setProperty("--eye-y", `${eyeY}px`);
    return { eyeX, eyeY };
  }

  /* ────────────────────────────────────────────────
     5. MAIN ANIMATION LOOP (portrait + parallax + title)
     ──────────────────────────────────────────────── */
  function animateReveal() {
    if (document.body.hasAttribute("data-test-registration")) {
      isLoopActive = false;
      rafHandle = null;
      return;
    }
    if (stage) {
      // Lerp reveal position
      const dx = reveal.targetX - reveal.currentX;
      const dy = reveal.targetY - reveal.currentY;
      const ds = reveal.targetSize - reveal.currentSize;

      // Lerp parallax
      const dpx = reveal.parallaxTargetX - reveal.parallaxCurrentX;
      const dpy = reveal.parallaxTargetY - reveal.parallaxCurrentY;

      // Check if anything is still moving or lerping
      const isMoving = Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(ds) > 0.05;
      const isParallaxMoving = Math.abs(dpx) > 0.05 || Math.abs(dpy) > 0.05;

      const targetTitleProgress = Math.min(reveal.totalDistance / TITLE_THRESHOLD, 1);
      const isTitleMoving = Math.abs(targetTitleProgress - reveal.titleProgress) > 0.001;

      if (isMoving || isParallaxMoving || isTitleMoving) {
        reveal.currentX += dx * 0.42;
        reveal.currentY += dy * 0.42;
        reveal.currentSize += ds * 0.34;

        reveal.parallaxCurrentX += dpx * 0.08;
        reveal.parallaxCurrentY += dpy * 0.08;

        // Correct for parallax translation and zoom scale to keep mask centered exactly under cursor
        const { eyeX, eyeY } = updateEyeCoordinates();
        const revealScale = 1.05 * currentScrollScale;
        const maskX = eyeX + (reveal.currentX - eyeX - reveal.parallaxCurrentX) / revealScale;
        const maskY = eyeY + (reveal.currentY - eyeY - reveal.parallaxCurrentY) / revealScale;

        const s = stage.style;
        const safeSize = Math.max(reveal.currentSize, 0.5);
        s.setProperty("--mask-x", `${maskX}px`);
        s.setProperty("--mask-y", `${maskY}px`);
        s.setProperty("--mask-size", `${safeSize}px`);
        s.setProperty("--mask-inner", `${safeSize * 0.26}px`);
        s.setProperty("--mask-mid", `${safeSize * 0.48}px`);
        s.setProperty("--mask-outer", `${safeSize * 0.68}px`);
        s.setProperty("--mask-opacity", `${Math.min(reveal.currentSize / 200, 1.0)}`);
        s.setProperty("--aura-size", `${safeSize * 0.92}px`);

        // Parallax on portraits
        s.setProperty("--parallax-x", `${reveal.parallaxCurrentX}px`);
        s.setProperty("--parallax-y", `${reveal.parallaxCurrentY}px`);

        // Title transition
        updateTitleProgress();
      }

      // If anything is still moving or lerping, keep the loop active
      if (isMoving || isParallaxMoving || isTitleMoving) {
        rafHandle = requestAnimationFrame(animateReveal);
      } else {
        isLoopActive = false;
        rafHandle = null;
      }
    } else {
      isLoopActive = false;
      rafHandle = null;
    }
  }

  /* ────────────────────────────────────────────────
     6. FLOATING GOLD PARTICLES
     ──────────────────────────────────────────────── */
  function initParticles() {
    const canvas = $("#particles");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let W, H;
    const particles = [];
    const COUNT = isMobile ? 18 : 30;

    const activeBursts = [];
    let flashOpacity = 0;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.08 - Math.random() * 0.14,
        alpha: 0.06 + Math.random() * 0.18,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.01,
      });
    }

    // Helper to draw jagged crack line segments
    function drawJaggedLine(ctx, x1, y1, angle, segments, segmentLength, opacity) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      let cx = x1;
      let cy = y1;
      for (let i = 0; i < segments; i++) {
        const devAngle = angle + (Math.random() - 0.5) * 0.9;
        cx += Math.cos(devAngle) * segmentLength;
        cy += Math.sin(devAngle) * segmentLength;
        ctx.lineTo(cx, cy);
      }
      ctx.strokeStyle = `rgba(255, 235, 190, ${opacity})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    window.triggerSkyShots = function () {
      // 1. Staggered full-screen ambient flashes
      flashOpacity = 0.55; // First bright flash

      setTimeout(() => {
        flashOpacity = 0.35; // Second flash
      }, 150);

      setTimeout(() => {
        flashOpacity = 0.50; // Third flash
      }, 300);

      // 2. Generate random coordinate crack bursts
      const burstCount = isMobile ? 5 : 10;
      for (let b = 0; b < burstCount; b++) {
        const cx = Math.random() * W;
        const cy = Math.random() * H;

        // Generate crack branch definitions
        const branches = [];
        const branchCount = 3 + Math.floor(Math.random() * 3); // 3-5 branches
        for (let j = 0; j < branchCount; j++) {
          branches.push({
            angle: (j / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
            segments: 3 + Math.floor(Math.random() * 3),
            segmentLength: 15 + Math.random() * 20
          });
        }

        // Generate radial sparks
        const sparks = [];
        const sparkCount = 15 + Math.floor(Math.random() * 15); // 15-30 sparks
        for (let s = 0; s < sparkCount; s++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2.0 + Math.random() * 6.0;
          sparks.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: 0.01 + Math.random() * 0.015,
            size: 1.0 + Math.random() * 1.8
          });
        }

        activeBursts.push({
          x: cx,
          y: cy,
          branches: branches,
          sparks: sparks,
          life: 1.0,
          decay: 0.012 + Math.random() * 0.008
        });
      }
    };

    function drawParticles() {
      ctx.clearRect(0, 0, W, H);

      // 1. Draw fullscreen ambient flash if active
      if (flashOpacity > 0) {
        ctx.fillStyle = `rgba(255, 245, 220, ${flashOpacity})`;
        ctx.fillRect(0, 0, W, H);
        flashOpacity -= 0.022; // Decay flash opacity smoothly
        if (flashOpacity < 0) flashOpacity = 0;
      }

      // 2. Draw global background dust particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        // Wrap around
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;

        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 164, 77, ${alpha})`;
        ctx.fill();
      }

      // 3. Draw active sky crack bursts
      for (let i = activeBursts.length - 1; i >= 0; i--) {
        const b = activeBursts[i];
        b.life -= b.decay;

        if (b.life <= 0) {
          activeBursts.splice(i, 1);
          continue;
        }

        // A. Draw jagged lightning crack branches for the first fraction of life
        if (b.life > 0.82) {
          const crackOpacity = (b.life - 0.82) / 0.18; // Fades out lightning lines quickly
          b.branches.forEach(branch => {
            drawJaggedLine(ctx, b.x, b.y, branch.angle, branch.segments, branch.segmentLength, crackOpacity);
          });
        }

        // B. Update and draw exploding sparks
        b.sparks.forEach((sp, idx) => {
          sp.x += sp.vx;
          sp.y += sp.vy;
          // Apply deceleration
          sp.vx *= 0.94;
          sp.vy *= 0.94;
          // Gentle gravity drift down
          sp.vy += 0.05;
          sp.life -= sp.decay;

          if (sp.life > 0) {
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
            ctx.fillStyle = sp.life > 0.6
              ? `rgba(255, 255, 255, ${sp.life * 0.9})`
              : `rgba(212, 164, 77, ${sp.life * 0.8})`;
            ctx.fill();
          }
        });
      }

      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  /* ────────────────────────────────────────────────
     7. MENU OVERLAY
     ──────────────────────────────────────────────── */
  function initMenu() {
    const toggle = $("#menu-toggle");
    const overlay = $("#menu-overlay");
    const close = $("#menu-close");

    if (!toggle || !overlay) return;

    function openMenu() {
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
    }

    function closeMenu() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lenis) lenis.start();
    }

    toggle.addEventListener("click", openMenu);
    if (close) close.addEventListener("click", closeMenu);

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) {
        closeMenu();
      }
    });

    // Close when clicking a chapter link
    overlay.querySelectorAll(".menu-link").forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });
  }

  /* ────────────────────────────────────────────────
     8. CHAPTER I → II SCROLL TRANSITION
     ──────────────────────────────────────────────── */
  function initScrollTransition() {
    if (!hero) return;

    const spark = $("#ch1-spark");

    function onScroll() {
      if (document.body.hasAttribute("data-test-registration")) return;
      // Use window.scrollY directly to avoid layout thrashing from getBoundingClientRect
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const vh = window.innerHeight;

      // Progress goes from 0 to 1 over the sticky scroll height (40vh)
      const stickyScrollDistance = vh * 0.4;
      let progress = scrollY / stickyScrollDistance;
      progress = Math.max(0, Math.min(1, progress));

      // Choreographed values for premium motion feeling
      const uiFade = Math.max(0, 1 - progress * 5.0); // UI fades out quickly by 0.20 progress
      const uiPe = uiFade < 0.05 ? "none" : "auto";

      // Preserve face visibility: keep portrait fully opaque until 0.65 depth, then decay to 0 by 0.90
      const portraitFade = progress < 0.65
        ? 1.0
        : Math.max(0, 1 - (progress - 0.65) / 0.25);

      // Cinematic zoom limited to 2x (i.e. scale from 1.0 to 2.0)
      const scale = 1 + Math.pow(progress, 1.8) * 1.0;

      // Reduce arc dominance: keep arc subtle, peak at 0.35, dissolve early by 0.7 depth
      const arcOpacity = progress < 0.35
        ? 0.24 + (progress / 0.35) * 0.11
        : Math.max(0, 0.35 - ((progress - 0.35) / 0.35) * 0.35);

      const portraitPe = portraitFade < 0.1 ? "none" : "auto";

      // Double-exposure cinematic transition overlay fade (fades in over eyes, holds, fades out in sync)
      let bridgeFade = 0;
      if (progress > 0.25 && progress <= 0.50) {
        bridgeFade = (progress - 0.25) / 0.25;
      } else if (progress > 0.50 && progress <= 0.65) {
        bridgeFade = 1.0;
      } else if (progress > 0.65 && progress <= 0.85) {
        bridgeFade = Math.max(0, 1 - (progress - 0.65) / 0.20);
      }

      // Cinematic slow rising movement (from 24px down to -24px up)
      const bridgeY = 24 - progress * 48;

      currentScrollScale = scale;

      hero.style.setProperty("--ch1-ui-fade", uiFade.toFixed(4));
      hero.style.setProperty("--ch1-ui-pe", uiPe);
      hero.style.setProperty("--ch1-portrait-fade", portraitFade.toFixed(4));
      hero.style.setProperty("--ch1-portrait-pe", portraitPe);
      hero.style.setProperty("--ch1-scale", scale.toFixed(4));
      hero.style.setProperty("--ch1-arc-opacity", arcOpacity.toFixed(4));

      // Continuous Color Interpolation: Electric Blue -> Deep Navy -> Charcoal -> Black
      let r = 20, g = 34, b = 58, a = 0.5;
      if (progress <= 0.3) {
        const factor = progress / 0.3;
        r = 20 - factor * 8;      // 20 -> 12
        g = 34 - factor * 16;     // 34 -> 18
        b = 58 - factor * 28;     // 58 -> 30
        a = 0.5 - factor * 0.2;   // 0.5 -> 0.3
      } else if (progress <= 0.7) {
        const factor = (progress - 0.3) / 0.4;
        r = 12 - factor * 7;      // 12 -> 5
        g = 18 - factor * 11;     // 18 -> 7
        b = 30 - factor * 19;     // 30 -> 11
        a = 0.3 - factor * 0.2;   // 0.3 -> 0.1
      } else {
        const factor = Math.min(1, (progress - 0.7) / 0.3);
        r = 5 - factor * 5;       // 5 -> 0
        g = 7 - factor * 7;       // 7 -> 0
        b = 11 - factor * 11;     // 11 -> 0
        a = 0.1 - factor * 0.1;   // 0.1 -> 0
      }
      hero.style.setProperty("--ch1-ambient-glow", `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(3)})`);
      hero.style.setProperty("--ch1-bg-fade", progress.toFixed(4));

      // Fade in the spark centered on eye coordinates near the end of zoom
      if (spark) {
        if (progress > 0.80) {
          spark.classList.add("visible");
        } else {
          spark.classList.remove("visible");
        }
      }

      // Set bridge properties
      hero.style.setProperty("--bridge-fade", bridgeFade.toFixed(4));
      hero.style.setProperty("--bridge-y", `${bridgeY.toFixed(2)}px`);

      // Wake up the state-driven render loop to update positions
      requestRender();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // Initial check
  }

  /* ────────────────────────────────────────────────
     8.5 CHAPTER II SCROLL REVEAL OBSERVER
     ──────────────────────────────────────────────── */
  function initChapter2Observer() {
    if (typeof IntersectionObserver === "undefined") {
      $$(".ch2-reveal-target").forEach((el) => el.classList.add("revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    $$(".ch2-reveal-target").forEach((el) => {
      observer.observe(el);
    });
  }

  /* ────────────────────────────────────────────────
     8.6 THE WINDING NIGHT MAP JOURNEY (CONCEPT F REFINED)
     ──────────────────────────────────────────────── */
  function initTopographyJourney() {
    const wrapper = $("#journey-wrapper");
    const journey = $("#journey");
    const path = $("#journey-path");
    const pathAncient = $("#journey-path-ancient");
    const node = $("#glowing-node");
    const scrollWrapper = $("#path-scroll-wrapper");
    const intro = $("#ch2-intro");
    const pathScene = $("#ch2-path-scene");
    const climax = $("#turning-point");
    const exit = $("#exit");

    // Dual parallax topographic layers
    const topoFar = $(".ch2-topo-far");
    const topoNear = $(".ch2-topo-near");

    if (!wrapper || !journey || !path || !node || !scrollWrapper) return;

    let pathLength = 0;
    let wrapperOffset = 0;
    let wrapperHeight = 0;
    let scrollLength = 0;

    const canvas = $("#ch2-canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    const floaterElements = $$(".ch2-floater");
    let particles = [];
    let nodeGlowBoost = 0;
    let latestNodeX = 500;
    let latestNodeY = 100;
    let isCanvasLoopRunning = false;
    let canvasRafId = null;

    let isJourneyTransitionPlaying = false;
    let hasPlayedJourney = false;
    let transitionStartTime = 0;
    let transitionRafId = null;

    const floaters = [
      { x: 200, y: 300, text: "HOW DOES THIS WORK?", active: false, particlesEmitted: false, el: floaterElements[0] },
      { x: 650, y: 420, text: "CAN I BUILD THIS?", active: false, particlesEmitted: false, el: floaterElements[1] },
      { x: 350, y: 580, text: "WHAT IF I FAIL?", active: false, particlesEmitted: false, el: floaterElements[2] },
      { x: 800, y: 700, text: "WHAT IF IT WORKS?", active: false, particlesEmitted: false, el: floaterElements[3] }
    ];

    function emitInsightParticles(startX, startY) {
      for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 4.0;
        particles.push({
          x: startX + (Math.random() - 0.5) * 40,
          y: startY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          decay: 0.010 + Math.random() * 0.010,
          size: 1.2 + Math.random() * 2.0
        });
      }
    }

    function updateNodeVisuals() {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      let progress = (scrollY - wrapperOffset) / scrollLength;
      if (isNaN(progress)) progress = 0;
      progress = Math.max(0, Math.min(1, progress));

      let baseRadius = 8.5;
      let filterUrl = "url(#organic-glow)";

      if (isJourneyTransitionPlaying) return; // Managed by the frame loop

      if (progress > 0.90) {
        baseRadius = 16.0;
        filterUrl = "url(#organic-intense-glow)";
      } else if (progress > 0.75) {
        baseRadius = 12.0;
        filterUrl = "url(#organic-intense-glow)";
      } else {
        baseRadius = 8.5 + nodeGlowBoost * 4.5;
        if (nodeGlowBoost > 0.35) {
          filterUrl = "url(#organic-intense-glow)";
        }
      }

      node.setAttribute("r", baseRadius.toFixed(2));
      node.setAttribute("filter", filterUrl);
    }

    function animateParticles() {
      if (!isCanvasLoopRunning) return;

      if (ctx) {
        ctx.clearRect(0, 0, 1000, 1000);

        // Spawn embers continuously from the glowing lead node
        if (Math.random() < 0.35) {
          particles.push({
            x: latestNodeX,
            y: latestNodeY,
            vx: (Math.random() - 0.5) * 0.9,
            vy: -0.2 - Math.random() * 0.4,
            life: 1.0,
            decay: 0.012 + Math.random() * 0.012, // Lasts ~40-80 frames
            size: 1.2 + Math.random() * 1.5,
            isEmber: true
          });
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];

          if (p.isEmber) {
            // Embers float up and drift gently
            p.x += p.vx;
            p.y += p.vy;
            p.vy -= 0.004; // Gentle rising float force
            p.life -= p.decay;

            if (p.life <= 0) {
              particles.splice(i, 1);
              continue;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(212, 164, 77, " + (p.life * 0.75) + ")";
            ctx.fill();
            continue;
          }

          const dx = latestNodeX - p.x;
          const dy = latestNodeY - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 20) {
            particles.splice(i, 1);
            nodeGlowBoost = Math.min(1.0, nodeGlowBoost + 0.22);
            continue;
          }

          const force = 0.28;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;

          const speed = Math.hypot(p.vx, p.vy);
          const maxSpeed = 8.0;
          if (speed > maxSpeed) {
            p.vx = (p.vx / speed) * maxSpeed;
            p.vy = (p.vy / speed) * maxSpeed;
          }

          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;

          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(212, 164, 77, " + (p.life * 0.85) + ")";
          ctx.fill();
        }
      }

      if (nodeGlowBoost > 0) {
        nodeGlowBoost -= 0.025;
        if (nodeGlowBoost < 0) nodeGlowBoost = 0;
      }

      if (!isJourneyTransitionPlaying) {
        updateNodeVisuals();
      }

      canvasRafId = requestAnimationFrame(animateParticles);
    }

    function measureLayout() {
      pathLength = path.getTotalLength();
      path.style.strokeDasharray = pathLength;
      path.style.strokeDashoffset = pathLength;

      if (pathAncient) {
        const len = pathAncient.getTotalLength();
        pathAncient.style.strokeDasharray = len;
        pathAncient.style.strokeDashoffset = 0;
      }

      const rect = wrapper.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      wrapperOffset = rect.top + scrollTop;
      wrapperHeight = rect.height;
      scrollLength = wrapperHeight - window.innerHeight;

      // Check if deep-linked/already scrolled past
      if (scrollTop >= wrapperOffset + 100) {
        hasPlayedJourney = true;
      }

      updateJourneyScroll();
    }

    function startAutomaticTransition() {
      isJourneyTransitionPlaying = true;

      // Stop Lenis
      if (lenis) {
        lenis.stop();
      }
      // Set body overflow hidden
      document.body.style.overflow = "hidden";

      // Snap window scroll to exactly wrapperOffset
      window.scrollTo(0, wrapperOffset);

      // Reset transition flags
      floaters.forEach(f => {
        f.active = false;
        f.particlesEmitted = false;
        if (f.el) f.el.classList.remove("visible");
      });

      // Trigger canvas loop
      if (!isCanvasLoopRunning) {
        isCanvasLoopRunning = true;
        animateParticles();
      }

      transitionStartTime = performance.now();

      function runFrame(now) {
        if (!isJourneyTransitionPlaying) return;

        const elapsed = (now - transitionStartTime) / 1000;

        if (elapsed < 17.5) {
          renderAutomaticTimelineState(elapsed);
          transitionRafId = requestAnimationFrame(runFrame);
        } else {
          // Complete transition
          renderAutomaticTimelineState(17.5); // Draw final frame state
          unlockAndTransitionToChapter3();
        }
      }

      transitionRafId = requestAnimationFrame(runFrame);
    }

    function renderAutomaticTimelineState(elapsed) {
      // Force window scroll position during transition
      window.scrollTo(0, wrapperOffset);

      let journeyProgress = 0;
      let nodeRadius = 6.0;
      let filterUrl = "url(#organic-glow)";

      // Topo background opacities default
      let topoFarOpacity = 0.06;
      let topoNearOpacity = 0.16;

      // Reset all floaters and overlays unless active
      climax.classList.remove("revealed");
      exit.classList.remove("revealed");
      intro.classList.remove("active");
      intro.style.opacity = 0;

      // Check frame conditions
      if (elapsed <= 1.0) {
        // Frame 1: Awakening (0.0s - 1.0s)
        intro.classList.add("active");
        pathScene.classList.remove("active");

        let introOpacity = 0;
        if (elapsed < 0.4) {
          introOpacity = elapsed / 0.4;
        } else if (elapsed < 0.7) {
          introOpacity = 1.0;
        } else {
          introOpacity = Math.max(0, 1.0 - (elapsed - 0.7) / 0.3);
        }
        intro.style.opacity = introOpacity;
        intro.style.filter = "blur(" + ((1 - introOpacity) * 12) + "px)";

        journeyProgress = 0.0;
        nodeRadius = 6.0;
      } else {
        pathScene.classList.add("active");

        if (elapsed <= 9.0) {
          // Frame 2-5: Travel & Questions (1.0s - 9.0s)
          // Total distance on path is 0% to 80% (0.80)
          const travelElapsed = elapsed - 1.0; // 0 to 8
          journeyProgress = (travelElapsed / 8.0) * 0.80;

          // Question index (2 seconds per question)
          const qIndex = Math.min(3, Math.floor(travelElapsed / 2.0)); // 0, 1, 2, 3
          const qElapsed = travelElapsed - qIndex * 2.0; // 0.0 to 2.0 within the question block

          // Set active question
          floaters.forEach((f, idx) => {
            if (idx === qIndex) {
              f.active = true;
              if (f.el) f.el.classList.add("visible");

              // Emit particles halfway through the question block (e.g. at 0.8s to 1.4s)
              if (qElapsed > 0.8 && qElapsed < 1.4 && !f.particlesEmitted) {
                f.particlesEmitted = true;
                emitInsightParticles(f.x, f.y);
              }
            } else {
              // Hide other questions
              f.active = false;
              if (f.el) f.el.classList.remove("visible");
            }
          });

          // Frame 4: What if I fail? (elapsed 5.0s to 7.0s) -> Darkest emotional moment
          if (elapsed >= 5.0 && elapsed < 7.0) {
            topoFarOpacity = 0.02;
            topoNearOpacity = 0.06;
          }
          // Frame 5: What if it works? (elapsed 7.0s to 9.0s) -> Atmosphere opens up, hopeful
          if (elapsed >= 7.0 && elapsed < 9.0) {
            topoFarOpacity = 0.10;
            topoNearOpacity = 0.22;
          }

          // Node radius grows slightly with each question
          nodeRadius = 7.0 + qIndex * 1.5;
        } else if (elapsed <= 9.5) {
          // Frame 6: Slow down, questions clear (9.0s - 9.5s)
          const t = (elapsed - 9.0) / 0.5;
          journeyProgress = 0.80 + t * 0.05; // 80% to 85%

          // Hide all floaters
          floaters.forEach(f => {
            f.active = false;
            if (f.el) f.el.classList.remove("visible");
          });

          nodeRadius = 11.0;
        } else if (elapsed <= 13.5) {
          // Frame 7: Climax editorial text holds (9.5s - 13.5s) - COMPLETE PAUSE AT 85%
          journeyProgress = 0.85;

          // Show climax text
          climax.classList.add("revealed");

          nodeRadius = 13.0;
        } else if (elapsed <= 14.5) {
          // Travel from Climax to Arrival (13.5s - 14.5s)
          const t = elapsed - 13.5; // 0.0 to 1.0
          journeyProgress = 0.85 + t * 0.15; // 85% to 100%

          // Show exit overlay and destination dot active
          const destNode = document.getElementById("dot-destination");
          if (destNode) destNode.classList.add("active");
          exit.classList.add("revealed");

          nodeRadius = 13.0 + t * 3.0; // Grows from 13 to 16
        } else {
          // Frame 8: Arrival/The Work hold (14.5s - 17.5s) - COMPLETE PAUSE AT 100%
          journeyProgress = 1.0;

          // Show exit overlay and destination dot active
          const destNode = document.getElementById("dot-destination");
          if (destNode) destNode.classList.add("active");
          exit.classList.add("revealed");

          nodeRadius = 16.0;
          filterUrl = "url(#organic-intense-glow)";
        }
      }

      // Update SVG path stroke
      path.style.strokeDashoffset = pathLength * (1 - journeyProgress);
      const strokeWidth = 2.0 + journeyProgress * 6.0;
      path.style.strokeWidth = strokeWidth;
      path.style.strokeOpacity = 0.4 + journeyProgress * 0.6;

      // Update node coordinates
      const point = path.getPointAtLength(journeyProgress * pathLength);
      latestNodeX = point.x;
      latestNodeY = point.y;
      node.setAttribute("cx", latestNodeX);
      node.setAttribute("cy", latestNodeY);

      // Update node visuals
      if (nodeGlowBoost > 0.35 || elapsed >= 13.5) {
        filterUrl = "url(#organic-intense-glow)";
      }
      node.setAttribute("r", (nodeRadius + nodeGlowBoost * 4.5).toFixed(2));
      node.setAttribute("filter", filterUrl);

      // Keep camera centered (scale only)
      const isMobile = window.innerWidth <= 700;
      let scale = 0.55;
      if (!isMobile) {
        scale = Math.min(0.55, window.innerWidth / 1200);
      } else {
        scale = Math.min(0.35, window.innerWidth / 1000);
      }
      scrollWrapper.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
      scrollWrapper.style.setProperty("--ch2-map-scale", scale.toFixed(4));

      // Update topographic parallax opacities and translations
      if (topoFar && topoFar.length > 0) {
        const topoFarY = -(point.y * 0.08);
        topoFar[0].style.transform = "translate3d(0, " + topoFarY + "px, 0)";
        topoFar[0].style.opacity = topoFarOpacity;
      }
      if (topoNear && topoNear.length > 0) {
        const topoNearY = -(point.y * 0.22);
        topoNear[0].style.transform = "translate3d(0, " + topoNearY + "px, 0)";
        topoNear[0].style.opacity = topoNearOpacity;
      }
    }

    function unlockAndTransitionToChapter3() {
      isJourneyTransitionPlaying = false;
      hasPlayedJourney = true;

      // Trigger full-screen sky cracks and flashes
      if (typeof window.triggerSkyShots === "function") {
        window.triggerSkyShots();
      }

      // Re-enable scroll
      document.body.style.overflow = "";
      if (lenis) {
        lenis.start();
      }

      // Scroll smoothly to Chapter III projects
      const targetScroll = wrapperOffset + wrapperHeight;
      if (lenis) {
        lenis.scrollTo(targetScroll, { duration: 1.8 });
      } else {
        window.scrollTo({
          top: targetScroll,
          behavior: "smooth"
        });
      }
    }

    function updateJourneyScroll() {
      if (document.body.hasAttribute("data-test-registration")) return;
      if (isJourneyTransitionPlaying) return;

      const scrollY = window.scrollY || document.documentElement.scrollTop;

      if (scrollLength <= 0) return;

      // Reset played flag if scrolled back near the top of the page (Chapter I)
      if (scrollY < 100) {
        hasPlayedJourney = false;
      }

      // Check if we should trigger the automatic transition
      if (!hasPlayedJourney && scrollY >= wrapperOffset - 20) {
        startAutomaticTransition();
        return;
      }

      let progress = (scrollY - wrapperOffset) / scrollLength;
      if (isNaN(progress)) progress = 0;
      progress = Math.max(0, Math.min(1, progress));

      // ── PHASE 1: Intro Scene ──
      if (progress <= 0.15) {
        intro.classList.add("active");
        pathScene.classList.remove("active");
        climax.classList.remove("revealed");
        exit.classList.remove("revealed");

        let introOpacity = 0;
        const vh = window.innerHeight;
        const introStartScroll = wrapperOffset - vh * 0.5;
        const introHoldStart = wrapperOffset;
        const introHoldEnd = wrapperOffset + scrollLength * 0.05;
        const introFadeEnd = wrapperOffset + scrollLength * 0.15;
        const fadeDistance = vh * 0.25;

        if (scrollY < introStartScroll) {
          introOpacity = 0;
        } else if (scrollY < introHoldStart) {
          introOpacity = Math.min(1.0, (scrollY - introStartScroll) / fadeDistance);
        } else if (scrollY < introHoldEnd) {
          introOpacity = 1.0;
        } else if (scrollY < introFadeEnd) {
          introOpacity = Math.max(0, 1.0 - (scrollY - introHoldEnd) / (introFadeEnd - introHoldEnd));
        } else {
          introOpacity = 0;
        }
        intro.style.opacity = introOpacity;
        intro.style.filter = "blur(" + ((1 - introOpacity) * 12) + "px)";

        path.style.strokeDashoffset = pathLength;
        node.setAttribute("cx", 500);
        node.setAttribute("cy", 100);

        const destNode = document.getElementById("dot-destination");
        if (destNode) destNode.classList.remove("active");

        // Stop canvas animation & reset particles
        if (isCanvasLoopRunning) {
          isCanvasLoopRunning = false;
          if (canvasRafId) cancelAnimationFrame(canvasRafId);
          if (ctx) ctx.clearRect(0, 0, 1000, 1000);
          particles = [];
        }

        // Hide all floaters
        floaters.forEach(f => {
          f.active = false;
          f.particlesEmitted = false;
          if (f.el) f.el.classList.remove("visible");
        });

        return;
      }

      intro.classList.remove("active");
      intro.style.opacity = 0;

      // ── PHASE 2: Interactive Path Scene ──
      pathScene.classList.add("active");

      let journeyProgress = 0;
      if (progress <= 0.75) {
        const t = (progress - 0.15) / (0.75 - 0.15);
        journeyProgress = t * 0.85;
      } else if (progress <= 0.90) {
        const t = (progress - 0.75) / (0.90 - 0.75);
        journeyProgress = 0.85 + t * 0.10;
      } else {
        const t = (progress - 0.90) / (1.00 - 0.90);
        journeyProgress = 0.95 + t * 0.05;
      }

      path.style.strokeDashoffset = pathLength * (1 - journeyProgress);

      const strokeWidth = 2.0 + journeyProgress * 6.0;
      path.style.strokeWidth = strokeWidth;
      path.style.strokeOpacity = 0.4 + journeyProgress * 0.6;

      const point = path.getPointAtLength(journeyProgress * pathLength);
      latestNodeX = point.x;
      latestNodeY = point.y;
      node.setAttribute("cx", latestNodeX);
      node.setAttribute("cy", latestNodeY);

      const isMobile = window.innerWidth <= 700;
      let scale = 0.55;

      if (!isMobile) {
        scale = Math.min(0.55, window.innerWidth / 1200);
      } else {
        scale = Math.min(0.35, window.innerWidth / 1000);
      }

      scrollWrapper.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
      scrollWrapper.style.setProperty("--ch2-map-scale", scale.toFixed(4));

      if (topoFar && topoFar.length > 0) {
        const topoFarY = -(point.y * 0.08);
        topoFar[0].style.transform = "translate3d(0, " + topoFarY + "px, 0)";
      }
      if (topoNear && topoNear.length > 0) {
        const topoNearY = -(point.y * 0.22);
        topoNear[0].style.transform = "translate3d(0, " + topoNearY + "px, 0)";
      }

      // Handle canvas animation start/stop
      if (progress > 0.12 && progress < 0.96) {
        if (!isCanvasLoopRunning) {
          isCanvasLoopRunning = true;
          animateParticles();
        }
      } else {
        if (isCanvasLoopRunning) {
          isCanvasLoopRunning = false;
          if (canvasRafId) cancelAnimationFrame(canvasRafId);
          if (ctx) ctx.clearRect(0, 0, 1000, 1000);
          particles = [];
        }
      }

      // Check distance & emit particles for floaters
      if (progress > 0.15 && progress <= 0.75) {
        floaters.forEach(f => {
          const dist = Math.hypot(f.x - latestNodeX, f.y - latestNodeY);

          if (dist < 260) {
            if (!f.active) {
              f.active = true;
              if (f.el) f.el.classList.add("visible");
            }
            if (dist < 180 && !f.particlesEmitted) {
              f.particlesEmitted = true;
              emitInsightParticles(f.x, f.y);
            }
          } else {
            if (f.active) {
              f.active = false;
              if (f.el) f.el.classList.remove("visible");
            }
          }

          if (latestNodeY < f.y - 120) {
            f.particlesEmitted = false;
            f.active = false;
            if (f.el) f.el.classList.remove("visible");
          }
        });
      } else {
        floaters.forEach(f => {
          f.active = false;
          f.particlesEmitted = false;
          if (f.el) f.el.classList.remove("visible");
        });
      }

      // ── PHASE 3: Climax Point (progress 0.75 to 0.90) ──
      if (progress > 0.75 && progress <= 0.90) {
        climax.classList.add("revealed");
      } else {
        climax.classList.remove("revealed");
      }

      // ── PHASE 4: Destination & Exit Portal (progress 0.90 to 1.0) ──
      const destNode = document.getElementById("dot-destination");
      if (progress > 0.90) {
        if (destNode) destNode.classList.add("active");
        exit.classList.add("revealed");
      } else {
        if (destNode) destNode.classList.remove("active");
        exit.classList.remove("revealed");
      }
    }

    // Exit portal scrolling trigger
    const exitPortal = document.querySelector(".clickable-portal");
    if (exitPortal) {
      exitPortal.addEventListener("click", () => {
        const targetScroll = wrapperOffset + wrapperHeight;
        if (typeof lenis !== "undefined" && lenis) {
          lenis.scrollTo(targetScroll, { duration: 1.6 });
        } else {
          window.scrollTo({
            top: targetScroll,
            behavior: "smooth"
          });
        }
      });
    }

    // Set initial values and bind event listeners
    setTimeout(measureLayout, 100);
    window.addEventListener("resize", measureLayout);
    window.addEventListener("scroll", updateJourneyScroll, { passive: true });
  }

  /* ────────────────────────────────────────────────
     INIT EVERYTHING
     ──────────────────────────────────────────────── */
  function init() {
    initLenis();
    initEntryAnimation();
    updateEyeCoordinates(); // Initialize eye coords on load
    requestRender(); // Start the state-driven render loop initially
    initParticles();
    initMenu();
    initScrollTransition();
    initChapter2Observer();
    initTopographyJourney();
    window.addEventListener("resize", updateEyeCoordinates);
  }

  // Wait for DOM + fonts
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
