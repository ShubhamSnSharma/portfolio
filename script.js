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
     8.7 CHAPTER III: THE BUILDER (EDITORIAL SHOWCASE)
     ──────────────────────────────────────────────── */
  function initChapter3() {
    const listContainer = document.getElementById("project-list-container");
    const showcaseCard = document.getElementById("project-showcase-card");
    const glowNode = document.getElementById("active-glow-node");
    const navContainer = document.querySelector(".ch3-index-nav");

    if (!listContainer || !showcaseCard || !glowNode || !navContainer) return;

    const PROJECTS_DATA = [
      {
        id: "internhunt",
        number: "01",
        groupHeader: "FLAGSHIP WORK",
        title: "InternHunt",
        category: "MERN • INTERNSHIP DISCOVERY",
        badge: "Flagship Project",
        statement: "Finding the right internship\nshouldn't feel like searching blind.",
        description: "Students often know their skills but struggle to discover opportunities that truly match them. InternHunt bridges that gap through resume analysis, skill extraction, internship discovery, and personalized recommendations.",
        stack: ["Python", "Streamlit", "MySQL", "Resume Parsing", "Skill Extraction", "REST APIs", "Web Scraping"],
        buttons: [
          { label: "LIVE APP", url: "https://internhunt.streamlit.app/", primary: true },
          { label: "LANDING PAGE", url: "https://internhuntt.vercel.app/", primary: false },
          { label: "GITHUB", url: "https://github.com/ShubhamSnSharma/internhunt2.0.git", primary: false, isGithub: true }
        ],
        visualType: "internhunt",
        highlights: [
          "Resume Analysis",
          "Skill Extraction",
          "Internship Matching",
          "Learning Recommendations",
          "Real-Time Opportunity Discovery"
        ]
      },
      {
        id: "crime-analytics",
        number: "02",
        groupHeader: "SELECTED RESEARCH & ANALYTICS",
        title: "Crime Against Women in India",
        subtitle: "A Decade of Trends, Judicial Outcomes & Policy Insights (2001–2010)",
        projectType: "Data Analytics Case Study",
        category: "Data Analytics • Public Policy Analytics • Data Visualization",
        badge: "Research & Analytics",
        statement: "Understanding crime is only half the challenge.\nUnderstanding what happens after a crime is reported reveals where justice slows down.",
        description: "Analysis of 1.67M+ NCRB crime records to uncover crime trends, conviction outcomes, judicial backlog growth, and systemic pressure on India's criminal justice system using Python, statistical analysis, and data visualization.",
        stack: ["Python", "Pandas", "NumPy", "Matplotlib", "Plotly"],
        buttons: [
          { label: "View Repository", url: "https://github.com/ShubhamSnSharma/Crime-Against-Women-Analysis-India", primary: true },
          { label: "View Analysis", url: "https://github.com/ShubhamSnSharma/Crime-Against-Women-Analysis-India/blob/main/notebooks/crime_against_women_analysis.ipynb", primary: false }
        ],
        visualType: "crime",
        useInsightCards: true,
        metrics: [
          { value: "1.67M+", label: "Reported Cases Analyzed" },
          { value: "35", label: "States & Union Territories" },
          { value: "58%", label: "Growth in Reported Crimes" },
          { value: "70%", label: "Growth in Pending Trials" }
        ],
        highlights: [
          { val: "40%", text: "Domestic violence-related offences accounted for nearly 40% of reported crimes against women." },
          { val: "70%", text: "Pending trials increased by almost 70%, highlighting severe judicial backlog growth." }
        ]
      },
      {
        id: "air-quality",
        number: "03",
        title: "Air Quality Forecasting",
        subtitle: "Evaluating Statistical & Deep Learning Models on Delhi PM2.5 Timeseries",
        projectType: "Time Series & Deep Learning Analysis",
        category: "Time Series Forecasting • Deep Learning • Environmental Analytics",
        badge: "Research & Analytics",
        statement: "Forecasting daily PM2.5 levels\nto enable proactive public health alerts.",
        description: "Comparative analysis of Delhi PM2.5 levels using 5+ years of daily data from the CPCB. Evaluated classical statistical models (Holt-Winters, SARIMA) against deep learning (LSTM) to forecast seasonal pollution spikes and peak winter events.",
        stack: ["Python", "TensorFlow", "Pandas", "Statsmodels", "Matplotlib"],
        buttons: [
          { label: "View Repository", url: "https://github.com/ShubhamSnSharma/Delhi-Air-Quality-Forecasting", primary: true },
          { label: "View Analysis", url: "https://github.com/ShubhamSnSharma/Delhi-Air-Quality-Forecasting/blob/main/notebooks/Air_Quality_Forecasting.ipynb", primary: false }
        ],
        visualType: "forecast",
        useInsightCards: true,
        metrics: [
          { value: "5+ Years", label: "Daily PM2.5 Records" },
          { value: "23.41", label: "LSTM MAE Score" },
          { value: "55%", label: "Error Reduction vs SARIMA" },
          { value: "3", label: "Models Evaluated" }
        ],
        highlights: [
          { val: "23.41", text: "Deep learning LSTM model achieved a low 23.41 MAE, outperforming classical SARIMA and Holt-Winters by over 55%." },
          { val: "Annual", text: "Isolated strong annual seasonality, identifying winter crop burning and weather inversions as primary pollution drivers." }
        ]
      }
    ];

    let activeId = PROJECTS_DATA[0].id;
    let isTransitioning = false;
    let crimeRotationInterval = null;
    let hoveredItemId = null;
    let pendingActiveId = null;
    let hoverIntentTimeout = null;

    function startCrimeRotation() {
      if (crimeRotationInterval) clearInterval(crimeRotationInterval);

      let slides = document.querySelectorAll(".showcase-slide");
      if (slides.length === 0) return;

      let currentIndex = 0;
      crimeRotationInterval = setInterval(() => {
        slides = document.querySelectorAll(".showcase-slide");
        if (slides.length === 0) {
          clearInterval(crimeRotationInterval);
          crimeRotationInterval = null;
          return;
        }

        slides[currentIndex].classList.remove("active");
        currentIndex = (currentIndex + 1) % slides.length;
        slides[currentIndex].classList.add("active");
      }, 4000);
    }

    // Generate project list items with group headers and hierarchical classes
    let listHtml = "";
    PROJECTS_DATA.forEach(project => {
      if (project.groupHeader) {
        listHtml += `<li class="ch3-index-header">${project.groupHeader}</li>`;
      }
      const isSupporting = project.id !== "internhunt";
      listHtml += `
        <li class="ch3-index-item ${isSupporting ? 'supporting-project' : 'flagship-project'}" data-id="${project.id}">
          <span class="index-num">${project.number}</span>
          <div class="index-meta">
            <span class="index-title">${project.title}</span>
            <span class="index-cat">${project.category}</span>
          </div>
        </li>
      `;
    });
    listContainer.innerHTML = listHtml;

    const items = listContainer.querySelectorAll(".ch3-index-item");

    function updateActiveStates() {
      items.forEach(item => {
        const id = item.getAttribute("data-id");
        if (id === activeId) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });

      // Update sliding glow node position
      const activeItem = listContainer.querySelector(`.ch3-index-item[data-id="${activeId}"]`);
      if (activeItem && window.innerWidth > 1024) {
        const navRect = navContainer.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        const topPos = itemRect.top - navRect.top + (itemRect.height / 2) - 4.5;
        glowNode.style.top = `${topPos}px`;
        glowNode.style.opacity = "1";
      } else {
        glowNode.style.opacity = "0";
      }
    }

    function renderInternHuntVisual() {
      return `
        <div class="visual-wrapper internhunt-visual" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
          <svg viewBox="0 0 400 250" style="width: 100%; height: 100%; max-height: 240px;">
            <defs>
              <filter id="ch3-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            <!-- Grid Coordinates Background -->
            <g opacity="0.05">
              <line x1="200" y1="10" x2="200" y2="240" stroke="var(--gold)" stroke-width="0.5" stroke-dasharray="2, 4" />
              <line x1="10" y1="117" x2="390" y2="117" stroke="var(--gold)" stroke-width="0.5" stroke-dasharray="2, 4" />
            </g>

            <!-- Glowing Connection Paths -->
            <path id="path-py-ml" d="M 120 42 C 170 42, 170 117, 200 117 C 230 117, 230 192, 280 192" fill="none" stroke="rgba(212, 164, 77, 0.15)" stroke-width="1" />
            <path id="path-py-be" d="M 120 42 C 170 42, 170 117, 200 117 C 230 117, 230 92, 280 92" fill="none" stroke="rgba(212, 164, 77, 0.08)" stroke-width="0.75" />
            <path id="path-sql-da" d="M 120 92 C 170 92, 170 117, 200 117 C 230 117, 230 142, 280 142" fill="none" stroke="rgba(212, 164, 77, 0.1)" stroke-width="0.75" />
            <path id="path-sql-be" d="M 120 92 C 170 92, 170 117, 200 117 C 230 117, 230 92, 280 92" fill="none" stroke="rgba(212, 164, 77, 0.08)" stroke-width="0.75" />
            <path id="path-react-fe" d="M 120 142 C 170 142, 170 117, 200 117 C 230 117, 230 42, 280 42" fill="none" stroke="rgba(212, 164, 77, 0.15)" stroke-width="1" />
            <path id="path-ml-ml" d="M 120 192 C 170 192, 170 117, 200 117 C 230 117, 230 192, 280 192" fill="none" stroke="rgba(212, 164, 77, 0.15)" stroke-width="1.25" />
            <path id="path-ml-da" d="M 120 192 C 170 192, 170 117, 200 117 C 230 117, 230 142, 280 142" fill="none" stroke="rgba(212, 164, 77, 0.08)" stroke-width="0.75" />

            <!-- Flowing Matching Particles (traversing paths) -->
            <circle r="3" fill="#fff" filter="url(#ch3-glow)">
              <animateMotion dur="3.5s" repeatCount="indefinite" path="M 120 42 C 170 42, 170 117, 200 117 C 230 117, 230 192, 280 192" />
            </circle>
            <circle r="2.5" fill="var(--gold)" filter="url(#ch3-glow)">
              <animateMotion dur="4.2s" begin="1s" repeatCount="indefinite" path="M 120 92 C 170 92, 170 117, 200 117 C 230 117, 230 142, 280 142" />
            </circle>
            <circle r="3" fill="#fff" filter="url(#ch3-glow)">
              <animateMotion dur="3.8s" begin="0.5s" repeatCount="indefinite" path="M 120 142 C 170 142, 170 117, 200 117 C 230 117, 230 42, 280 42" />
            </circle>
            <circle r="3" fill="var(--gold)" filter="url(#ch3-glow)">
              <animateMotion dur="3.2s" begin="2s" repeatCount="indefinite" path="M 120 192 C 170 192, 170 117, 200 117 C 230 117, 230 192, 280 192" />
            </circle>
            <circle r="2.5" fill="var(--gold)" filter="url(#ch3-glow)">
              <animateMotion dur="4.5s" begin="1.5s" repeatCount="indefinite" path="M 120 42 C 170 42, 170 117, 200 117 C 230 117, 230 92, 280 92" />
            </circle>

            <!-- Center Recommendation Hub -->
            <circle cx="200" cy="117" r="16" fill="#05070b" stroke="rgba(212, 164, 77, 0.3)" stroke-width="1" />
            <circle cx="200" cy="117" r="22" fill="none" stroke="rgba(212, 164, 77, 0.1)" stroke-width="0.5" stroke-dasharray="3, 3" />
            <circle cx="200" cy="117" r="16" fill="none" stroke="var(--gold)" stroke-width="2" filter="url(#ch3-glow)" opacity="0.5">
              <animate attributeName="r" values="16;24;16" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
            </circle>
            <text x="200" y="121" font-family="Inter, sans-serif" font-size="11" fill="var(--gold)" text-anchor="middle">✦</text>

            <!-- Skill Nodes (Left) -->
            <g>
              <rect x="30" y="30" width="90" height="24" rx="4" fill="#070a0f" stroke="rgba(245, 241, 232, 0.1)" stroke-width="0.75" />
              <text x="75" y="45" font-family="Inter, sans-serif" font-size="9" fill="var(--quiet)" text-anchor="middle" font-weight="500">Python</text>

              <rect x="30" y="80" width="90" height="24" rx="4" fill="#070a0f" stroke="rgba(245, 241, 232, 0.1)" stroke-width="0.75" />
              <text x="75" y="95" font-family="Inter, sans-serif" font-size="9" fill="var(--quiet)" text-anchor="middle" font-weight="500">SQL</text>

              <rect x="30" y="130" width="90" height="24" rx="4" fill="#070a0f" stroke="rgba(245, 241, 232, 0.1)" stroke-width="0.75" />
              <text x="75" y="145" font-family="Inter, sans-serif" font-size="9" fill="var(--quiet)" text-anchor="middle" font-weight="500">React</text>

              <rect x="30" y="180" width="90" height="24" rx="4" fill="#070a0f" stroke="rgba(245, 241, 232, 0.1)" stroke-width="0.75" />
              <text x="75" y="195" font-family="Inter, sans-serif" font-size="8.5" fill="var(--quiet)" text-anchor="middle" font-weight="500">Machine Learning</text>
            </g>

            <!-- Opportunity Nodes (Right) -->
            <g>
              <rect x="280" y="30" width="100" height="24" rx="4" fill="#070a0f" stroke="rgba(212, 164, 77, 0.15)" stroke-width="0.75" />
              <text x="330" y="45" font-family="Inter, sans-serif" font-size="8.5" fill="var(--gold)" text-anchor="middle" font-weight="600">Frontend Intern</text>

              <rect x="280" y="80" width="100" height="24" rx="4" fill="#070a0f" stroke="rgba(212, 164, 77, 0.15)" stroke-width="0.75" />
              <text x="330" y="95" font-family="Inter, sans-serif" font-size="8.5" fill="var(--gold)" text-anchor="middle" font-weight="600">Backend Intern</text>

              <rect x="280" y="130" width="100" height="24" rx="4" fill="#070a0f" stroke="rgba(212, 164, 77, 0.15)" stroke-width="0.75" />
              <text x="330" y="145" font-family="Inter, sans-serif" font-size="8.5" fill="var(--gold)" text-anchor="middle" font-weight="600">Data Analyst</text>

              <rect x="280" y="180" width="100" height="24" rx="4" fill="#070a0f" stroke="rgba(212, 164, 77, 0.25)" stroke-width="0.75" />
              <text x="330" y="195" font-family="Inter, sans-serif" font-size="8.5" fill="var(--gold)" text-anchor="middle" font-weight="600">ML Internship</text>
            </g>
          </svg>
        </div>
      `;
    }

    function renderCrimeVisual() {
      return `
        <div class="visual-wrapper crime-visual" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box;">
          <svg viewBox="0 0 400 250" style="width: 100%; height: 100%; max-height: 240px;">
            <defs>
              <filter id="ch3-crime-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <style>
              .trend-line {
                fill: none;
                opacity: 0.12;
                stroke-width: 1.5;
                transition: opacity 0.3s ease, stroke-width 0.3s ease, stroke 0.3s ease;
              }
              .insight-text {
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
              }
              .category-btn {
                cursor: pointer;
                opacity: 0.55;
                transition: opacity 0.3s ease;
              }
              .category-btn circle {
                opacity: 0;
                transition: opacity 0.3s ease;
              }
              .category-btn text {
                fill: rgba(245, 241, 232, 0.75);
                transition: fill 0.3s ease, font-weight 0.3s ease;
              }

              /* Default Active State: Domestic Violence */
              .category-btn.dv-btn {
                opacity: 1;
              }
              .category-btn.dv-btn circle {
                opacity: 1;
              }
              .category-btn.dv-btn text {
                fill: var(--gold);
                font-weight: 600;
              }
              .trend-line.dv-line {
                opacity: 0.95;
                stroke-width: 2.5;
                stroke: var(--gold);
              }
              .insight-text.dv-insight {
                opacity: 1;
              }

              /* Dim active states when SVG is hovered */
              svg:hover .category-btn.dv-btn {
                opacity: 0.55;
              }
              svg:hover .category-btn.dv-btn circle {
                opacity: 0;
              }
              svg:hover .category-btn.dv-btn text {
                fill: rgba(245, 241, 232, 0.75);
                font-weight: 500;
              }
              svg:hover .trend-line.dv-line {
                opacity: 0.12;
                stroke-width: 1.5;
                stroke: rgba(245, 241, 232, 0.2);
              }
              svg:hover .insight-text.dv-insight {
                opacity: 0;
              }

              /* Hover: Domestic Violence */
              .dv-btn:hover {
                opacity: 1 !important;
              }
              .dv-btn:hover circle {
                opacity: 1 !important;
              }
              .dv-btn:hover text {
                fill: var(--gold) !important;
                font-weight: 600 !important;
              }
              .dv-btn:hover ~ .trend-line.dv-line {
                opacity: 0.95 !important;
                stroke-width: 2.5 !important;
                stroke: var(--gold) !important;
              }
              .dv-btn:hover ~ .insight-text.dv-insight {
                opacity: 1 !important;
              }

              /* Hover: Rape */
              .rape-btn:hover {
                opacity: 1 !important;
              }
              .rape-btn:hover circle {
                opacity: 1 !important;
              }
              .rape-btn:hover text {
                fill: var(--gold) !important;
                font-weight: 600 !important;
              }
              .rape-btn:hover ~ .trend-line.rape-line {
                opacity: 0.95 !important;
                stroke-width: 2.5 !important;
                stroke: var(--gold) !important;
              }
              .rape-btn:hover ~ .insight-text.rape-insight {
                opacity: 1 !important;
              }

              /* Hover: Sexual Harassment */
              .sh-btn:hover {
                opacity: 1 !important;
              }
              .sh-btn:hover circle {
                opacity: 1 !important;
              }
              .sh-btn:hover text {
                fill: var(--gold) !important;
                font-weight: 600 !important;
              }
              .sh-btn:hover ~ .trend-line.sh-line {
                opacity: 0.95 !important;
                stroke-width: 2.5 !important;
                stroke: var(--gold) !important;
              }
              .sh-btn:hover ~ .insight-text.sh-insight {
                opacity: 1 !important;
              }

              /* Hover: Kidnapping */
              .kd-btn:hover {
                opacity: 1 !important;
              }
              .kd-btn:hover circle {
                opacity: 1 !important;
              }
              .kd-btn:hover text {
                fill: var(--gold) !important;
                font-weight: 600 !important;
              }
              .kd-btn:hover ~ .trend-line.kd-line {
                opacity: 0.95 !important;
                stroke-width: 2.5 !important;
                stroke: var(--gold) !important;
              }
              .kd-btn:hover ~ .insight-text.kd-insight {
                opacity: 1 !important;
              }

              /* Hover: Trafficking */
              .tf-btn:hover {
                opacity: 1 !important;
              }
              .tf-btn:hover circle {
                opacity: 1 !important;
              }
              .tf-btn:hover text {
                fill: var(--gold) !important;
                font-weight: 600 !important;
              }
              .tf-btn:hover ~ .trend-line.tf-line {
                opacity: 0.95 !important;
                stroke-width: 2.5 !important;
                stroke: var(--gold) !important;
              }
              .tf-btn:hover ~ .insight-text.tf-insight {
                opacity: 1 !important;
              }

              /* Hover: Dowry Cases */
              .dw-btn:hover {
                opacity: 1 !important;
              }
              .dw-btn:hover circle {
                opacity: 1 !important;
              }
              .dw-btn:hover text {
                fill: var(--gold) !important;
                font-weight: 600 !important;
              }
              .dw-btn:hover ~ .trend-line.dw-line {
                opacity: 0.95 !important;
                stroke-width: 2.5 !important;
                stroke: var(--gold) !important;
              }
              .dw-btn:hover ~ .insight-text.dw-insight {
                opacity: 1 !important;
              }
            </style>

            <!-- Coordinate Grid lines -->
            <g opacity="0.04" stroke="#fff" stroke-width="0.5">
              <line x1="185" y1="25" x2="185" y2="145" />
              <line x1="225" y1="25" x2="225" y2="145" />
              <line x1="265" y1="25" x2="265" y2="145" />
              <line x1="305" y1="25" x2="305" y2="145" />
              <line x1="345" y1="25" x2="345" y2="145" />
              <line x1="380" y1="25" x2="380" y2="145" />

              <line x1="175" y1="40" x2="390" y2="40" />
              <line x1="175" y1="70" x2="390" y2="70" />
              <line x1="175" y1="100" x2="390" y2="100" />
              <line x1="175" y1="130" x2="390" y2="130" />
            </g>

            <!-- Baseline axis -->
            <line x1="175" y1="145" x2="390" y2="145" stroke="rgba(212, 164, 77, 0.15)" stroke-width="0.75" />
            <text x="175" y="18" font-family="Inter, sans-serif" font-size="6.5" fill="var(--quiet)" opacity="0.5" letter-spacing="0.05em">DATA ANALYSIS • INCIDENTS TREND</text>

            <!-- Year Labels -->
            <g opacity="0.45" fill="var(--quiet)" font-family="Inter, sans-serif" font-size="6.5" text-anchor="middle">
              <text x="185" y="157">2016</text>
              <text x="225" y="157">2017</text>
              <text x="265" y="157">2018</text>
              <text x="305" y="157">2019</text>
              <text x="345" y="157">2020</text>
              <text x="380" y="157">2021</text>
            </g>

            <!-- 1. The interactive button groups (placed before target siblings in DOM order) -->
            <g class="category-btn dv-btn">
              <rect x="15" y="38" width="135" height="22" fill="#fff" fill-opacity="0" />
              <circle cx="20" cy="48" r="2.5" fill="var(--gold)" />
              <text x="30" y="51" font-family="Inter, sans-serif" font-size="8.5" font-weight="500">Domestic Violence</text>
            </g>

            <g class="category-btn rape-btn">
              <rect x="15" y="68" width="135" height="22" fill="#fff" fill-opacity="0" />
              <circle cx="20" cy="78" r="2.5" fill="var(--gold)" />
              <text x="30" y="81" font-family="Inter, sans-serif" font-size="8.5" font-weight="500">Rape</text>
            </g>

            <g class="category-btn sh-btn">
              <rect x="15" y="98" width="135" height="22" fill="#fff" fill-opacity="0" />
              <circle cx="20" cy="108" r="2.5" fill="var(--gold)" />
              <text x="30" y="111" font-family="Inter, sans-serif" font-size="8.5" font-weight="500">Sexual Harassment</text>
            </g>

            <g class="category-btn kd-btn">
              <rect x="15" y="128" width="135" height="22" fill="#fff" fill-opacity="0" />
              <circle cx="20" cy="138" r="2.5" fill="var(--gold)" />
              <text x="30" y="141" font-family="Inter, sans-serif" font-size="8.5" font-weight="500">Kidnapping</text>
            </g>

            <g class="category-btn tf-btn">
              <rect x="15" y="158" width="135" height="22" fill="#fff" fill-opacity="0" />
              <circle cx="20" cy="168" r="2.5" fill="var(--gold)" />
              <text x="30" y="171" font-family="Inter, sans-serif" font-size="8.5" font-weight="500">Trafficking</text>
            </g>

            <g class="category-btn dw-btn">
              <rect x="15" y="188" width="135" height="22" fill="#fff" fill-opacity="0" />
              <circle cx="20" cy="198" r="2.5" fill="var(--gold)" />
              <text x="30" y="201" font-family="Inter, sans-serif" font-size="8.5" font-weight="500">Dowry Cases</text>
            </g>

            <!-- 2. Interactive Trend Lines -->
            <path class="trend-line dv-line" d="M 185 55 C 205 52, 245 40, 265 42 C 285 44, 325 36, 380 35" stroke="rgba(245, 241, 232, 0.25)" />
            <path class="trend-line rape-line" d="M 185 90 C 205 88, 245 80, 265 82 C 285 84, 325 90, 380 88" stroke="rgba(245, 241, 232, 0.25)" />
            <path class="trend-line sh-line" d="M 185 105 C 205 100, 245 90, 265 92 C 285 94, 325 104, 380 100" stroke="rgba(245, 241, 232, 0.25)" />
            <path class="trend-line kd-line" d="M 185 115 C 205 110, 245 100, 265 95 C 285 90, 325 82, 380 90" stroke="rgba(245, 241, 232, 0.25)" />
            <path class="trend-line tf-line" d="M 185 135 C 205 128, 245 135, 265 132 C 285 129, 325 134, 380 128" stroke="rgba(245, 241, 232, 0.25)" />
            <path class="trend-line dw-line" d="M 185 125 C 205 127, 245 131, 265 133 C 285 135, 325 139, 380 142" stroke="rgba(245, 241, 232, 0.25)" />

            <!-- 3. Interactive Insights Container -->
            <!-- Insight Box Border & Background -->
            <rect x="175" y="172" width="210" height="58" rx="6" fill="rgba(212, 164, 77, 0.01)" stroke="rgba(212, 164, 77, 0.08)" stroke-width="0.75" />

            <!-- Insight Text Groups -->
            <g class="insight-text dv-insight">
              <text x="187" y="191" font-family="Inter, sans-serif" font-size="8.5" font-weight="600" fill="var(--gold)" letter-spacing="0.04em">DOMESTIC VIOLENCE</text>
              <text x="187" y="203" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">Highest reported category during the selected period.</text>
              <text x="187" y="213" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">Represents over 30% of total recorded cases nationally.</text>
            </g>

            <g class="insight-text rape-insight">
              <text x="187" y="191" font-family="Inter, sans-serif" font-size="8.5" font-weight="600" fill="var(--gold)" letter-spacing="0.04em">RAPE CASES</text>
              <text x="187" y="203" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">Consistent volume with minor reporting variations.</text>
              <text x="187" y="213" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">Reflects ongoing social and legal reporting awareness.</text>
            </g>

            <g class="insight-text sh-insight">
              <text x="187" y="191" font-family="Inter, sans-serif" font-size="8.5" font-weight="600" fill="var(--gold)" letter-spacing="0.04em">SEXUAL HARASSMENT</text>
              <text x="187" y="203" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">Spikes correlate with periods of active public reforms.</text>
              <text x="187" y="213" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">Higher reporting densities observed within urban sectors.</text>
            </g>

            <g class="insight-text kd-insight">
              <text x="187" y="191" font-family="Inter, sans-serif" font-size="8.5" font-weight="600" fill="var(--gold)" letter-spacing="0.04em">KIDNAPPING</text>
              <text x="187" y="203" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">Noticeable upward trend leading into 2019, then stabilizing.</text>
              <text x="187" y="213" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">Demographics show high concentration in minor cohorts.</text>
            </g>

            <g class="insight-text tf-insight">
              <text x="187" y="191" font-family="Inter, sans-serif" font-size="8.5" font-weight="600" fill="var(--gold)" letter-spacing="0.04em">TRAFFICKING</text>
              <text x="187" y="203" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">Lower overall volume but significant regional concentration.</text>
              <text x="187" y="213" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">High densities identified along border transit routes.</text>
            </g>

            <g class="insight-text dw-insight">
              <text x="187" y="191" font-family="Inter, sans-serif" font-size="8.5" font-weight="600" fill="var(--gold)" letter-spacing="0.04em">DOWRY CASES</text>
              <text x="187" y="203" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">Slow downward trend across the 5-year observation period.</text>
              <text x="187" y="213" font-family="Inter, sans-serif" font-size="7.5" fill="var(--quiet)" opacity="0.9">Remains persistently concentrated in specific regions.</text>
            </g>
          </svg>
        </div>
      `;
    }

    function renderForecastVisual() {
      return `
        <div class="visual-wrapper forecast-visual" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box;">
          <svg viewBox="0 0 400 250" style="width: 100%; height: 100%; max-height: 240px;">
            <defs>
              <linearGradient id="forecast-lstm-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="rgba(212, 164, 77, 0.2)" />
                <stop offset="85%" stop-color="rgba(212, 164, 77, 1)" />
                <stop offset="100%" stop-color="rgba(212, 164, 77, 0.2)" />
              </linearGradient>
              <filter id="ch3-forecast-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <style>
              .forecast-model-group {
                cursor: pointer;
                transition: opacity 0.3s ease;
              }
              /* Default states: LSTM is highlighted */
              .forecast-model-group {
                opacity: 0.75;
              }
              .forecast-model-group.model-lstm {
                opacity: 1;
              }
              /* Interactive hover highlighting across the whole SVG */
              svg:hover .forecast-model-group {
                opacity: 0.22;
              }
              svg:hover .forecast-model-group:hover {
                opacity: 1;
              }
              
              /* Transition line thickness */
              .forecast-model-group .model-path {
                transition: stroke-width 0.3s ease, stroke-opacity 0.3s ease;
              }
              .forecast-model-group:hover .model-path {
                stroke-width: 2.5px;
                stroke-opacity: 1;
              }
              .forecast-model-group.model-lstm:hover .model-path {
                stroke-width: 3.5px;
                stroke-opacity: 1;
              }
              
              /* Animate bar chart rows on hover */
              .forecast-model-group rect {
                transition: fill-opacity 0.3s ease, stroke-width 0.3s ease;
              }
              .forecast-model-group:hover rect {
                fill-opacity: 1;
              }
            </style>

            <!-- Coordinate Grid lines -->
            <g opacity="0.02">
              <line x1="50" y1="15" x2="50" y2="135" stroke="#fff" stroke-width="0.5" />
              <line x1="100" y1="15" x2="100" y2="135" stroke="#fff" stroke-width="0.5" />
              <line x1="150" y1="15" x2="150" y2="135" stroke="#fff" stroke-width="0.5" />
              <line x1="200" y1="15" x2="200" y2="135" stroke="#fff" stroke-width="0.5" />
              <line x1="250" y1="15" x2="250" y2="135" stroke="#fff" stroke-width="0.5" />
              <line x1="300" y1="15" x2="300" y2="135" stroke="#fff" stroke-width="0.5" />
              <line x1="350" y1="15" x2="350" y2="135" stroke="#fff" stroke-width="0.5" />

              <line x1="20" y1="40" x2="380" y2="40" stroke="#fff" stroke-width="0.5" />
              <line x1="20" y1="70" x2="380" y2="70" stroke="#fff" stroke-width="0.5" />
              <line x1="20" y1="100" x2="380" y2="100" stroke="#fff" stroke-width="0.5" />
              <line x1="20" y1="130" x2="380" y2="130" stroke="#fff" stroke-width="0.5" />
            </g>

            <!-- Timeline Partition (Now) -->
            <line x1="180" y1="15" x2="180" y2="135" stroke="rgba(212, 164, 77, 0.25)" stroke-width="1" stroke-dasharray="2, 4" />
            <text x="175" y="24" font-family="Inter, sans-serif" font-size="6" fill="var(--muted)" text-anchor="end" opacity="0.5">ACTUALS</text>
            <text x="185" y="24" font-family="Inter, sans-serif" font-size="6" fill="var(--gold)" text-anchor="start" opacity="0.7" font-weight="600">FORECAST (LSTM VS COMPARISON)</text>

            <!-- Historical Actual Curve (solid gray) -->
            <path d="M 30 115 C 60 95, 80 135, 110 100 C 130 80, 160 120, 180 105" fill="none" stroke="rgba(245, 241, 232, 0.25)" stroke-width="1.5" stroke-linecap="round" />

            <!-- MODEL GROUP: LSTM -->
            <g class="forecast-model-group model-lstm">
              <!-- Forecast Curve -->
              <path class="model-path" d="M 180 105 C 210 95, 240 60, 270 70 C 300 80, 330 40, 370 50" fill="none" stroke="url(#forecast-lstm-grad)" stroke-width="2" stroke-linecap="round" stroke-dasharray="300">
                <animate attributeName="stroke-dashoffset" values="300;0" dur="4s" repeatCount="indefinite" />
              </path>
              <circle cx="370" cy="50" r="2.5" fill="var(--gold)" filter="url(#ch3-forecast-glow)">
                <animate attributeName="r" values="1.5;3;1.5" dur="2s" repeatCount="indefinite" />
              </circle>
              
              <!-- Hover target row -->
              <rect x="15" y="180" width="370" height="18" fill="#fff" fill-opacity="0" />

              <!-- Performance metrics row -->
              <text x="25" y="192" font-family="Inter, sans-serif" font-size="8.5" fill="var(--gold)" font-weight="600">LSTM</text>
              <rect x="95" y="184" width="31" height="8" rx="2" fill="var(--gold)" />
              <text x="132" y="191" font-family="Inter, sans-serif" font-size="8" fill="var(--gold)" font-weight="500">23.41</text>
              <rect x="235" y="184" width="51" height="8" rx="2" fill="var(--gold)" />
              <text x="292" y="191" font-family="Inter, sans-serif" font-size="8" fill="var(--gold)" font-weight="500">38.75</text>
            </g>

            <!-- MODEL GROUP: SARIMA -->
            <g class="forecast-model-group model-sarima">
              <!-- Forecast Curve -->
              <path class="model-path" d="M 180 105 C 210 110, 240 85, 270 95 C 300 105, 330 75, 370 85" fill="none" stroke="rgba(245, 241, 232, 0.45)" stroke-width="1.25" stroke-dasharray="3, 3" stroke-linecap="round" />
              
              <!-- Hover target row -->
              <rect x="15" y="200" width="370" height="18" fill="#fff" fill-opacity="0" />

              <!-- Performance metrics row -->
              <text x="25" y="212" font-family="Inter, sans-serif" font-size="8.5" fill="var(--ivory)" font-weight="500">SARIMA</text>
              <rect x="95" y="204" width="70" height="8" rx="2" fill="rgba(245, 241, 232, 0.18)" />
              <text x="171" y="211" font-family="Inter, sans-serif" font-size="8" fill="var(--ivory)">52.06</text>
              <rect x="235" y="204" width="115" height="8" rx="2" fill="rgba(245, 241, 232, 0.18)" />
              <text x="356" y="211" font-family="Inter, sans-serif" font-size="8" fill="var(--ivory)">86.58</text>
            </g>

            <!-- MODEL GROUP: HOLT-WINTERS -->
            <g class="forecast-model-group model-hw">
              <!-- Forecast Curve -->
              <path class="model-path" d="M 180 105 C 210 120, 240 110, 270 125 C 300 120, 330 105, 370 115" fill="none" stroke="rgba(245, 241, 232, 0.35)" stroke-width="1" stroke-dasharray="1, 2" stroke-linecap="round" />
              
              <!-- Hover target row -->
              <rect x="15" y="220" width="370" height="18" fill="#fff" fill-opacity="0" />

              <!-- Performance metrics row -->
              <text x="25" y="232" font-family="Inter, sans-serif" font-size="8.5" fill="var(--ivory)" font-weight="500">HOLT-WINTERS</text>
              <rect x="95" y="224" width="95" height="8" rx="2" fill="rgba(245, 241, 232, 0.18)" />
              <text x="196" y="231" font-family="Inter, sans-serif" font-size="8" fill="var(--ivory)">71.07</text>
              <rect x="235" y="224" width="140" height="8" rx="2" fill="rgba(245, 241, 232, 0.18)" />
              <text x="381" y="231" font-family="Inter, sans-serif" font-size="8" fill="var(--ivory)">105.79</text>
            </g>

            <!-- Horizontal divider line -->
            <line x1="20" y1="148" x2="380" y2="148" stroke="rgba(212, 164, 77, 0.08)" stroke-width="0.75" stroke-dasharray="2, 2" />

            <!-- Performance Evaluation Table Labels -->
            <text x="20" y="163" font-family="Inter, sans-serif" font-size="7" font-weight="600" fill="var(--gold)" letter-spacing="0.1em" opacity="0.6">MODEL COMPARISON (ERROR MEASURES)</text>
            <text x="95" y="174" font-family="Inter, sans-serif" font-size="6.5" font-weight="500" fill="var(--muted)" opacity="0.5">MAE (LOWER IS BETTER)</text>
            <text x="235" y="174" font-family="Inter, sans-serif" font-size="6.5" font-weight="500" fill="var(--muted)" opacity="0.5">RMSE (LOWER IS BETTER)</text>

            <!-- Atmospheric Drifting Particles (Delhi air simulation) -->
            <circle cx="45" cy="50" r="1.2" fill="var(--gold)" opacity="0.12">
              <animate attributeName="cx" values="45;140" dur="8s" repeatCount="indefinite" />
              <animate attributeName="cy" values="50;40;50" dur="8s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="90" r="1.5" fill="var(--gold)" opacity="0.15">
              <animate attributeName="cx" values="100;190" dur="6s" repeatCount="indefinite" />
              <animate attributeName="cy" values="90;105;90" dur="6s" repeatCount="indefinite" />
            </circle>
            <circle cx="210" cy="30" r="1" fill="#fff" opacity="0.2">
              <animate attributeName="cx" values="210;320" dur="10s" repeatCount="indefinite" />
              <animate attributeName="cy" values="30;45;30" dur="10s" repeatCount="indefinite" />
            </circle>
            <circle cx="280" cy="110" r="1.5" fill="var(--gold)" opacity="0.1">
              <animate attributeName="cx" values="280;365" dur="7s" repeatCount="indefinite" />
              <animate attributeName="cy" values="110;95;110" dur="7s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      `;
    }

    function renderShowcaseContent(projectId) {
      const project = PROJECTS_DATA.find(p => p.id === projectId);
      if (!project) return "";

      const paragraphs = project.description.split("\n\n").map(p => `<p>${p}</p>`).join("");
      const isVisual = project.visualType !== "none";

      if (isVisual) {
        showcaseCard.classList.remove("no-visual");
      } else {
        showcaseCard.classList.add("no-visual");
      }

      // Generate buttons dynamically from buttons array configuration
      const buttonsHtml = project.buttons ? project.buttons.map(btn => {
        const btnClass = btn.primary ? "btn-gold" : "btn-outline";
        const icon = btn.isGithub ? `<svg class="github-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align: middle; margin-right: 6px;"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>` : "";
        const arrow = btn.primary && !btn.isGithub ? ` <span class="arrow">↗</span>` : "";
        return `<a href="${btn.url}" class="${btnClass}" target="_blank" rel="noopener">${icon}${btn.label}${arrow}</a>`;
      }).join("") : "";

      // Generate features/highlights dynamically
      let highlightsHtml = "";
      if (project.highlights) {
        const listClass = project.useInsightCards ? "insight-cards-grid" : "highlight-list";
        highlightsHtml = `
          <div class="showcase-highlights ${project.useInsightCards ? 'as-insight-cards' : ''}">
            <span class="highlight-title">${project.useInsightCards ? 'Analytical Insights' : 'Project Highlights'}</span>
            <ul class="${listClass}">
              ${project.highlights.map(h => {
          if (project.useInsightCards) {
            return `<li class="insight-card"><span class="insight-value">${h.val}</span><span class="insight-text-content">${h.text}</span></li>`;
          }
          return `<li class="highlight-list-item">${h}</li>`;
        }).join("")}
            </ul>
          </div>
        `;
      }

      // Generate metrics HTML if they exist
      let metricsHtml = "";
      if (project.metrics) {
        metricsHtml = `
          <div class="showcase-metrics-grid">
            ${project.metrics.map(m => `
              <div class="metric-card">
                <span class="metric-value">${m.value}</span>
                <span class="metric-label">${m.label}</span>
              </div>
            `).join("")}
          </div>
        `;
      }

      let visualHtml = "";
      if (project.visualType === "internhunt") {
        visualHtml = renderInternHuntVisual();
      } else if (project.visualType === "crime") {
        visualHtml = renderCrimeVisual();
      } else if (project.visualType === "forecast") {
        visualHtml = renderForecastVisual();
      }

      return `
        <div class="showcase-top-row ${isVisual ? '' : 'no-visual'}">
          <div class="showcase-statement-area">
            <span class="showcase-badge">✦ ${project.badge} ${project.projectType ? `• ${project.projectType}` : ''}</span>
            <h3 class="showcase-statement">${project.statement.replace(/\n/g, "<br>")}</h3>
            ${project.subtitle ? `<h4 class="showcase-subtitle">${project.subtitle}</h4>` : ''}
          </div>
          ${isVisual ? `
            <div class="showcase-visual-area">
              ${visualHtml}
            </div>
          ` : ""}
        </div>
        <div class="showcase-middle-row ${project.metrics ? 'has-metrics' : ''}">
          ${metricsHtml}
          <div class="showcase-desc">
            ${paragraphs}
          </div>
        </div>
        <div class="showcase-bottom-row">
          <div class="showcase-bottom-left">
            ${highlightsHtml}
          </div>
          <div class="showcase-bottom-right">
            <div class="showcase-tech">
              <span class="font-tiny highlight-gold">TECH STACK</span>
              <div class="tech-pills">
                ${project.stack.map(tech => `<span class="tech-pill">${tech}</span>`).join("")}
              </div>
            </div>
            <div class="showcase-buttons">
              ${buttonsHtml}
            </div>
          </div>
        </div>
      `;
    }

    function triggerProjectSwitch(id) {
      if (isTransitioning) return;
      if (activeId === id) return;

      activeId = id;
      updateActiveStates();
      swapShowcase(id);
    }

    function swapShowcase(projectId) {
      if (isTransitioning) return;
      isTransitioning = true;

      if (crimeRotationInterval) {
        clearInterval(crimeRotationInterval);
        crimeRotationInterval = null;
      }

      showcaseCard.classList.add("transitioning");

      setTimeout(() => {
        showcaseCard.innerHTML = renderShowcaseContent(projectId);
        showcaseCard.classList.remove("transitioning");
        isTransitioning = false;

        if (projectId === "crime-analytics") {
          startCrimeRotation();
        }

        // After transition completes, check if the user is hovering over another project
        if (hoveredItemId && hoveredItemId !== activeId) {
          triggerProjectSwitch(hoveredItemId);
        }
      }, 300);
    }

    // Set initial showcase content
    showcaseCard.innerHTML = renderShowcaseContent(activeId);
    updateActiveStates();
    if (activeId === "crime-analytics") {
      startCrimeRotation();
    }

    // Event Listeners for project items
    items.forEach(item => {
      const id = item.getAttribute("data-id");

      item.addEventListener("mouseenter", () => {
        hoveredItemId = id;

        // If the item entered is already active, do nothing
        if (id === activeId) {
          if (hoverIntentTimeout) {
            clearTimeout(hoverIntentTimeout);
            hoverIntentTimeout = null;
          }
          pendingActiveId = null;
          return;
        }

        // If this item is already pending active, do nothing
        if (id === pendingActiveId) return;

        // Clear any previous hover intent timer
        if (hoverIntentTimeout) {
          clearTimeout(hoverIntentTimeout);
        }

        pendingActiveId = id;
        hoverIntentTimeout = setTimeout(() => {
          pendingActiveId = null;
          triggerProjectSwitch(id);
        }, 120); // 120ms delay to prevent accidental activations
      });

      item.addEventListener("mouseleave", () => {
        if (hoveredItemId === id) {
          hoveredItemId = null;
        }
        if (pendingActiveId === id) {
          if (hoverIntentTimeout) {
            clearTimeout(hoverIntentTimeout);
            hoverIntentTimeout = null;
          }
          pendingActiveId = null;
        }
      });

      item.addEventListener("click", () => {
        // Clicks bypass the hover intent timeout and switch immediately
        if (hoverIntentTimeout) {
          clearTimeout(hoverIntentTimeout);
          hoverIntentTimeout = null;
        }
        pendingActiveId = null;
        triggerProjectSwitch(id);
      });
    });

    window.addEventListener("resize", () => {
      setTimeout(updateActiveStates, 50);
    });
  }

  /* ────────────────────────────────────────────────
     CHAPTER 4 : THE THINKER — Scroll Reveal
     ──────────────────────────────────────────────── */
  function initChapter4() {
    const revealEls = document.querySelectorAll(".ch4-reveal");
    if (!revealEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  /* ────────────────────────────────────────────────
     CHAPTER 5 : BEYOND THE PROJECTS — Scroll Reveal
     ──────────────────────────────────────────────── */
  function initChapter5() {
    const revealEls = document.querySelectorAll(".ch5-reveal");
    if (!revealEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  /* ────────────────────────────────────────────────
     CHAPTER 6 : THE FINAL PAGE — Scroll Reveal
     ──────────────────────────────────────────────── */
  function initChapter6() {
    const section = document.getElementById("chapter-6");
    const bg = document.querySelector(".ch6-bg");
    const revealEls = document.querySelectorAll(".ch6-reveal");

    // 1. Subtle Parallax Effect
    if (section && bg) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let ticking = false;
      let sectionTop = section.getBoundingClientRect().top + window.scrollY;

      // Recalculate on resize
      window.addEventListener("resize", () => {
        sectionTop = section.getBoundingClientRect().top + window.scrollY;
      }, { passive: true });

      window.addEventListener("scroll", () => {
        if (prefersReducedMotion) return;
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            const rectTop = sectionTop - currentScrollY;
            const speed = window.innerWidth <= 768 ? 0.08 : 0.25;
            
            // Only run parallax when Chapter 6 is in the viewport
            if (rectTop < window.innerHeight && (rectTop + section.offsetHeight) > 0) {
              const yPos = -rectTop * speed;
              bg.style.transform = `translate3d(0, ${yPos}px, 0)`;
            }
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }

    // 2. Scroll Reveals
    if (!revealEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -100px 0px" } // Reveal slightly later for dramatic effect
    );

    revealEls.forEach((el) => observer.observe(el));
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
    initChapter3();
    initChapter4();
    initChapter5();
    initChapter6();
    window.addEventListener("resize", updateEyeCoordinates);
  }

  // Wait for DOM + fonts
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
