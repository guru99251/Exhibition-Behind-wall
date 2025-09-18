// Execute after third-party libraries load (deferred).
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
// Basic fade-in animation for elements tagged with .fade-in.
gsap.to(".fade-in", {
  opacity: 1,
  y: 0,
  duration: 0.8,
  scrollTrigger: { trigger: ".fade-in", start: "top 85%" }
});





/* Ellipse title animation helpers */
// Default animation used on the loading screen.
const createAnimation = ({
  duration = 21,
  reversed = false,
  target,
  text,
  textProperties = undefined
}) => {
  if (!target) { return; }

  const pathId = `path-${gsap.utils.random(100000, 999999, 1)}`;
  const props = { duration, ease: "none", repeat: -1 };

  const pathEl = target.querySelector("path");
  if (!pathEl) { return; }

  gsap.set(pathEl, {
    attr: { fill: "none", id: pathId, stroke: "none" }
  });

  target.insertAdjacentHTML(
    "beforeend",
    `
      <text>
        <textPath href='#${pathId}' startOffset="0%">${text}</textPath>
        <textPath href='#${pathId}' startOffset="0%">${text}</textPath>
      </text>
      `
  );

  if (textProperties) {
    gsap.set(target.querySelectorAll("textPath"), textProperties);
  }

  gsap.fromTo(
    target.querySelectorAll("textPath")[0],
    { attr: { startOffset: "0%" } },
    { attr: { startOffset: reversed ? "-100%" : "100%" }, ...props }
  );
  gsap.fromTo(
    target.querySelectorAll("textPath")[1],
    { attr: { startOffset: reversed ? "100%" : "-100%" } },
    { attr: { startOffset: "0%" }, ...props }
  );
};

createAnimation({
  duration: 31,
  reversed: true,
  target: document.querySelector(".ellipse svg"),
  text: "Diposium: 7F System is now online // We are a Node of 7F // --",
  textProperties: { fontSize: /iPhone/.test(navigator.userAgent) ? "19px" : "17px" }
});

// Pulse animation configuration for the loading disc.
const DISC_PULSE_MIN = 0.45;
const DISC_PULSE_MAX = 1.0;
const DISC_PULSE_DUR = 1.05; // Recommended range: 2.5-4.0 seconds.

let discPulse = gsap.fromTo(
  ".ellipse svg",
  { opacity: DISC_PULSE_MIN },
  {
    opacity: DISC_PULSE_MAX,
    duration: DISC_PULSE_DUR,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    paused: true  // Keep paused; showDisc/hideDisc will resume or pause as needed.
  }
);
// Base title animation wiring.


// Helpers for showing and hiding the ellipse title graphic.
const discEl = document.querySelector(".ellipse");
const DISC_FADE_IN  = 1.25;
const DISC_FADE_OUT = 0.75;

// When the overlay is visible we mirror the intro animation behaviour.
function showDisc({ withTitle = false, text = "" } = {}) {
  if (!discEl) return;

  // Allow pointer interaction while the disc overlay is visible.
  gsap.set(discEl, { pointerEvents: "auto" }); // Toggle pointer events on the overlay element itself.
  gsap.to(discEl, { duration:DISC_FADE_IN, autoAlpha: 1, ease: "power2.out" });
  
  if (withTitle) {
    // Reuse the existing title animation if it has already been initialised.
    if (typeof startEllipseTitle === "function") {
      startEllipseTitle(text || "Loading // Please wait // --");
    } else {
      // Legacy implementation created the animation on demand; kept for reference.
      // startEllipseTitle/stopEllipseTitle can be reintroduced later if required.
    }
  }
}

// When hiding the disc, also stop any running animation.
function hideDisc() {
  if (!discEl) return;

  gsap.to(discEl, {
    duration: DISC_FADE_OUT,
    autoAlpha: 0,
    ease: "power2.in",
    onComplete: () => {
      gsap.set(discEl, { pointerEvents: "none" });
      if (typeof stopEllipseTitle === "function") {
        stopEllipseTitle();
      }
    }
  });
}
// End of ellipse helpers.






/* Mosaic background animation */
const rand = (min, max) => {
  return Math.random() * (max - min) + min;
}

class Pixel {
  constructor(x, y, color, speed, delay, delayHide, step, boundSize) {
    this.x = x;
    this.y = y;
    
    this.color = color;
    this.speed = rand(0.1, 0.9) * speed;

    this.size = 0;
    this.sizeStep = rand(0, 0.5);
    this.minSize = 0.5;
    this.maxSizeAvailable = boundSize || 2;
    this.maxSize = rand(this.minSize, this.maxSizeAvailable);
    this.sizeDirection = 1;
    
    this.delay = delay;
    this.delayHide = delayHide;
    this.counter = 0;
    this.counterHide = 0;
    this.counterStep = step;

    this.isHidden = false;
    this.isFlicking = false;
  }

  draw(ctx) {
    const centerOffset = this.maxSizeAvailable * 0.5 - this.size * 0.5;

    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x + centerOffset,
      this.y + centerOffset,
      this.size,
      this.size
    );
  }

  show() {
    this.isHidden = false;
    this.counterHide = 0;

    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }

    if (this.size >= this.maxSize) {
      this.isFlicking = true;
    }

    if (this.isFlicking) {
      this.flicking();
    } else {
      this.size += this.sizeStep;
    }
  }

  hide() {
    this.counter = 0;

    if (this.counterHide <= this.delayHide) {
      this.counterHide += this.counterStep;
      if (this.isFlicking) {
        this.flicking();
      }
      return;
    }
    
    this.isFlicking = false;

    if (this.size <= 0) {
      this.size = 0;
      this.isHidden = true;
      return;
    } else {
      this.size -= 0.05;
    }
  }

  flicking() {
    if (this.size >= this.maxSize) {
      this.sizeDirection = -1;
    } else if (this.size <= this.minSize) {
      this.sizeDirection = 1;
    }
    
    this.size += this.sizeDirection * this.speed; 
  }
}

const canvas = document.createElement("canvas");
const container = document.querySelector("#mosaic");
 if (!container) {
   console.error("#mosaic not found");
 } else {
   container.append(canvas);
 }

// (Optimization A) Frame timing and context setup.
const interval = 1000 / 60;
const ctx = canvas.getContext("2d");

let width;
let height;
let pixels;
let request;
let lastTime;
let ticker;
let maxTicker = 360;
let animationDirection = 1;

const getDelay = (x, y, direction) => {
  let dx = x - width * 0.5;
  let dy = y - height;
  
  if (direction) {
    dy = y;
  }
  
  return Math.sqrt(dx ** 2 + dy ** 2);
}

const initPixels = () => {
  const h = Math.floor(rand(0, 360));
  const colorsLen = 5;
  // (Optimization B) Pre-generate the HSL colour palette for the mosaic.
  const colors = Array.from({ length: colorsLen }, (_, index) => {
    const hh = Math.floor(rand(h, h + (index + 1) * 10));
    const ll = Math.floor(rand(55, 85));
    return `hsl(${hh}, 100%, ${ll}%)`;
  });
  
  // (Optimization C) Adapt the grid gap so the pixel count stays under MAX_PIXELS.
  const MAX_PIXELS = 50000;
  const gap = Math.max(6, Math.floor(Math.sqrt((width * height) / MAX_PIXELS)));
  const step = (width + height) * 0.005;
  const speed = rand(0.008, 0.25);
  const maxSize = Math.floor(gap * 0.5);
  
  pixels = [];
  
  for (let x = 0; x < width; x += gap) {
    for (let y = 0; y < height; y += gap) {
      if (x + maxSize > width || y + maxSize > height) {
        continue;
      }

      const color = colors[Math.floor(Math.random() * colorsLen)];
      const delay = getDelay(x, y);
      const delayHide = getDelay(x, y);

      pixels.push(new Pixel(x, y, color, speed, delay, delayHide, step, maxSize));
    }
  }
}

const animate = () => {
  request = requestAnimationFrame(animate);
  
  const now = performance.now();
  const diff = now - (lastTime || 0);

  if (diff < interval) {
    return;
  }

  lastTime = now - (diff % interval);

  ctx.clearRect(0, 0, width, height);

  if (ticker >= maxTicker) {
    animationDirection = -1;
  } else if (ticker <= 0) {
    animationDirection = 1;
  }
  
  let allHidden = true;

  pixels.forEach((pixel) => {
    if (animationDirection > 0) {
      pixel.show();
    } else {
      pixel.hide();
      allHidden = allHidden && pixel.isHidden;
    }

    pixel.draw(ctx);
  });
  
  ticker += animationDirection;
  
  if (animationDirection < 0 && allHidden) {
    ticker = 0;
  }
}

function resize() {
  cancelAnimationFrame(request);
  
  const rect = container.getBoundingClientRect();
  // (Optimization D) Reduce render scale on high-DPI displays.
  const RENDER_SCALE = (window.devicePixelRatio > 1) ? 0.66 : 0.8; // Use a lower render scale for HiDPI screens.
  width  = Math.floor(rect.width);   // Layout width in CSS pixels.
  height = Math.floor(rect.height);
  canvas.width  = Math.floor(width  * RENDER_SCALE);  // Canvas width in device pixels.
  canvas.height = Math.floor(height * RENDER_SCALE);
  canvas.style.width  = width  + 'px';
  canvas.style.height = height + 'px';
  // Align canvas coordinates with the layout coordinate system.
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  
  initPixels();
  
  ticker = 0;
  
  animate();
}

if (container) {
  new ResizeObserver(resize).observe(container);
  resize();
}

// (Optimization E) Pause the animation while the tab is hidden.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (typeof request !== "undefined") cancelAnimationFrame(request);
  } else {
    // Resume the mosaic as soon as the page becomes visible again.
    resize();
  }
});
// Mosaic background helpers





/* Mosaic helpers */
// Fade out the mosaic and stop the animation loop.
function fadeOutMosaic() {
  gsap.to("#mosaic", { duration: 0.8, autoAlpha: 0, ease: "power2.out" });
  // Cancel any pending animation frame when hiding.
  if (typeof request !== "undefined") cancelAnimationFrame(request);
}

// Reveal the menu overlay.
function showSelectMenu() {
  gsap.set("#select-menu", { visibility: "visible", pointerEvents: "auto" });
  gsap.to("#select-menu", { duration: 0.8, autoAlpha: 1, ease: "power2.out" });
}

// Clicking the landing title starts the intro sequence.
function runIntroSequence() {
  const tl = gsap.timeline();

  // Step 1: fade out the landing title.
  tl.to(".title-container", { duration: 0.6, autoAlpha: 0, ease: "power2.out" }, 0);

  // Step 2: fade out the mosaic background.
  tl.add(() => fadeOutMosaic(), 0);

  // Step 3: play the disc intro animation.
  tl.add(() => { if (typeof discPulse !== "undefined" && discPulse) discPulse.play(); }, "<");
  tl.to(".ellipse", { duration: DISC_FADE_IN, autoAlpha: 1, ease: "power2.out" }, "<");
  tl.to({}, { duration: 2.8 }); // Hold briefly before fading the disc out.
  tl.to(".ellipse", {
    duration: DISC_FADE_OUT,
    autoAlpha: 0,
    ease: "power2.in",
    onStart: () => { if (typeof discPulse !== "undefined" && discPulse) discPulse.pause(); }
  });

  // Step 4: show the menu.
  tl.add(() => showSelectMenu());
}
// End of intro sequence setup.






/* Keyboard shortcuts */
// Start the intro sequence with a click on the title container.
const introTrigger = document.querySelector(".title-container");
if (introTrigger) {
  introTrigger.addEventListener("click", runIntroSequence);
}

// Keyboard shortcuts for manual control.
document.addEventListener('keydown', (ev) => {
  // Ignore shortcuts when focus is inside a form control.
  const tag = document.activeElement && document.activeElement.tagName;
  if (['INPUT','TEXTAREA','SELECT','BUTTON'].includes(tag)) return;

  const k = (ev.key || '').toLowerCase();
  if (k === 'e' || k === 'o') {
    showDisc({ withTitle: true, text: "Loading // Please wait // --" });
  }
  if (k === 'x' || k === 'escape') {
    hideDisc();
  }
});
// End keyboard shortcut handlers.



// // === Page transition loader (?s disc before navigating) ===
// (function setupPageTransitionLoader() {
//   const DURATION_MS = 2200; // Duration of the optional transition overlay.

//   // Intercept clicks on same-page links to show the transition overlay.
//   document.addEventListener('click', (ev) => {
//     const a = ev.target.closest && ev.target.closest('a[href]');
//     if (!a) return;

//     const href = a.getAttribute('href') || '';
//     // Skip external links, downloads, anchors, or new tabs.
//     if (
//       a.target === '_blank' ||
//       a.hasAttribute('download') ||
//       href.startsWith('#') ||
//       /^https?:\/\//i.test(href) && !href.startsWith(location.origin)
//     ) {
//       return; // Keep the default behaviour in those cases.
//     }

//     // Ignore navigation to the same page.
//     if (href.replace(/#.*$/, '') === location.pathname.replace(/\/+$/, '')) {
//       return;
//     }

//     ev.preventDefault();

//     // Optionally show the loading disc.
//     if (typeof showDisc === 'function') {
//       showDisc({ withTitle: false });
//     }
//     setTimeout(() => {
//       window.location.href = href;
//     }, DURATION_MS);
//   });

//   // Hide the disc again when returning from bfcache.
//   window.addEventListener('pageshow', (e) => {
//     if (e.persisted && typeof hideDisc === 'function') hideDisc();
//   });
// })();
// // Page transition loader end






// === Inject corners into each .menu-item and animate on hover ===
(() => {
  const cornerSVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 4V12H4V14H14V4H12Z"></path>
    </svg>`;

  const items = document.querySelectorAll('.menu-item');
  items.forEach((item) => {
    if (!item.querySelector('.corner')) {
      ['top-left','top-right','bottom-left','bottom-right'].forEach(pos => {
        const el = document.createElement('span');
        el.className = `corner ${pos}`;
        el.innerHTML = cornerSVG;
        item.appendChild(el);
      });
    }
    const corners = item.querySelectorAll('.corner');
    gsap.set(corners, { opacity: 0 });
    const show = () => gsap.to(corners, { opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' });
    const hide = () => gsap.to(corners, { opacity: 0, duration: 0.25, stagger: 0.05, ease: 'power2.in'  });
    item.addEventListener('mouseenter', show);
    item.addEventListener('mouseleave', hide);
    item.addEventListener('focus', show);
    item.addEventListener('blur', hide);
  });
})();
// Highlight corners on menu tiles when hovered.



// === Card Pixel Canvas (center-out mosaic on hover) ===
(() => {
  class CardPixel {
    constructor(canvas, ctx, x, y, color, speed, delay) {
      this.canvas = canvas; this.ctx = ctx;
      this.x = x; this.y = y; this.color = color;
      this.speed = (Math.random() * 0.8 + 0.1) * speed;
      this.size = 0; this.sizeStep = Math.random() * 0.4;
      this.minSize = 0.5; this.maxSizeInt = 2;
      this.maxSize = Math.random() * (this.maxSizeInt - this.minSize) + this.minSize;
      this.delay = delay; this.counter = 0;
      this.counterStep = Math.random() * 4 + (canvas.width + canvas.height) * 0.01;
      this.isIdle = false; this.isReverse = false; this.isShimmer = false;
    }
    draw() {
      const o = this.maxSizeInt * 0.5 - this.size * 0.5;
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(this.x + o, this.y + o, this.size, this.size);
    }
    appear() {
      this.isIdle = false;
      if (this.counter <= this.delay) { this.counter += this.counterStep; return; }
      if (this.size >= this.maxSize) this.isShimmer = true;
      if (this.isShimmer) this.shimmer(); else this.size += this.sizeStep;
      this.draw();
    }
    disappear() {
      this.isShimmer = false; this.counter = 0;
      if (this.size <= 0) { this.isIdle = true; return; }
      this.size -= 0.1; this.draw();
    }
    shimmer() {
      if (this.size >= this.maxSize) this.isReverse = true;
      else if (this.size <= this.minSize) this.isReverse = false;
      this.size += (this.isReverse ? -1 : 1) * this.speed;
    }
  }

  class CardPixelCanvas extends HTMLElement {
    static register(tag = "pixel-canvas") {
      if ("customElements" in window && !customElements.get(tag)) {
        customElements.define(tag, this);
      }
    }
    static css = `
      :host{ display:block; inline-size:100%; block-size:100%; overflow:hidden; }
      canvas{ width:100%; height:100%; display:block; }
    `;
    get colors() { return this.dataset.colors?.split(",") || ["#f8fafc","#f1f5f9","#cbd5e1"]; }
    get gap()    { const v = parseInt(this.dataset.gap || 6); return Math.min(50, Math.max(4, v)); }
    get speed()  {
      const v = parseInt(this.dataset.speed || 35), t=0.001;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
      return Math.min(100, Math.max(0, v)) * t;
    }
    connectedCallback(){
      this._parent = this.parentNode;
      this.shadow = this.attachShadow({mode:"open"});
      const sheet = new CSSStyleSheet(); sheet.replaceSync(CardPixelCanvas.css);
      this.shadow.adoptedStyleSheets = [sheet];
      this.canvas = document.createElement("canvas");
      this.ctx = this.canvas.getContext("2d");
      this.shadow.append(this.canvas);
      this.ti = 1000/60; this.tp = performance.now();
      this.init();
      this.ro = new ResizeObserver(()=>this.init()); this.ro.observe(this);
      this._parent.addEventListener("mouseenter", this);
      this._parent.addEventListener("mouseleave", this);
      this._parent.addEventListener("focusin", this);
      this._parent.addEventListener("focusout", this);
    }
    disconnectedCallback(){
      this.ro?.disconnect();
      ["mouseenter","mouseleave","focusin","focusout"].forEach(ev=>this._parent?.removeEventListener(ev,this));
    }
    handleEvent(e){ this["on"+e.type](e); }
    onmouseenter(){ this.play("appear"); }
    onmouseleave(){ this.play("disappear"); }
    onfocusin(e){ if (!e.currentTarget.contains(e.relatedTarget)) this.play("appear"); }
    onfocusout(e){ if (!e.currentTarget.contains(e.relatedTarget)) this.play("disappear"); }
    play(name){ cancelAnimationFrame(this.af); this.af = this.loop(name); }
    init(){
      const r = this.getBoundingClientRect();
      this.canvas.width = Math.floor(r.width);
      this.canvas.height = Math.floor(r.height);
      this.pixels = [];
      for (let x=0; x<this.canvas.width; x+=this.gap){
        for (let y=0; y<this.canvas.height; y+=this.gap){
          const color = this.colors[Math.floor(Math.random()*this.colors.length)];
          const dx = x - this.canvas.width/2, dy = y - this.canvas.height/2;
          const delay = Math.hypot(dx,dy); // Delay scales with distance from the card center.
          this.pixels.push(new CardPixel(this.canvas,this.ctx,x,y,color,this.speed,delay));
        }
      }
    }
    loop(fn){
      this.af = requestAnimationFrame(()=>this.loop(fn));
      const now = performance.now(), diff = now - this.tp;
      if (diff < this.ti) return;
      this.tp = now - (diff % this.ti);
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      let allIdle = true;
      for (let i=0;i<this.pixels.length;i++){
        this.pixels[i][fn](); allIdle = allIdle && this.pixels[i].isIdle;
      }
      if (allIdle) cancelAnimationFrame(this.af);
    }
  }
  CardPixelCanvas.register(); // Register the <pixel-canvas> custom element.
})();
// Floor selector and tooltip interactions for the wall view.
(() => {
  const scroller = document.querySelector('.page-wall .page-main');
  const floorSections = Array.from(document.querySelectorAll('.page-wall .floor-section'));
  const floorButtons = Array.from(document.querySelectorAll('.page-wall .floor-selector__button'));
  const cards = Array.from(document.querySelectorAll('.page-wall .plan-card'));
  if (!scroller || !floorSections.length || !floorButtons.length || !cards.length) { return; }
  if (typeof gsap === 'undefined') { return; }

  scroller.scrollTop = 0;


  const WALL_ARTWORK_ROLLOUT = {
    'spectral-loop': {
      name: 'Spectral Loop',
      summary: 'Immersive installation that syncs sound and colour.',
      floors: [
        { level: '1F 쨌 Reference', note: 'Grouped frequency spectra and audio samples.' },
        { level: '2F 쨌 Storyboard', note: 'Storyboard highlighting loop acceleration and deceleration.' },
        { level: '3F 쨌 Sketches', note: 'Hand sketches exploring wave patterns and light layers.' },
        { level: '4F 쨌 Work Photos', note: 'Projector calibration and fog-machine setup shots.' },
        { level: '5F 쨌 Screenshots', note: '8K final frames and colour grade results.' },
        { level: '6F 쨌 Light Lab', note: 'Laser, fog, and sensor-response logs.' },
        { level: '7F 쨌 Final', note: 'Final beam choreography reacting to visitor position.' }
      ]
    },
    'memory-patch': {
      name: 'Memory Patch',
      summary: 'Interactive UI that rebuilds visitor messages into layered panels.',
      floors: [
        { level: '1F 쨌 Reference', note: 'Research into tone keywords and colour swatches.' },
        { level: '2F 쨌 Storyboard', note: 'Flow from QR scan through emotion classification.' },
        { level: '3F 쨌 Sketches', note: 'Wire sketches for card sorting and modal transitions.' },
        { level: '4F 쨌 Work Photos', note: 'Prototype hardware collaboration shots.' },
        { level: '5F 쨌 Screenshots', note: 'UI captures with live comment data.' },
        { level: '6F 쨌 Light Lab', note: 'Gesture recognition and LED reaction sampling.' },
        { level: '7F 쨌 Final', note: 'Final wall showing live comment overlays.' }
      ]
    },
    'tidal-dream': {
      name: 'Tidal Dream',
      summary: 'Real-time projection inspired by ocean ecosystems.',
      floors: [
        { level: '1F 쨌 Reference', note: 'Collected references for bioluminescence and waves.' },
        { level: '2F 쨌 Storyboard', note: 'Storyboard outlining tides and interaction timing.' },
        { level: '3F 쨌 Sketches', note: 'Studies for particle routing and light bloom.' },
        { level: '4F 쨌 Work Photos', note: 'Reflection tests and particle debugging shots.' },
        { level: '5F 쨌 Screenshots', note: 'HDR stills and colour comparison frames.' },
        { level: '6F 쨌 Light Lab', note: 'Sensor mapping with manual waveform adjustments.' },
        { level: '7F 쨌 Final', note: 'Ocean finale responding to audience audio.' }
      ]
    },
    'orbital-city': {
      name: 'Orbital City',
      summary: 'Game-engine driven interactive cinematic.',
      floors: [
        { level: '1F 쨌 Reference', note: 'Reference boards for structures and materials.' },
        { level: '2F 쨌 Storyboard', note: 'Branching decisions and cutscene transition plans.' },
        { level: '3F 쨌 Sketches', note: 'Perspective and camera path sketches.' },
        { level: '4F 쨌 Work Photos', note: 'Controller experience bay setup shots.' },
        { level: '5F 쨌 Screenshots', note: 'Cinematic frames and UI overlays.' },
        { level: '6F 쨌 Light Lab', note: 'Controller haptics and LED integration tests.' },
        { level: '7F 쨌 Final', note: 'Ending sequence reflecting real-time orbit changes.' }
      ]
    },
    'flora-signal': {
      name: 'Flora Signal',
      summary: 'Installation translating plant bio-signals into visuals and audio.',
      floors: [
        { level: '1F 쨌 Reference', note: 'Collected plant bio-signal references.' },
        { level: '2F 쨌 Storyboard', note: 'Interaction and data-flow diagram.' },
        { level: '3F 쨌 Sketches', note: 'Graphic module and geometry studies.' },
        { level: '4F 쨌 Work Photos', note: 'Sensor calibration and analogue experiments.' },
        { level: '5F 쨌 Screenshots', note: 'Data visualisation and waveform UI captures.' },
        { level: '6F 쨌 Light Lab', note: 'Signal normalisation and audio testing logs.' },
        { level: '7F 쨌 Final', note: 'Final projection with live plant signals.' }
      ]
    }
  };
  const tooltip = document.createElement('div');
  tooltip.className = 'plan-tooltip';
  tooltip.hidden = true;
  document.body.appendChild(tooltip);

  let activeCard = null;
  let tooltipVisible = false;

  const renderTooltip = (key) => {
    const info = WALL_ARTWORK_ROLLOUT[key];
    if (!info) {
          tooltip.innerHTML = '<div class="plan-tooltip__title">Data coming soon</div>';
      return;
    }
    const list = info.floors.map((item) => `
      <li>
        <span class="plan-tooltip__floor">${item.level}</span>
        <p class="plan-tooltip__note">${item.note}</p>
      </li>
    `).join('');
    tooltip.innerHTML = `
      <div class="plan-tooltip__title">${info.name}</div>
      <p class="plan-tooltip__summary">${info.summary}</p>
      <ul class="plan-tooltip__list">${list}</ul>
    `;
  };

  const clampPosition = (x, y) => {
    const bounds = tooltip.getBoundingClientRect();
    let nx = x;
    let ny = y;
    const padding = 20;
    if (nx + bounds.width > window.innerWidth - padding) {
      nx = window.innerWidth - bounds.width - padding;
    }
    if (ny + bounds.height > window.innerHeight - padding) {
      ny = window.innerHeight - bounds.height - padding;
    }
    if (ny < padding) {
      ny = padding;
    }
    if (nx < padding) {
      nx = padding;
    }
    tooltip.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
  };

  const anchorToCard = (card) => {
    requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const bounds = tooltip.getBoundingClientRect();
      const offset = 24;
      let x = rect.right + offset;
      let y = rect.top + (rect.height / 2) - (bounds.height / 2);
      if (x + bounds.width > window.innerWidth - offset) {
        x = rect.left - bounds.width - offset;
      }
      clampPosition(x, y);
    });
  };

  const showTooltip = (card) => {
    const key = card.dataset.artwork;
    renderTooltip(key);
    tooltip.hidden = false;
    tooltip.classList.add('is-visible');
    activeCard = card;
    tooltipVisible = true;
    card.classList.add('is-hovered');
    anchorToCard(card);
  };

  const hideTooltip = (card) => {
    if (card && card !== activeCard) { return; }
    tooltipVisible = false;
    tooltip.classList.remove('is-visible');
    tooltip.hidden = true;
    tooltip.style.transform = 'translate3d(-9999px, -9999px, 0)';
    activeCard?.classList.remove('is-hovered');
    activeCard = null;
  };

  const moveTooltip = (event) => {
    if (!tooltipVisible) { return; }
    const offset = 24;
    let x = event.clientX + offset;
    let y = event.clientY + offset;
    clampPosition(x, y);
  };

  cards.forEach((card) => {
    const info = WALL_ARTWORK_ROLLOUT[card.dataset.artwork];
    if (info) {
      card.setAttribute('aria-label', `${info.name} 쨌 ${info.summary}`);
    }
    card.addEventListener('mouseenter', (event) => {
      showTooltip(event.currentTarget);
      moveTooltip(event);
    });
    card.addEventListener('mousemove', moveTooltip);
    card.addEventListener('mouseleave', (event) => {
      hideTooltip(event.currentTarget);
    });
    card.addEventListener('focus', (event) => {
      showTooltip(event.currentTarget);
    });
    card.addEventListener('blur', (event) => {
      hideTooltip(event.currentTarget);
    });
  });

  const setActiveFloor = (floor) => {
    floorButtons.forEach((button) => {
      const isActive = button.dataset.floor === floor;
      button.classList.toggle('is-active', isActive);
      if (isActive) {
        button.setAttribute('aria-current', 'true');
      } else {
        button.removeAttribute('aria-current');
      }
    });
  };

  floorButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.querySelector(button.dataset.target);
      if (target) {
        scroller.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
      }
    });
  });

  const highlightObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const section = entry.target;
      if (entry.isIntersecting) {
        setActiveFloor(section.dataset.floor);
        gsap.to(section, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      } else {
        const direction = entry.boundingClientRect.top > 0 ? 60 : -60;
        gsap.to(section, { autoAlpha: 0, y: direction, duration: 0.45, ease: 'power1.out' });
      }
    });
  }, { root: scroller, threshold: 0.75 });

  floorSections.forEach((section, index) => {
    gsap.set(section, { autoAlpha: index === 0 ? 1 : 0, y: index === 0 ? 0 : 60 });
    highlightObserver.observe(section);
  });

  setActiveFloor(floorSections[0].dataset.floor);
})();

(() => {
  const headers = document.querySelectorAll('[data-page-header]');
  if (!headers.length) { return; }

  headers.forEach((header, index) => {
    const headerKey = header.getAttribute('data-page-header') || `primary-${index}`;
    const shell = header.closest('.page-shell');
    if (!shell) { return; }

    const headerId = header.getAttribute('id') || `page-header-${headerKey}`;
    header.id = headerId;

    const toggle = header.querySelector('[data-page-header-toggle]');
    const floating = document.querySelector(`[data-page-header-floating="${headerKey}"]`);
    const icon = toggle?.querySelector('.page-header__toggle-icon');
    const label = toggle?.querySelector('.page-header__toggle-text');

    const syncAria = (expanded) => {
      header.setAttribute('aria-hidden', expanded ? 'false' : 'true');
      toggle?.setAttribute('aria-expanded', String(expanded));
      toggle?.setAttribute('aria-controls', headerId);
      floating?.setAttribute('aria-controls', headerId);
      floating?.setAttribute('aria-expanded', String(expanded));
    };

    const updateLabel = (collapsed) => {
      if (icon) {
        icon.textContent = collapsed ? '\u203A' : '\u2039';
      }
      if (label) {
        label.textContent = collapsed ? 'Expand' : 'Collapse';
      }
    };

    const setCollapsed = (collapsed, { focusFloating = false } = {}) => {
      header.classList.toggle('is-collapsed', collapsed);
      shell.classList.toggle('page-shell--header-collapsed', collapsed);

      if (floating) {
        floating.hidden = !collapsed;
        if (collapsed && focusFloating) {
          floating.focus({ preventScroll: true });
        }
      }

      updateLabel(collapsed);
      syncAria(!collapsed);
    };

    setCollapsed(false);

    toggle?.addEventListener('click', () => setCollapsed(true, { focusFloating: true }));
    floating?.addEventListener('click', () => {
      setCollapsed(false);
      toggle?.focus({ preventScroll: true });
    });
  });
})();



(() => {
  const drawer = document.querySelector('[data-comment-drawer]');
  if (!drawer) { return; }

  const toggles = document.querySelectorAll('[data-comment-drawer-toggle]');
  const close = drawer.querySelector('[data-comment-drawer-close]');

  const setOpen = (open) => {
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    toggles.forEach((btn) => btn.setAttribute('aria-expanded', String(open)));
  };

  setOpen(false);

  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = !drawer.classList.contains('is-open');
      setOpen(open);
    });
  });

  close?.addEventListener('click', () => setOpen(false));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });
})();


// === Wall header collapse/expand ===
(() => {
  const shell   = document.querySelector('.page-shell');
  const header  = document.querySelector('.page-header');
  const toggle  = document.querySelector('[data-page-header-toggle]');
  const opener  = document.querySelector('[data-page-header-open]');

  if (!shell || !header || !toggle || !opener) return;

  const collapse = () => {
    shell.classList.add('page-shell--header-collapsed');
    header.classList.add('is-collapsed');
    toggle.setAttribute('aria-expanded', 'false');
    opener.hidden = false;
    opener.setAttribute('aria-expanded', 'false');
  };
  const expand = () => {
    shell.classList.remove('page-shell--header-collapsed');
    header.classList.remove('is-collapsed');
    toggle.setAttribute('aria-expanded', 'true');
    opener.hidden = true;
    opener.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    expanded ? collapse() : expand();
  });
  opener.addEventListener('click', (e) => {
    e.preventDefault();
    expand();
  });
})();

// === Smooth enter/leave per floor (optional) ===
(() => {
  const floors = document.querySelectorAll('.floor-section');
  if (!floors.length) return;
  floors.forEach(sec => gsap.set(sec, { opacity: 0.85, y: 20 }));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({target, isIntersecting}) => {
      if (isIntersecting) {
        gsap.to(target, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      }
    });
  }, { root: document.querySelector('.floor-stack'), threshold: 0.6 });
  floors.forEach(sec => io.observe(sec));
})();





