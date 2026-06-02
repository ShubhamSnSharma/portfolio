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
  function animateReveal() {
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
        const rect = stage.getBoundingClientRect();
        const revealScale = 1.05 * currentScrollScale;
        const originX = rect.width * 0.5;
        const originY = rect.height * 0.33; // Centered at 33% vertical origin for the eyes
        const shiftX = rect.width * 0.035; // 3.5% horizontal shift to match CSS transform
        const maskX = originX + (reveal.currentX - shiftX - originX - reveal.parallaxCurrentX) / revealScale;
        const maskY = originY + (reveal.currentY - originY - reveal.parallaxCurrentY) / revealScale;

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

    function drawParticles() {
      ctx.clearRect(0, 0, W, H);

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

    function onScroll() {
      // Use window.scrollY directly to avoid layout thrashing from getBoundingClientRect
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const vh = window.innerHeight;

      // Progress goes from 0 to 1 as we scroll through the transition height (vh)
      let progress = scrollY / vh;
      progress = Math.max(0, Math.min(1, progress));

      // Choreographed values for premium motion feeling
      const uiFade = Math.max(0, 1 - progress * 3.33); // UI fades out quickly
      const uiPe = uiFade < 0.05 ? "none" : "auto";

      // Preserve face visibility longer: keep portrait fully opaque until 0.75 depth, then decay
      const portraitFade = progress < 0.75
        ? 1.0
        : Math.max(0, 1 - (progress - 0.75) / 0.25);

      // Cinematic zoom limited to 2x (i.e. scale from 1.0 to 2.0)
      const scale = 1 + Math.pow(progress, 1.8) * 1.0;

      // Reduce arc dominance: keep arc subtle, peak at 0.35, dissolve early by 0.7 depth
      const arcOpacity = progress < 0.35
        ? 0.24 + (progress / 0.35) * 0.11
        : Math.max(0, 0.35 - ((progress - 0.35) / 0.35) * 0.35);

      const portraitPe = portraitFade < 0.1 ? "none" : "auto";

      // Double-exposure cinematic transition overlay fade (fades in over eyes, holds, fades out in sync)
      let bridgeFade = 0;
      if (progress > 0.35 && progress <= 0.6) {
        bridgeFade = (progress - 0.35) / 0.25;
      } else if (progress > 0.6 && progress <= 0.75) {
        bridgeFade = 1.0;
      } else if (progress > 0.75 && progress <= 1.0) {
        bridgeFade = Math.max(0, 1 - (progress - 0.75) / 0.25);
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
     INIT EVERYTHING
     ──────────────────────────────────────────────── */
  function init() {
    initLenis();
    initEntryAnimation();
    requestRender(); // Start the state-driven render loop initially
    initParticles();
    initMenu();
    initScrollTransition();
  }

  // Wait for DOM + fonts
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
