// Execute after third-party libraries load (deferred).
if (window.gsap && window.ScrollTrigger && window.ScrollToPlugin) {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

// === Supabase client (global) ===
const SUPABASE_URL  = window.SUPABASE_URL  || 'https://tbegcazozckpkjtaticj.supabase.co';
const SUPABASE_ANON = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiZWdjYXpvemNrcGtqdGF0aWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDkyNjIsImV4cCI6MjA3NDEyNTI2Mn0.GMpSO8iBTSRM97ZMMIfqyjc2ZW_kLtQrZwduFNGtxws';
let sb = null;
if (window.supabase?.createClient) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  window.sb = sb; // share for other modules/handlers
} else {
  if (!('sb' in window)) { window.sb = null; }
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.sb && window.supabase?.createClient) {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      window.sb = sb;
    }
  }, { once: true });
}

document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented) { return; }
  if (!(event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar')) { return; }
  const activeElement = (event.target instanceof Element) ? event.target : document.activeElement;
  const tagName = activeElement?.tagName?.toLowerCase();
  const blocked = tagName && ['input', 'textarea', 'select', 'button'].includes(tagName);
  const editable = activeElement?.isContentEditable;
  if (blocked || editable) { return; }
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) { return; }
  event.preventDefault();
  window.location.href = 'index.html';
});

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
  text: "Diposium: System 7F is now online // We are a Node of 7F //   ",
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
// page-wall?먯꽌??紐⑥옄?댄겕 ?뚮뜑 ?먯껜瑜?留됱쓬
const container = document.body.classList.contains('page-wall') ? null : document.querySelector('#mosaic');
if (container) { container.append(canvas); }

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


// === Floor selector & floor paging (instant, no scroll) ===
(() => {
  const scroller = document.querySelector('.page-wall .page-main');
  const floorSections = Array.from(document.querySelectorAll('.page-wall .floor-section'));
  const floorButtons  = Array.from(document.querySelectorAll('.page-wall .floor-selector__button'));
  if (!scroller || !floorSections.length || !floorButtons.length) { return; }

  const baseSection = floorSections[0];
  if (!baseSection) { return; }
  const baseHeader = baseSection.querySelector('.floor-section__head');
  const baseCards  = Array.from(baseSection.querySelectorAll('.plan-card'));

  const floorData = floorSections.map((section) => {
    const header = section.querySelector('.floor-section__head');
    const cards = Array.from(section.querySelectorAll('.plan-card')).map((card) => {
      const photo = card.querySelector('.plan-card__photo');
      const nameEl = card.querySelector('.plan-card__name');
      return {
        artwork: card.dataset.artwork || '',
        label: photo?.dataset.label || '',
        name: nameEl?.textContent || ''
      };
    });

    return {
      floor: section.dataset.floor || '',
      headerHTML: header?.innerHTML || '',
      cards
    };
  });

  const finalCardLookup = new Map();
  let finalFloorLabel = '';

  const finalFloorEntry = floorData.find((entry) => {
    const floorVal = entry.floor?.toString().trim();
    if (!floorVal) { return false; }
    return floorVal === '7' || floorVal.toUpperCase() === '7F';
  });

  if (finalFloorEntry?.cards?.length) {
    finalFloorEntry.cards.forEach((card) => {
      if (card.artwork) {
        finalCardLookup.set(card.artwork, card);
      }
    });
    const floorVal = finalFloorEntry.floor?.toString().trim();
    if (floorVal) {
      const upper = floorVal.toUpperCase();
      finalFloorLabel = upper.endsWith('F') ? upper : `${upper}F`;
    }
  }

  if (!finalFloorLabel) {
    finalFloorLabel = '7F';
  }

  const planMap = baseSection.querySelector('.plan-map');
  const hoverBubble = (() => {
    if (!planMap) { return null; }
    let node = planMap.querySelector('[data-plan-hover-bubble]');
    if (!node) {
      node = document.createElement('div');
      node.className = 'plan-hover-bubble';
      node.dataset.planHoverBubble = 'true';
      node.setAttribute('aria-hidden', 'true');
      node.innerHTML = '<p class="plan-hover-bubble__title"></p><p class="plan-hover-bubble__meta"></p>';
      planMap.appendChild(node);
    }
    const titleEl = node.querySelector('.plan-hover-bubble__title');
    const metaEl = node.querySelector('.plan-hover-bubble__meta');

    const hide = () => {
      node.classList.remove('is-visible', 'is-flipped');
      node.style.transform = 'translate3d(-9999px, -9999px, 0)';
      node.setAttribute('aria-hidden', 'true');
      node.removeAttribute('data-artwork');
    };

    hide();

    const show = (card, cardData) => {
      if (!cardData || !titleEl || !metaEl) {
        hide();
        return;
      }
      titleEl.textContent = cardData.name || '';
      const parts = [];
      if (finalFloorLabel) { parts.push(finalFloorLabel); }
      if (cardData.label) { parts.push(cardData.label); }
      metaEl.textContent = parts.join(' · ');
      node.dataset.artwork = cardData.artwork || '';
      node.setAttribute('aria-hidden', 'false');
      node.classList.add('is-visible');
      node.classList.remove('is-flipped');
      node.style.transform = 'translate3d(-9999px, -9999px, 0)';

      const mapRect = planMap.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const bubbleRect = node.getBoundingClientRect();

      let left = cardRect.left - mapRect.left + (cardRect.width / 2) - (bubbleRect.width / 2);
      const maxLeft = Math.max(16, mapRect.width - bubbleRect.width - 16);
      left = Math.max(16, Math.min(maxLeft, left));

      let top = cardRect.top - mapRect.top - bubbleRect.height - 18;
      if (top < 12) {
        top = cardRect.bottom - mapRect.top + 18;
        node.classList.add('is-flipped');
      }

      node.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    };

    return { show, hide };
  })();

  const revealFinalPreview = (card) => {
    if (!card) { return; }
    const artwork = card.dataset.artwork || '';
    const finalData = artwork ? finalCardLookup.get(artwork) : null;
    const photo = card.querySelector('.plan-card__photo');
    if (!finalData || !photo) {
      hoverBubble?.hide?.();
      card.classList.remove('plan-card--final-preview');
      card.removeAttribute('data-original-label');
      return;
    }
    if (!card.hasAttribute('data-original-label')) {
      card.setAttribute('data-original-label', photo.dataset.label || '');
    }
    photo.dataset.label = finalData.label || '';
    card.classList.add('plan-card--final-preview');
    hoverBubble?.show?.(card, { ...finalData, artwork });
  };

  const resetFinalPreview = (card) => {
    if (!card) { return; }
    const photo = card.querySelector('.plan-card__photo');
    if (photo && card.hasAttribute('data-original-label')) {
      photo.dataset.label = card.getAttribute('data-original-label') || '';
    }
    card.removeAttribute('data-original-label');
    if (!card.matches(':hover') && !card.matches(':focus-within')) {
      hoverBubble?.hide?.();
    }
    card.classList.remove('plan-card--final-preview');
  };

  baseCards.forEach((card) => {
    card.addEventListener('mouseenter', () => revealFinalPreview(card));
    card.addEventListener('focusin', () => revealFinalPreview(card));
    card.addEventListener('mouseleave', () => resetFinalPreview(card));
    card.addEventListener('focusout', () => resetFinalPreview(card));
  });

  planMap?.addEventListener('mouseleave', () => hoverBubble?.hide?.());







  floorSections.forEach((section, idx) => {
    if (idx === 0) {
      section.classList.add('is-active');
      section.removeAttribute('hidden');
      section.removeAttribute('aria-hidden');
    } else {
      section.classList.remove('is-active');
      section.setAttribute('hidden', 'true');
      section.setAttribute('aria-hidden', 'true');
    }
  });

  const applyFloor = (floorIndex) => {
    const data = floorData[floorIndex];
    if (!data) { return; }

    baseSection.dataset.floor = data.floor || '';

    if (baseHeader) {
      baseHeader.innerHTML = data.headerHTML;
    }

    baseCards.forEach((card, idx) => {
      const cardData = data.cards[idx];
      if (!cardData) {
        card.setAttribute('hidden', 'true');
        card.classList.remove('plan-card--final-preview');
        card.removeAttribute('data-original-label');
        card.dataset.artwork = '';
        return;
      }

      card.classList.remove('plan-card--final-preview');
      card.removeAttribute('data-original-label');
      card.removeAttribute('hidden');
      card.dataset.artwork = cardData.artwork || '';
      card.dataset.floor = data.floor || '';

      const photo = card.querySelector('.plan-card__photo');
      if (photo) {
        photo.dataset.label = cardData.label || '';
      }

      const nameNode = card.querySelector('.plan-card__name');
      if (nameNode) {
        nameNode.textContent = cardData.name || '';
      }
    });
    hoverBubble?.hide?.();

  };

  const setActiveFloor = (floorVal) => {
    floorButtons.forEach((button) => {
      const isActive = button.dataset.floor === String(floorVal);
      button.classList.toggle('is-active', isActive);
      if (isActive) {
        button.setAttribute('aria-current', 'true');
      } else {
        button.removeAttribute('aria-current');
      }
    });
  };

  let index = 0;
  const floorCount = floorData.length;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const INACTIVITY_DELAY = 60_000;
  const AUTO_ADVANCE_DELAY = 5_000;
  let inactivityTimer = null;
  let autoTimer = null;
  let autoCycling = false;

  const autoPrompt = (() => {
    const existing = document.querySelector('.floor-auto-prompt');
    if (existing) { return existing; }
    const node = document.createElement('div');
    node.className = 'floor-auto-prompt';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-hidden', 'true');
    node.textContent = 'Spacebar를 눌러 시작하기';
    if (document.body) {
      document.body.appendChild(node);
    } else {
      document.addEventListener('DOMContentLoaded', () => { document.body?.appendChild(node); }, { once: true });
    }
    return node;
  })();

  function showAutoPrompt() {
    if (!autoPrompt) { return; }
    autoPrompt.classList.add('is-visible');
    autoPrompt.setAttribute('aria-hidden', 'false');
  }
  function hideAutoPrompt() {
    if (!autoPrompt) { return; }
    autoPrompt.classList.remove('is-visible');
    autoPrompt.setAttribute('aria-hidden', 'true');
  }

  function startAutoCycle() {
    if (autoCycling || floorCount <= 1) { return; }
    autoCycling = true;
    showAutoPrompt();
    showByIndex(0, { fromAuto: true });
    autoTimer = window.setInterval(() => {
      const nextIndex = (index + 1) % floorCount;
      showByIndex(nextIndex, { fromAuto: true });
    }, AUTO_ADVANCE_DELAY);
  }

  function stopAutoCycle() {
    if (!autoCycling) { return; }
    autoCycling = false;
    hideAutoPrompt();
    window.clearInterval(autoTimer);
    autoTimer = null;
  }

  function resetInactivityTimer() {
    window.clearTimeout(inactivityTimer);
    if (floorCount <= 1) { return; }
    inactivityTimer = window.setTimeout(startAutoCycle, INACTIVITY_DELAY);
  }

  function handleUserActivity() {
    if (autoCycling) {
      stopAutoCycle();
    }
    resetInactivityTimer();
  }

  const showByIndex = (i, { fromAuto = false } = {}) => {
    index = clamp(i, 0, floorCount - 1);
    applyFloor(index);
    setActiveFloor(floorData[index]?.floor ?? '');
    if (!fromAuto) {
      handleUserActivity();
    }
  };

  showByIndex(0);

  floorButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.querySelector(button.dataset.target);
      const targetIndex = floorSections.indexOf(target);
      if (targetIndex >= 0) {
        showByIndex(targetIndex);
      }
    });
  });

  let lock = false;
  const step = (delta) => {
    if (lock) { return; }
    lock = true;
    showByIndex(index + (delta > 0 ? 1 : -1));
    window.setTimeout(() => { lock = false; }, 220);
  };

  scroller.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (Math.abs(event.deltaY) < 8) { return; }
    step(event.deltaY);
  }, { passive: false });

  let startY = 0;
  scroller.addEventListener('touchstart', (event) => {
    startY = event.touches[0].clientY;
  }, { passive: true });
  scroller.addEventListener('touchmove', (event) => {
    event.preventDefault();
    const dy = startY - event.touches[0].clientY;
    if (Math.abs(dy) > 24) {
      step(dy);
      startY = event.touches[0].clientY;
    }
  }, { passive: false });

  scroller.addEventListener('keydown', (event) => {
    const key = event.key;
    if (key === 'ArrowDown' || key === 'PageDown') {
      event.preventDefault();
      step(1);
    }
    if (key === 'ArrowUp' || key === 'PageUp') {
      event.preventDefault();
      step(-1);
    }
  });

  scroller.addEventListener('scroll', () => { scroller.scrollTop = 0; });

  const activityEvents = ['pointerdown', 'pointermove', 'mousemove', 'keydown', 'wheel', 'touchstart', 'touchmove'];
  const passiveEvents = new Set(['wheel', 'touchstart', 'touchmove', 'pointermove', 'mousemove']);
  activityEvents.forEach((type) => {
    const options = passiveEvents.has(type) ? { passive: true } : undefined;
    document.addEventListener(type, handleUserActivity, options);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoCycle();
      window.clearTimeout(inactivityTimer);
      inactivityTimer = null;
    } else {
      resetInactivityTimer();
    }
  });
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





// Minimal drawer toggle (text-based handle)
(() => {
  const drawer = document.getElementById('wallDrawer');
  if (!drawer) return;
  const handle = drawer.querySelector('.wall-drawer__handle');

  const setOpen = (open) => {
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    handle.setAttribute('aria-expanded', String(open));
  };

  setOpen(false);

  const toggle = (e) => {
    if (e.type === 'keydown' && !(e.key === 'Enter' || e.key === ' ')) return;
    e.preventDefault();
    setOpen(!drawer.classList.contains('is-open'));
  };

  handle.addEventListener('click', toggle);
  handle.addEventListener('keydown', toggle);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  // form?.querySelectorAll(".emoji, .phrase").forEach((btn) => {
  //   btn.addEventListener("click", () => {
  //     if (!messageInput) return;
  //     messageInput.value = (messageInput.value || "") + (btn.textContent || "");
  //     typingControls?.syncFromInput();
  //     messageInput.dispatchEvent(new Event("input", { bubbles: true }));
  //   });
  // });
})();

/* === Comment page utilities === */
const COMMENT_STATE = {
  root: null,
  streams: {},
  store: { A: [], B: [], C: [], ALL: [] },
  connection: null,
  likeTracker: new Map()
};


// // ===== DB로 대체 필요
// const SAMPLE_COMMENTS = [
//   {
//     id: 'c-001',
//     zones: ['A'],
//     text: 'Spectral Loop is brighter than earlier rehearsal. The afterglow wraps the ceiling perfectly.',
//     author: { name: 'Eunseo Kim', department: 'Spatial Media', studentId: '20231204' },
//     timestamp: '2024-05-12T11:42:00+09:00',
//     reactions: { emojis: { Light: 3, Spark: 1 }, likes: 7 },
//     artwork: { title: 'Spectral Loop', poster: 'https://picsum.photos/seed/spectral-loop/600/800' }
//   },
//   {
//     id: 'c-002',
//     zones: ['B'],
//     text: 'Kids keep reaching for the holographic coral. Interactive depth feels stable tonight.',
//     author: { name: 'Anonymous', department: 'Visitor', studentId: '' },
//     timestamp: '2024-05-12T11:45:12+09:00',
//     reactions: { emojis: { Wave: 4, Wonder: 2 }, likes: 5 },
//     artwork: { title: 'Tidal Dream', poster: 'https://picsum.photos/seed/tidal-dream/600/800' }
//   },
//   {
//     id: 'c-003',
//     zones: ['C'],
//     text: 'Backstage projection syncs with the live feed. Lag is gone after the afternoon patch.',
//     author: { name: 'Byungwoo Han', department: 'Systems', studentId: 'STF-14' },
//     timestamp: '2024-05-12T11:48:30+09:00',
//     reactions: { emojis: { Gear: 2 }, likes: 3 }
//   },
//   {
//     id: 'c-004',
//     zones: ['ALL'],
//     text: 'Standing ovation when the skyline flips to night cycle. Audio swell gave goosebumps.',
//     author: { name: 'Seoyeon Park', department: 'Guest', studentId: '202405' },
//     timestamp: '2024-05-12T11:51:02+09:00',
//     reactions: { emojis: { Clap: 9, Sky: 3 }, likes: 11 }
//   },
//   {
//     id: 'c-005',
//     zones: ['A', 'B'],
//     text: 'Please bump narration level 2dB around the walkway; words disappear behind the jet fan.',
//     author: { name: 'Engineering Team', department: 'Audio', studentId: 'OPS-08' },
//     timestamp: '2024-05-12T11:53:40+09:00',
//     reactions: { emojis: { Audio: 2 }, likes: 0 }
//   }
// ];

function deriveSidebarSafe() {
  const sidebar = document.querySelector('.wall-sidebar');
  if (!sidebar) { return 220; }
  const rect = sidebar.getBoundingClientRect();
  return rect.left + rect.width + 32;
}

function ensureLikeTracker(commentId) {
  if (!commentId) { return { server: 0, pending: 0 }; }
  if (!COMMENT_STATE.likeTracker) { COMMENT_STATE.likeTracker = new Map(); }
  if (!COMMENT_STATE.likeTracker.has(commentId)) {
    COMMENT_STATE.likeTracker.set(commentId, { server: 0, pending: 0 });
  }
  return COMMENT_STATE.likeTracker.get(commentId);
}

function updateLikeDisplays(commentId) {
  if (!commentId || !COMMENT_STATE.root) { return; }
  const tracker = ensureLikeTracker(commentId);
  const display = Math.max(0, tracker.server + tracker.pending);
  const buttons = COMMENT_STATE.root.querySelectorAll('[data-like-btn]');
  buttons.forEach((button) => {
    if (button.dataset.id === commentId) {
      const target = button.querySelector('.chat-like__count') || button;
      target.textContent = String(display);
    }
  });
}

function initCommentPage(container) {
  if (!container) { return; }
  if (container.dataset.commentInit === '1') { return; }
  container.dataset.commentInit = '1';
  COMMENT_STATE.root = container;
  const fallbackStream = container.querySelector('[data-livechat-stream]');
  COMMENT_STATE.streams = {
    A: container.querySelector('[data-comment-stream="A"]') || fallbackStream,
    B: container.querySelector('[data-comment-stream="B"]') || fallbackStream,
    C: container.querySelector('[data-comment-stream="C"]') || fallbackStream,
    ALL: container.querySelector('[data-comment-stream="ALL"]') || fallbackStream
  };

  // 컴포저/버튼/폼 노드 스코프를 이 함수 안에서 정의
  const openBtn       = container.querySelector('[data-open-composer]');
  const modal         = container.querySelector('[data-composer]');
  const closeEls      = container.querySelectorAll('[data-close-composer]');
  const form          = container.querySelector('[data-composer-form]');
  const selCode       = form?.querySelector('.select-code');
  const selZone       = form?.querySelector('.select-zone');
  const messageInput  = form?.querySelector('.message-input');

  // === 작성 폼 전송 → DB 저장 ===
  if (form && messageInput) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();

      const text = (messageInput.value || '').trim();
      const zone = (selZone?.value || '').toUpperCase() || null;      // ex) 'C' 또는 null
      const code = (selCode?.value || '').trim() || null;             // ex) '117' 또는 null

      if (!text) { 
        messageInput.focus();
        return;
      }

      try {
        const client = (COMMENT_STATE.connection && COMMENT_STATE.connection.supabase) || window.sb;
        if (!client) throw new Error('Supabase client not initialized');

        // 1) comments에 본문 저장 (필수)
        //    - artwork_code는 DB 타입 충돌을 피하려면 우선 null로 저장하고
        //      comment_zones에 zone/code를 기록합니다.
        const extId = (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now());
        const { data: inserted, error: err1 } = await client
          .from('comments')
          .insert([{ text, external_id: extId, artwork_code: code || null }])
          .select('id, text, created_at')
          .single();

        if (err1) throw err1;

        const commentId = inserted.id;

        // 2) zone/code가 지정되었으면 comment_zones에 연결(선택)
        if (zone || code) {
          const payload = { comment_id: commentId, zone_code: zone, artwork_code: code || null };
          const { error: err2 } = await client.from('comment_zones').insert([payload]);
          if (err2) throw err2;
        }

        // 3) 폼 정리 + 모달 닫기
        form.reset();
        modal?.setAttribute('aria-hidden', 'true');
        modal?.classList.remove('is-open');

        // 4) 낙관적 렌더(Realtime이 곧 동기화해주지만 즉시 보이게)
        handleIncomingComment({
          id: commentId,
          text,
          message: text,
          zones: zone ? [zone] : ['ALL'],
          zone: zone || 'ALL',
          code: code || '',
          ts: Date.now(),
          reactions: { likes: 0, emojis: {} },
          likes: 0,
        });

      } catch (error) {
        console.error('[Composer][INSERT ERROR]', error);
        alert('코멘트 저장에 실패했어요. (권한 또는 네트워크 문제일 수 있어요)');
      }
    });
  }


  const safe = deriveSidebarSafe();
  container.style.setProperty('--sidebar-safe', `${safe}px`);
  requestAnimationFrame(() => fitToWidth(container));

  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      const updatedSafe = deriveSidebarSafe();
      container.style.setProperty('--sidebar-safe', `${updatedSafe}px`);
      fitToWidth(container);
    });
  });

  updateConnectionBadge('connecting');
  COMMENT_STATE.store = { A: [], B: [], C: [], ALL: [] };
  COMMENT_STATE.likeTracker = new Map();

  // 데모 데이터는 실제 연결(Realtime/WS)이 없을 때만 주입
  const hasSupabaseCreds = !!(container.dataset.supabaseUrl && container.dataset.supabaseKey && window.supabase?.createClient);
  const hasWs = !!container.dataset.wsUrl;
  if (!hasSupabaseCreds && !hasWs) {
    SAMPLE_COMMENTS.forEach((item) => handleIncomingComment(item));
  }

  const retry = container.querySelector('[data-comment-retry]');

  // Likes: optimistic UI update with Supabase persistence.
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-like-btn]');
    if (!btn) { return; }

    const commentId = btn.dataset.id;
    if (!commentId) { return; }

    const countEl = btn.querySelector('.chat-like__count') || btn;
    const tracker = ensureLikeTracker(commentId);
    if (tracker.server === 0 && tracker.pending === 0) {
      const current = parseInt((countEl.textContent || '').replace(/[^\d]/g, ''), 10);
      if (!Number.isNaN(current)) {
        tracker.server = current;
      }
    }

    tracker.pending += 1;
    updateLikeDisplays(commentId);

    try {
      const client = (COMMENT_STATE.connection && COMMENT_STATE.connection.supabase) || window.sb;
      if (!client) { throw new Error('Supabase client not initialized'); }

      /* 변경 전 */
      // const { error } = await client
      //   .from('comment_reactions')
      //   .insert([{ comment_id: commentId, emoji: 'like', count: 1 }]);

      /* 변경 후 */
// ✅ REPLACE this whole RPC block in the like click handler
      const { data, error } = await client.rpc('increment_like', {
        p_comment_id: commentId,
        p_actor_hash: null,
      });

      if (error) {
        // 실패하면 낙관적 증가 롤백
        tracker.pending = Math.max(0, tracker.pending - 1);
        updateLikeDisplays(commentId);
        console.error('[Like][RPC ERROR]', error);
        return;
      }

      // 서버 최신 카운트로 동기화
      const latest = data?.[0]?.new_count;
      if (Number.isFinite(latest)) {
        tracker.server = latest;
        tracker.pending = 0;
        updateLikeDisplays(commentId);
      }

    } catch (err) {
      tracker.pending = Math.max(0, tracker.pending - 1);
      updateLikeDisplays(commentId);
      console.error('[Like][EXCEPTION]', err);
    }
  });
  // Supabase Realtime가 설정되어 있으면 WS 대신 Supabase를 사용
  const hasSupabase = !!(container.dataset.supabaseUrl && container.dataset.supabaseKey && window.supabase?.createClient);
  if (hasSupabase) {
    COMMENT_STATE.connection = setupSupabaseRealtime(container);
    const retry = container.querySelector('[data-comment-retry]');
    retry?.addEventListener('click', () => {
      updateConnectionBadge('connecting');
      COMMENT_STATE.connection?.reconnect?.();
    });
    return; // 아래 WS 연결 로직은 건너뜀
  }

  const wsUrl = container.dataset.wsUrl || 'wss://behindwall.local/comments';

  COMMENT_STATE.connection = connectCommentsWS(wsUrl, {
    onOpen: () => updateConnectionBadge('online'),
    onClose: () => updateConnectionBadge('offline'),
    onError: () => updateConnectionBadge('offline'),
    onReconnect: () => updateConnectionBadge('connecting'),
    onMessage: (payload) => handleIncomingComment(payload)
  });

  retry?.addEventListener('click', () => {
    updateConnectionBadge('connecting');
    COMMENT_STATE.connection?.reconnect?.();
  });

  openBtn?.addEventListener('click', () => {
    modal?.setAttribute('aria-hidden', 'false');
    modal?.classList.add('is-open');
    // 현재 필터 → 컴포저에 반영
    const z = (container.querySelector('[data-filter-zone]')?.value || '').toUpperCase();
    if (selZone) { selZone.value = z; }
    if (selCode) {
      // 구역에 맞춰 코드 옵션 구성
      setComposerCodeOptions(z);
    }
  });

  closeEls.forEach((el) => {
    el.addEventListener('click', () => {
      modal?.setAttribute('aria-hidden', 'true');
      modal?.classList.remove('is-open');
    });
  });
}

function handleIncomingComment(raw) {
  // 1) 소스별 키를 하나로 맞춤
  const normalized = {
    id: raw.id,
    message: raw.message ?? raw.text ?? '',
    ts: raw.ts ?? (raw.timestamp ? Date.parse(raw.timestamp) : Date.now()),
    zone: raw.zone || (Array.isArray(raw.zones) && raw.zones[0]) || 'ALL',
    zones: raw.zones || (raw.zone ? [raw.zone] : ['ALL']),
    code: raw.code || raw.artwork_code || raw.artwork?.code || '',
    emojis: Array.isArray(raw.emojis) ? raw.emojis
            : (raw.reactions?.emojis ? Object.keys(raw.reactions.emojis) : []),
    likes: Number.isFinite(raw.likes) ? Number(raw.likes) : (Number(raw.reactions?.likes) || 0),
    artworkPoster: raw.artworkPoster || raw.artwork?.poster || raw.artwork_poster || ''
  };

  const tracker = ensureLikeTracker(normalized.id);
  const incomingLikes = Number.isFinite(normalized.likes) ? Number(normalized.likes) : 0;
  const previousServerLikes = tracker.server;
  tracker.server = incomingLikes;
  if (tracker.pending > 0 && incomingLikes > previousServerLikes) {
    const applied = incomingLikes - previousServerLikes;
    tracker.pending = Math.max(0, tracker.pending - applied);
  } else if (incomingLikes < previousServerLikes && tracker.pending > 0) {
    tracker.pending = Math.max(0, Math.min(tracker.pending, tracker.server));
  }
  normalized.likes = tracker.server + tracker.pending;

  // 2) 목적지 컬럼들(A/B/C/ALL)에 삽입 + 렌더
  const targets = Array.isArray(normalized.zones) && normalized.zones.length
    ? normalized.zones.map(z => String(z).toUpperCase())
    : [ (typeof normalized.zone === 'string' ? normalized.zone.toUpperCase() : 'ALL') ];

  targets.forEach((zone) => {
    const updated = upsertMessage(COMMENT_STATE.store, zone, normalized);
    renderColumn(zone, updated);
  });
}


/* =========================================
 * Supabase Realtime Adapter
 * ========================================= */

/* v_comment_feed 단일 row를 payload로 변환 */
function mapFeedRowToPayload(row) {
  const rx = row?.reactions || {};
  const { like, ...emojisObj } = rx;
  const emojisArr = Object.keys(emojisObj || {});
  // zones: ['A'] 형태 우선, 없으면 'ALL'
  const zone = Array.isArray(row.zones) && row.zones.length ? String(row.zones[0]).toUpperCase() : 'ALL';
  return {
    id: row.id,
    message: row.text || '',
    zone,
    zones: row.zones || [zone],     // 안전하게 둘 다 보유
    ts: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    code: row.artwork_code || '',
    emojis: emojisArr,
    likes: (typeof like === 'number' ? like : 0),
    artworkPoster: row.artwork_poster || ''
  };
}

/*
 * Supabase Realtime 구독을 열고, 테이블 변경 발생 시 v_comment_feed를 조회해 렌더링으로 전달.
 * COMMENT_STATE.connection 형태를 WS와 동일 인터페이스(reconnect 메서드)로 제공.
 */
function setupSupabaseRealtime(container) {
  const supaUrl = container.dataset.supabaseUrl;
  const supaKey = container.dataset.supabaseKey;
  if (!supaUrl || !supaKey || !(window.supabase?.createClient)) {
    console.warn('[Supabase] missing url/key or SDK. Fallback to WS.');
    return null;
  }

  const client = window.supabase.createClient(supaUrl, supaKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: {} },
  });

  let channels = [];
  let closed = false;

  const updateOnline = () => updateConnectionBadge('online');
  const updateConnecting = () => updateConnectionBadge('connecting');
  const updateOffline = () => updateConnectionBadge('offline');

  async function fetchAndEmitById(id) {
    if (!id) return;
    const { data, error } = await client
      .from('v_comment_feed')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('[Supabase] fetch v_comment_feed error:', error);
      return;
    }
    const payload = mapFeedRowToPayload(data);
    handleIncomingComment(payload);
  }

  /* zones/reactions 테이블 이벤트에서 comment_id 추출 */
  function commentIdFromEvent(e) {
    // Realtime payload: e.new / e.old
    const row = e?.new || e?.old || {};
    return row.comment_id || row.id || null;
  }

  /* 구독 열기 */
  async function openSubscriptions() {
    updateConnecting();

    // comments INSERT/UPDATE
    const chComments = client.channel('comments')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comments',
      }, (e) => {
        const id = e?.new?.id || e?.old?.id;
        fetchAndEmitById(id);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') updateOnline();
      });

    // comment_zones INSERT/UPDATE/DELETE
    const chZones = client.channel('comment_zones')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comment_zones',
      }, (e) => {
        const id = commentIdFromEvent(e);
        fetchAndEmitById(id);
      })
      .subscribe();

    // comment_reactions INSERT/UPDATE/DELETE
    // ✅ REPLACE the comment_reactions subscription handler
    const chReactions = client.channel('comment_reactions')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comment_reactions',
      }, (e) => {
        const cid = e?.new?.comment_id || e?.old?.comment_id;
        // like 이모지에 대해서만 즉시 UI 패치 (전량 재조회/재렌더 금지)
        if (e?.new?.emoji === 'like' && Number.isFinite(e?.new?.count) && cid) {
          const tr = ensureLikeTracker(cid);
          tr.server = e.new.count;   // 서버 카운트 동기화
          tr.pending = Math.max(0, tr.pending); // 낙관적 증가가 남아 있으면 유지
          updateLikeDisplays(cid);   // 버튼 표시만 즉시 갱신

          // 행 자체도 패치(메시지/시간 등은 변화 없음)
          const item = {
            id: cid,
            ts: Date.now(), // 정렬 재평가가 필요 없으면 기존 ts 유지해도 OK
            zone: 'ALL',    // 안전값; 실제 존은 기존 DOM/스토어에 있음
            code: '',
            message: '',
            emojis: []
          };
          // ALL/A/B/C 어느 컬럼에 있을지 몰라서 모두 갱신 시도(존재하는 곳만 반응)
          ['ALL', 'A', 'B', 'C'].forEach(z => patchRow(z, item));
          return;
        }
        // 이 외 변화(신규 코멘트 등)는 원래대로 fetch → 단건 emit
        const id = cid || e?.new?.id || e?.old?.id;
        fetchAndEmitById(id);
      })
      .subscribe();


    channels = [chComments, chZones, chReactions];

    // 초기 로드: 최신 N개를 불러와 스트림 구축(옵션)
    try {
      const { data, error } = await client
        .from('v_comment_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(400);
      if (!error && Array.isArray(data)) {
        data.forEach((row) => handleIncomingComment(mapFeedRowToPayload(row)));
      }
    } catch (err) {
      console.error('[Supabase] initial fetch error:', err);
    }
  }

  /* 모두 닫기 */
  async function closeSubscriptions() {
    closed = true;
    updateOffline();
    await Promise.all(channels.map((ch) => client.removeChannel(ch)));
    channels = [];
  }

  /* 다시 연결하기 (UI의 Reconnect 버튼과 호환) */
  async function reconnect() {
    await closeSubscriptions();
    closed = false;
    await openSubscriptions();
  }

  // 구독 열기
  openSubscriptions();

  // WS와 동일한 인터페이스로 반환(댓글 페이지의 기존 버튼 로직과 호환)
  return {
    reconnect,
    close: closeSubscriptions,
    supabase: client,
  };
}

function connectCommentsWS(url, handlers = {}) {
  const supportsWS = typeof window !== 'undefined' && 'WebSocket' in window;
  let socket = null;
  let heartbeat = null;
  let reconnectTimer = null;
  let mockConnection = null;
  let attempts = 0;
  const HEARTBEAT_INTERVAL = 25000;
  const MAX_ATTEMPTS = 5;

  const clearHeartbeat = () => {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  };

  const clearReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const stopMock = () => {
    if (mockConnection && typeof mockConnection.close === 'function') {
      mockConnection.close();
    }
    mockConnection = null;
  };

  const activateMock = () => {
    stopMock();
    mockConnection = startMockFeed(handlers);
  };

  const startHeartbeat = () => {
    clearHeartbeat();
    heartbeat = setInterval(() => {
      try {
        socket?.send?.(JSON.stringify({ type: 'ping', at: Date.now() }));
      } catch (err) {
        try {
          socket?.close?.();
        } catch (error) {
          /* noop */
        }
      }
    }, HEARTBEAT_INTERVAL);
  };

  const scheduleReconnect = () => {
    clearReconnect();
    if (attempts >= MAX_ATTEMPTS) {
      activateMock();
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, attempts), 12000);
    reconnectTimer = setTimeout(() => {
      attempts += 1;
      handlers.onReconnect?.(attempts);
      open();
    }, delay);
  };

  const open = () => {
    if (!supportsWS) {
      activateMock();
      return;
    }
    stopMock();
    clearHeartbeat();
    clearReconnect();
    try {
      socket = new WebSocket(url);
    } catch (err) {
      activateMock();
      return;
    }

    socket.addEventListener('open', () => {
      attempts = 0;
      handlers.onOpen?.();
      stopMock();
      startHeartbeat();
    });

    socket.addEventListener('message', (event) => {
      let payload = null;
      try {
        payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch (err) {
        return;
      }
      if (!payload) { return; }
      handlers.onMessage?.(payload);
    });

    socket.addEventListener('close', () => {
      clearHeartbeat();
      handlers.onClose?.();
      scheduleReconnect();
    });

    socket.addEventListener('error', () => {
      handlers.onError?.();
      try {
        socket?.close?.();
      } catch (err) {
        /* noop */
      }
    });
  };

  open();

  return {
    reconnect: () => {
      attempts = 0;
      clearHeartbeat();
      clearReconnect();
      try {
        socket?.close?.();
      } catch (err) {
        /* noop */
      }
      stopMock();
      open();
    },
    close: () => {
      clearHeartbeat();
      clearReconnect();
      stopMock();
      try {
        socket?.close?.();
      } catch (err) {
        /* noop */
      }
    },
    useMock: () => {
      activateMock();
    }
  };
}
function startMockFeed(handlers = {}) {
  updateConnectionBadge('mock');
  let idx = 0;
  const interval = setInterval(() => {
    const base = SAMPLE_COMMENTS[idx % SAMPLE_COMMENTS.length];
    const clone = {
      ...base,
      id: `${base.id}-mock-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    handlers.onMessage?.(clone);
    idx += 1;
  }, 7000);

  return {
    close: () => clearInterval(interval)
  };
}

function mapIncomingToZone(event) {
  if (!event) { return 'ALL'; }
  if (Array.isArray(event.zones) && event.zones.length) {
    return event.zones.map((zone) => (typeof zone === 'string' ? zone.toUpperCase() : 'ALL'));
  }
  if (typeof event.zone === 'string') {
    const normalized = event.zone.toUpperCase();
    if (['A', 'B', 'C', 'ALL'].includes(normalized)) {
      return normalized;
    }
  }
  if (event.target === 'all' || event.broadcast === true) { return 'ALL'; }
  return 'ALL';
}

function upsertMessage(store, zone, item) {
  if (!store[zone]) { store[zone] = []; }
  const cloned = { ...item };
  const list = store[zone];
  const index = list.findIndex((existing) => existing.id === cloned.id);
  if (index > -1) {
    list[index] = { ...list[index], ...cloned };
  } else {
    list.unshift(cloned);
  }
  list.sort((a, b) => (Number(b.ts) || Date.now()) - (Number(a.ts) || Date.now()));
  store[zone] = list.slice(0, 40);
  return store[zone];
}


function renderRow(item) {
  const li = document.createElement('li');
  li.className = 'chat-row';
  li.setAttribute('role', 'article');
  li.setAttribute('aria-roledescription', 'comment');

  // id/정렬/필터용 dataset
  const ts = item.ts ?? Date.now();
  const stamp = new Date(ts);
  li.dataset.id   = item.id || '';
  li.dataset.ts   = String(Number.isNaN(stamp.getTime()) ? Date.now() : stamp.getTime());
  li.dataset.zone = (item.zone || '').toString().toUpperCase();
  li.dataset.code = (item.code || '').toString();

  const meta = document.createElement('div');
  meta.className = 'chat-row__meta';

  const tag = document.createElement('span');
  tag.className = `chat-tag ${item.code ? '--code' : (item.zone ? `--zone-${String(item.zone).toUpperCase()}` : '--all')}`;
  tag.textContent = item.code ? item.code : (item.zone ? String(item.zone).toUpperCase() : 'All');

  // 이모지
  let emojiWrap = null;
  if (Array.isArray(item.emojis) && item.emojis.length) {
    emojiWrap = document.createElement('div');
    emojiWrap.className = 'chat-emojis';
    item.emojis.forEach((em) => {
      const b = document.createElement('span');
      b.className = 'chat-emoji';
      b.textContent = em;
      emojiWrap.appendChild(b);
    });
  }

  const track = document.createElement('div');
  track.className = 'chat-row__track';

  const timeEl = document.createElement('time');
  timeEl.className = 'chat-time';
  try { timeEl.dateTime = new Date(ts).toISOString(); } catch (_) { timeEl.dateTime = new Date().toISOString(); }
  timeEl.textContent = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const likeBtn = document.createElement('button');
  likeBtn.type = 'button';
  likeBtn.className = 'chat-like';
  likeBtn.setAttribute('data-like-btn', '');
  likeBtn.dataset.id = item.id; // ← comments.id 와 동일 값

  const likeCount = document.createElement('span');
  likeCount.className = 'chat-like__count';
  likeCount.textContent = String(Number.isFinite(item.likes) ? Number(item.likes) : 0);
  likeBtn.appendChild(likeCount);

  track.append(timeEl, likeBtn);
  emojiWrap ? meta.append(tag, emojiWrap, track) : meta.append(tag, track);

  const message = document.createElement('p');
  message.className = 'chat-row__message';
  message.textContent = (item.message ?? '').toString();

  li.append(meta, message);

  if (item.artworkPoster) {
    const figure = document.createElement('figure');
    figure.className = 'chat-row__media';
    const img = document.createElement('img');
    img.className = 'chat-row__media-img';
    img.alt = '';
    img.src = item.artworkPoster;
    figure.appendChild(img);
    li.appendChild(figure);
  }

  return li;
}

function renderColumn(zone, items) {
  const target = COMMENT_STATE.streams[zone];
  if (!target) { return; }
  const frag = document.createDocumentFragment();
  items.forEach((item) => {
    frag.appendChild(renderRow(item));   // 👈 여기만 renderCommentCard → renderRow
  });
  target.innerHTML = '';
  target.appendChild(frag);
}

function renderCommentCard(item) {
  const card = document.createElement('article');
  card.className = 'comment-card';
  card.className = 'comment-card';
  card.dataset.id = item.id;
  card.dataset.hasArtwork = item.artwork ? 'true' : 'false';
  card.dataset.zone = (Array.isArray(item.zones) && item.zones[0]) ? String(item.zones[0]).toUpperCase() : 'ALL';
  if (item.artwork?.code) { card.dataset.code = item.artwork.code; }

  const body = document.createElement('div');
  body.className = 'comment-card__body';

  const text = document.createElement('p');
  text.className = 'comment-card__text';
  text.textContent = item.text || '';
  body.appendChild(text);

  const meta = document.createElement('div');
  meta.className = 'comment-card__meta';

  const authorBits = [];
  if (item.author?.name) {
    authorBits.push(item.author.name);
  }
  if (item.author?.department) {
    authorBits.push(item.author.department);
  }
  if (item.author?.studentId) {
    authorBits.push(item.author.studentId);
  }
  if (authorBits.length) {
    const author = document.createElement('span');
    author.textContent = authorBits.join(' / ');
    meta.appendChild(author);
  }
  if (item.timestamp) {
    const time = document.createElement('span');
    const formatted = new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(item.timestamp));
    time.textContent = formatted;
    meta.appendChild(time);
  }
  if (meta.children.length) {
    body.appendChild(meta);
  }

  if (item.reactions) {
    const reactions = document.createElement('div');
    reactions.className = 'comment-card__reactions';
    
    // 이모지 버블
    if (item.reactions.emojis) {
      Object.entries(item.reactions.emojis).forEach(([emoji, count]) => {
        const bubble = document.createElement('span');
        bubble.className = 'comment-card__reaction';
        bubble.dataset.type = 'emoji';
        bubble.textContent = `${emoji} ${count}`;
        reactions.appendChild(bubble);
      });
    }
    
    // 좋아요 버튼(실시간 반영 대상)
    const likeCount = Number(item.reactions.likes || 0);
    const likeBtn = document.createElement('button');
    likeBtn.type = 'button';
    likeBtn.className = 'comment-card__reaction';
    likeBtn.dataset.type = 'like';
    likeBtn.dataset.likeBtn = 'true';
    likeBtn.dataset.id = item.id;
    likeBtn.setAttribute('aria-label', '좋아요');
    likeBtn.textContent = `♥ ${likeCount}`;
    reactions.appendChild(likeBtn);

    if (reactions.children.length) {
      body.appendChild(reactions);
    }
  }

  card.appendChild(body);

  if (item.artwork?.poster) {
    const aside = document.createElement('div');
    aside.className = 'comment-card__artwork';
    const img = document.createElement('img');
    img.alt = item.artwork.title ? `${item.artwork.title} poster` : 'Artwork poster';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = item.artwork.poster;
    aside.appendChild(img);
    card.appendChild(aside);
  }

  return card;
}

function updateConnectionBadge(state) {
  const badge = document.querySelector('[data-connection-badge]');
  if (!badge) { return; }
  const map = {
    online: 'Online',
    connecting: 'Connecting',
    offline: 'Offline',
    mock: 'Demo Feed'
  };
  badge.textContent = map[state] || 'Offline';
  badge.classList.toggle('is-offline', state !== 'online');
}

function fitToWidth(container = document.querySelector('.comment-main')) {
  if (!container) { return; }
  const columns = container.querySelector('.comment-columns');
  if (!columns) { return; }
  const width = columns.clientWidth;
  if (!width) { return; }
  const computed = window.getComputedStyle(columns);
  const gap = parseFloat(computed.gap || computed.columnGap || '16');
  const zoneCount = 4;
  const totalGap = gap * (zoneCount - 1);
  const available = Math.max(width - totalGap, 200);
  const perColumn = available / zoneCount;
  const clamped = Math.min(Math.max(perColumn, 180), 320);
  container.style.setProperty('--comment-column-min', `${clamped}px`);
}

/* === Contributors page utilities === */ 
// ===== DB로 대체 필요
const CONTRIBUTORS_STATE = {
  root: null,
  data: {
    participants: {
      '2D': [
        { name: '진서연', studentId: '23' },
        { name: '황은빈', studentId: '23' },
        { name: '박재은', studentId: '23' },
        { name: '신민주', studentId: '23' },
        { name: '장서영', studentId: '23' },
        { name: '이아림', studentId: '23' },
        { name: '정지원', studentId: '23' }
      ],
      '3D': [
        { name: '조수빈', studentId: '23' },
        { name: '김영우', studentId: '23' },
        { name: '김성은', studentId: '23' },
        { name: '권준서', studentId: '23' },
        { name: '안현영', studentId: '23' },
        { name: '정재희', studentId: '23' },
        { name: '이서진', studentId: '23' },
        { name: '조은서', studentId: '23' },
        { name: 'Ar Raudhah', studentId: '23' },
        { name: '진가언', studentId: '23' },
        { name: '이현지', studentId: '23' },
        { name: '최수현', studentId: '23' },
        { name: '전인서', studentId: '23' },
        { name: '박지영', studentId: '23' },
        { name: '노서진', studentId: '23' },
        { name: '김지원', studentId: '23' },
        { name: '이채빈', studentId: '23' },
        { name: '권민주', studentId: '23' },
        { name: '권미진', studentId: '23' },
        { name: '김가영', studentId: '23' },
        { name: '윤샘', studentId: '23' }
      ],
      'UX/UI': [
        { name: '김효준', studentId: '23' },
        { name: '오주희', studentId: '23' },
        { name: '이주빈', studentId: '23' },
        { name: '한서은', studentId: '23' },
        { name: '이지인', studentId: '23' }
      ],
      'Game': [
        { name: '권준서', studentId: '23' },
        { name: '장서영', studentId: '23' },
        { name: '이시현', studentId: '23' },
        { name: '최수연', studentId: '23' },
        { name: '이수인', studentId: '23' },
        { name: '서혜린', studentId: '23' }
      ],
      'Film': [
        { name: '이유경', studentId: '23' },
        { name: '지서현', studentId: '23' }
      ]
    },
    staff: {
      Chair: [
        { name: '박지영', role: '위원장' }
      ],
      Planning: [
        { name: '김채영', role: '기획 팀장' },
        { name: '권민주', role: '기획' },
        { name: '최주성', role: '기획' },
        { name: '명진영', role: '기획' },
        { name: '김태윤', role: '기획' }
      ],
      Design: [
        { name: '권미진', role: '디자인 팀장' },
        { name: '노서진', role: '디자인' },
        { name: '이성민', role: '디자인' }
      ],
      Operations: [
        { name: '진가언', role: '운영' },
        { name: '이유경', role: '운영' },
        { name: '이시현', role: '운영' }
      ]
    }
  }
};

function initContributorsPage(container) {
  CONTRIBUTORS_STATE.root = container;
  const safe = deriveSidebarSafe();
  container.style.setProperty('--sidebar-safe', `${safe}px`);
  renderParticipants(CONTRIBUTORS_STATE.data.participants, container);
  renderStaff(CONTRIBUTORS_STATE.data.staff, container);
  applyHorizontalLayout(container);

  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      const gutter = deriveSidebarSafe();
      container.style.setProperty('--sidebar-safe', `${gutter}px`);
      applyHorizontalLayout(container);
    });
  });
}

// 파트명을 id로 쓰기 위한 slugify 추가
function slugifyId(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+|\/+/g, '-')   // 공백/슬래시 -> 하이픈
    .replace(/[^a-z0-9\-]/g, '') // 영문/숫자/하이픈만
    .replace(/\-+/g, '-');
}

function renderParticipants(groups, container = CONTRIBUTORS_STATE.root) {
  if (!container) { return; }
  const grid = container.querySelector('[data-participants-grid]');
  if (!grid) { return; }
  grid.innerHTML = '';
  Object.entries(groups).forEach(([discipline, people]) => {
    const column = document.createElement('div');
    column.className = 'contributors-column';
    column.dataset.discipline = discipline;
    column.id = `column-participants-${slugifyId(discipline)}`;
    const title = document.createElement('div');
    title.className = 'contributors-column__title';
    title.textContent = discipline;
    column.appendChild(title);
    const list = document.createElement('ul');
    list.className = 'contributors-list';
    people.forEach((person) => {
      list.appendChild(createListItem(person, 'participant'));
    });
    column.appendChild(list);
    grid.appendChild(column);
  });
}

function renderStaff(groups, container = CONTRIBUTORS_STATE.root) {
  if (!container) { return; }
  const grid = container.querySelector('[data-staff-grid]');
  if (!grid) { return; }
  grid.innerHTML = '';
  Object.entries(groups).forEach(([team, people]) => {
    const column = document.createElement('div');
    column.className = 'contributors-column';
    column.dataset.team = team;
    column.id = `column-staff-${slugifyId(team)}`; // ← 추가
    const title = document.createElement('div');
    title.className = 'contributors-column__title';
    title.textContent = team;
    column.appendChild(title);
    const list = document.createElement('ul');
    list.className = 'contributors-list';
    people.forEach((person) => {
      list.appendChild(createListItem(person, 'staff'));
    });
    column.appendChild(list);
    grid.appendChild(column);
  });
}

function createListItem(person, type) {
  const item = document.createElement('li');
  if (type === 'participant') {
    item.textContent = `${person.name} (${person.studentId})`;
  } else {
    item.textContent = `${person.name} - ${person.role}`;
  }
  return item;
}

function applyHorizontalLayout(container = CONTRIBUTORS_STATE.root) {
  if (!container) { return; }
  const grids = container.querySelectorAll('.contributors-columns');
  grids.forEach((grid) => {
    const width = grid.clientWidth;
    if (!width) { return; }
    const targetColumns = Math.min(4, Math.max(1, Math.round(width / 240)));
    const gap = parseFloat(window.getComputedStyle(grid).gap || '24');
    const available = Math.max(width - gap * (targetColumns - 1), 180);
    const perColumn = available / targetColumns;
    const clamped = Math.min(Math.max(perColumn, 180), 280);
    grid.style.setProperty('--contributors-column-width', `${clamped}px`);
  });
}

/* === Artworks page utilities === */
/* === Artworks page state & helpers (ADD/REPLACE) === */
const ARTWORKS_STATE = {
  root: null,
  grid: null,
  filterBar: null,
  data: [],
  currentZone: 'ALL',
  filterButtons: []
};

// ===== DB로 대체 필요?
const DEFAULT_LQIP = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http://www.w3.org/2000/svg%22 viewBox%3D%220 0 3 4%22%3E%3Crect width%3D%223%22 height%3D%224%22 fill%3D%22%23091420%22/%3E%3C/svg%3E';

// ---------- helpers ----------
function toArray(value) {
  // null/undefined → []
  if (value == null) return [];
  // 이미 배열이면 낱개/공백을 정리
  if (Array.isArray(value)) return value.map(String).map(v => v.trim()).filter(Boolean);
  // 문자열일 때: JSON 배열 문자열이면 파싱 시도
  const s = String(value).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map(String).map(v => v.trim()).filter(Boolean);
  } catch {}
  // 쉼표/세미콜론/슬래시/하이픈 구분자 모두 허용
  return s.split(/[,;/|·\-]+/).map(v => v.trim()).filter(Boolean);
}

function uniq(arr) {
  // 대소문자/양끝공백 무시하고 유니크
  const seen = new Set();
  const out = [];
  for (const raw of arr) {
    const v = String(raw).trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(v); }
  }
  return out;
}

/* DB 연결 부분 */
// === Artworks: DB에서 불러와 기존 카드 렌더 함수가 쓰는 형태로 매핑 ===
// === DB fetch & mapping (REPLACE the partial you have) ===
async function fetchArtworksForCards() {
  // 1) 카드 본문용 뷰(제목/설명/멤버/도구/장르/커버)
  const { data: cards, error: e1 } = await sb
    .from('v_artworks_card')
    .select('code,slug,title,description,team_name,cover_url,members,tools,genres')
    .order('code', { ascending: true });
  if (e1) throw e1;

  // 2) 존 매핑 (필터용) — code ↔ zone_code
  const { data: zonesMap, error: e2 } = await sb
    .from('zone_artworks')
    .select('artwork_code,zone_code');
  if (e2) throw e2;

  const byCode = new Map();
  (zonesMap || []).forEach(r => {
    // zone_code는 'A' ~ 'J' 등 한 글자 코드로 가정
    byCode.set(r.artwork_code, (r.zone_code || '').toUpperCase());
  });

  // 3) 최종 카드용 형태로 매핑
  return (cards || []).map(row => {
    const membersArr = uniq(toArray(row.members));
    const toolsArr   = uniq(toArray(row.tools));
    const genresArr  = uniq(toArray(row.genres));

    return {
      id: row.slug || row.code,
      code: row.code,
      slug: row.slug,
      title: row.title,
      description: row.description,
      members: membersArr,          // ← 배열 유지 (중복 제거됨)
      tools: toolsArr,              // ← 배열 유지 (중복 제거됨)
      discipline: genresArr,        // ← 배열 유지 (칩 분리 가능)
      poster: row.cover_url || '',
      lqip: DEFAULT_LQIP,
      zone: byCode.get(row.code) || 'ALL'
    };
  });
}


// DB값을 주입
/* === Artworks bootstrap === */
async function initArtworksPage(root) {
  ARTWORKS_STATE.root = root;
  ARTWORKS_STATE.grid = root.querySelector('[data-artworks-grid]');
  ARTWORKS_STATE.filterBar = root.querySelector('[data-filter-bar]');

  try {
    const rows = await fetchArtworksForCards();
    ARTWORKS_STATE.data = rows;

    // 필터 UI
    const filterOpts = buildZoneFilterOptionsFromData(rows);
    renderFilterBar(filterOpts, (z) => applyZoneFilter(z));

    // 그리드 렌더
    renderArtworkCards(rows);
  } catch (err) {
    console.error('[Artworks] load failed:', err);
    ARTWORKS_STATE.grid && (ARTWORKS_STATE.grid.textContent = '작품을 불러오지 못했습니다.');
  }
}

/* === Page attach (ADD) === */
document.addEventListener('DOMContentLoaded', () => {
  const artworksRoot = document.querySelector('[data-artworks-root]');
  if (artworksRoot) initArtworksPage(artworksRoot);
});

function buildZoneFilterOptionsFromData(items) {
  const zones = Array.from(new Set(items.map(it => it.zone).filter(Boolean)));
  zones.sort(); // A, B, C ...
  return [{ label: 'All', value: 'ALL' }, ...zones.map(z => ({ label: `Zone ${z}`, value: z }))];
}

function renderFilterBar(zones, onChange) {
  if (!ARTWORKS_STATE.filterBar) return;
  ARTWORKS_STATE.filterBar.innerHTML = '';
  ARTWORKS_STATE.filterButtons = zones.map(({ label, value }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'artworks-filter';
    btn.dataset.zone = value;
    btn.textContent = label;
    btn.addEventListener('click', () => onChange(value));
    ARTWORKS_STATE.filterBar.appendChild(btn);
    return btn;
  });
  // 첫 버튼 활성화
  if (ARTWORKS_STATE.filterButtons.length) {
    ARTWORKS_STATE.filterButtons[0].classList.add('is-active');
  }
}

function setActiveFilter(value) {
  ARTWORKS_STATE.filterButtons.forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.zone === value);
  });
}

/* 카드 DOM 생성 — 스타일 클래스명은 페이지 네임스페이스에 기대어 최소화 */
function createArtworkCard(item) {
  const card = document.createElement('article');
  card.className = 'artwork-card';
  card.dataset.zone = item.zone || '';
  card.dataset.code = item.code || '';

  // Poster
  const fig = document.createElement('figure');
  fig.className = 'artwork-card__poster';
  const img = document.createElement('img');
  img.alt = `${item.title || item.code} poster`;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.dataset.state = 'loading';
  img.src = item.lqip || DEFAULT_LQIP;
  hydratePoster(img, item.poster);
  fig.appendChild(img);

  // Body
  const body = document.createElement('div');
  body.className = 'artwork-card__body';

  const ttl = document.createElement('h3');
  ttl.className = 'artwork-card__title';
  ttl.textContent = item.title || item.code;

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'artwork-card__description';
    desc.textContent = item.description;
    body.append(ttl, desc);
  } else {
    body.append(ttl);
  }

  // Meta (TEAM / TOOL / GENRE chips)
  const meta = document.createElement('div');
  meta.className = 'artwork-card__meta';

  // TEAM
  if (Array.isArray(item.members) && item.members.length) {
    const teamLabel = document.createElement('strong');
    teamLabel.textContent = 'Team';
    meta.appendChild(teamLabel);

    const p = document.createElement('p');
    p.textContent = uniq(item.members).join(', ');
    meta.appendChild(p);
  }

  // TOOL (TEAM 바로 아래)
  if (Array.isArray(item.tools) && item.tools.length) {
    const toolLabel = document.createElement('strong');
    toolLabel.textContent = 'Tool';
    meta.appendChild(toolLabel);

    const ul = document.createElement('ul');
    ul.className = 'artwork-card__tools';
    uniq(item.tools).forEach(t => {
      const li = document.createElement('li');
      li.textContent = `- ${t}`;
      ul.appendChild(li);
    });
    meta.appendChild(ul);
  }

  // GENRE → 칩(.discipline) 개별 표시
  const disciplines = Array.isArray(item.discipline)
    ? uniq(item.discipline)
    : uniq(toArray(item.discipline));

  if (disciplines.length) {
    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'artwork-card__disciplines';
    disciplines.forEach(d => {
      const chip = document.createElement('span');
      chip.className = 'discipline';
      chip.textContent = d;
      chipsWrap.appendChild(chip);
    });
    meta.appendChild(chipsWrap);
  }

  body.appendChild(meta);
  card.append(fig, body);
  return card;
}


function applyZoneFilter(zone) {
  ARTWORKS_STATE.currentZone = zone;
  setActiveFilter(zone);
  const filtered = (zone === 'ALL')
    ? ARTWORKS_STATE.data
    : ARTWORKS_STATE.data.filter(it => (it.zone || '').toUpperCase() === zone.toUpperCase());
  renderArtworkCards(filtered);
}

function renderArtworkCards(items) {
  if (!ARTWORKS_STATE.grid) return;
  ARTWORKS_STATE.grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  items.forEach(it => frag.appendChild(createArtworkCard(it)));
  ARTWORKS_STATE.grid.appendChild(frag);
}

function computeColumnsByWidth(root = ARTWORKS_STATE.root) {
  if (!root) { return; }
  const grid = root.querySelector('[data-artworks-grid]');
  if (!grid) { return; }
  const width = grid.clientWidth;
  if (!width) { return; }
  const gap = parseFloat(window.getComputedStyle(grid).gap || '24');
  const idealCols = Math.max(1, Math.round(width / 320));
  const totalGap = gap * Math.max(idealCols - 1, 0);
  const available = Math.max(width - totalGap, 260);
  const perCol = available / idealCols;
  const clamped = Math.min(Math.max(perCol, 260), 420);
  grid.style.setProperty('--art-card-width', `${clamped}px`);
}

function hydratePoster(imgEl, fullSrc) {
  if (!fullSrc) return;
  const hi = new Image();
  hi.loading = 'eager';
  hi.decoding = 'async';
  hi.src = fullSrc;
  hi.addEventListener('load', () => {
    // 부드럽게 치환
    imgEl.style.transition = 'filter 300ms ease';
    imgEl.style.filter = 'blur(4px)';
    requestAnimationFrame(() => {
      imgEl.src = fullSrc;
      imgEl.style.filter = 'blur(0px)';
    });
  });
}

(() => {
  const commentRoot = document.querySelector('[data-comment-root]');
  if (commentRoot) {
    initCommentPage(commentRoot);
  }
  const contributorsRoot = document.querySelector('[data-contributors-root]');
  if (contributorsRoot) {
    initContributorsPage(contributorsRoot);
  }
  const artworksRoot = document.querySelector('[data-artworks-root]');
  if (artworksRoot) {
    initArtworksPage(artworksRoot);
  }
})();


(function(){
  const root    = document.querySelector('[data-comment-root]');
  if (!root) return;

  const stream  = root.querySelector('[data-livechat-stream]');
  const openBtn = root.querySelector('[data-open-composer]');
  const modal   = root.querySelector('[data-composer]');
  const closeEls= root.querySelectorAll('[data-close-composer]');
  const form    = root.querySelector('[data-composer-form]');
  const selCode = form?.querySelector('.select-code');
  const selZone = form?.querySelector('.select-zone');
  const messageInput = form?.querySelector('.message-input');

  // 필터/정렬 UI
  const filterZoneSel = root.querySelector('[data-filter-zone]');
  const filterCodeSel = root.querySelector('[data-filter-code]');
  const sortGroup     = root.querySelector('[data-sort-group]');

  if (!stream || !form) return;

  // 요구 사양: C:101~111, E:112~116, F:117~125  
  // ===== DB로 대체 필요
  const ARTWORK_BY_ZONE = Object.freeze({
    C: Array.from({length:11}, (_,i)=>`C-${101+i}`),
    E: Array.from({length:5 }, (_,i)=>`E-${112+i}`),
    F: Array.from({length:9 }, (_,i)=>`F-${117+i}`),
  });
  // ['C-101',..., 'F-125']

  // 코드(숫자) → 구역(문자) 역매핑
  const CODE_TO_ZONE = Object.freeze(Object.fromEntries(
    Object.entries(ARTWORK_BY_ZONE).flatMap(([z, arr]) =>
      arr.map(label => [Number(label.replace(/\D/g,'')), z])
    )
  ));

  // ----- 필터 코드 옵션 -----
  function setFilterCodeOptions(zone) {
    const sel = root.querySelector('[data-filter-code]');
    if (!sel) return;
    const pool = zone ? (ARTWORK_BY_ZONE[zone] || []) : Object.values(ARTWORK_BY_ZONE).flat();
    const opts = ['<option value="">(선택 안 함)</option>'];
    opts.push(...pool.map(label => {
      const num = parseInt(label.replace(/\D/g, ''), 10);
      return `<option value="${num}">${label}</option>`;
    }));
    sel.innerHTML = opts.join('');
  }


  setFilterCodeOptions(filterZoneSel?.value || '');

  // ----- composer 코드 옵션 -----
function setComposerCodeOptions(zone) {
  const selCode = form?.querySelector('.select-code');
  if (!selCode) return;
  const normalizedZone = String(zone || '').toUpperCase();
  const codes = (!normalizedZone || normalizedZone === 'ALL') ? Object.values(ARTWORK_BY_ZONE).flat() : (ARTWORK_BY_ZONE[normalizedZone] || []);
  const opts = ['<option value="">(전체)</option>'];
  opts.push(...codes.map(label => {
    const num = parseInt(label.replace(/\D/g, ''), 10);
    return `<option value="${num}">${label}</option>`;
  }));
  selCode.innerHTML = opts.join('');
}


  setComposerCodeOptions(selZone?.value || '');

  // ----- 필터 + 정렬 -----
  let currentSort = 'latest';
  function applyFiltersAndSort() {
    const rawZone = filterZoneSel?.value || '';
    const zone = rawZone.toUpperCase();
    const code = filterCodeSel?.value || '';
    const rows = Array.from(stream.children);
    const isAllZone = !zone || zone === 'ALL';

    // 필터
    rows.forEach(row => {
      const rowZone = (row.dataset.zone || '').toUpperCase();
      const rowCode = (row.dataset.code || '');
      let visible = true;
      if (!isAllZone) visible = visible && rowZone === zone;
      if (!isAllZone && code) visible = visible && rowCode === code;
      row.style.display = visible ? '' : 'none';
    });

    // 정렬(버튼만 사용)
    const visibleRows = rows.filter(r => r.style.display !== 'none');
    visibleRows.sort((a,b) => {
      if (currentSort === 'likes') {
        const la = parseInt(a.querySelector('.chat-like__count')?.textContent || '0', 10);
        const lb = parseInt(b.querySelector('.chat-like__count')?.textContent || '0', 10);
        return lb - la;
      }
      if (currentSort === 'oldest') return (Number(a.dataset.ts)||0) - (Number(b.dataset.ts)||0);
      if (currentSort === 'length') {
        const la = (a.querySelector('.chat-row__message')?.textContent || '').length;
        const lb = (b.querySelector('.chat-row__message')?.textContent || '').length;
        return lb - la;
      }
      // latest
      return (Number(b.dataset.ts)||0) - (Number(a.dataset.ts)||0);
    });

    // 붙여넣기(숨김 항목은 뒤로)
    const hiddenRows = rows.filter(r => r.style.display === 'none');
    stream.innerHTML = '';
    visibleRows.concat(hiddenRows).forEach(r => stream.appendChild(r));
  }

  // 이벤트 바인딩
  filterZoneSel?.addEventListener('change', () => {
    setFilterCodeOptions(filterZoneSel.value);
    if (!filterZoneSel.value && filterCodeSel) {
      filterCodeSel.value = '';
    }
    applyFiltersAndSort();
  });
  
  // // 코드 선택 → 구역 자동 변경 + 옵션 재주입 + 필터/정렬 재적용
  /* 변경 전 */
  // filterCodeSel?.addEventListener('change', () => {
  //   const v = filterCodeSel.value || '';
  //   const m = v.match(/^([A-J])-/i);     // 👈 selCode가 아니라 v를 사용
  //   if (m && filterZoneSel) {
  //     const z = m[1].toUpperCase();
  //     filterZoneSel.value = z;
  //     setFilterCodeOptions(z);           // 해당 구역 코드로 옵션 재구성
  //     filterCodeSel.value = v;           // 재구성 후에도 선택 유지
  //   }
  //   applyFiltersAndSort();
  // });

  /* 변경 후 */
  // 필터 바
  filterCodeSel.addEventListener('change', () => {
    const z = CODE_TO_ZONE[Number(filterCodeSel.value)];
    if (z) {
      filterZoneSel.value = z;
      setFilterCodeOptions(z);
    }
    applyFiltersAndSort();
  });

  // 컴포저
  selCode?.addEventListener('change', () => {
    const z = CODE_TO_ZONE[Number(selCode.value)];
    if (z) selZone.value = z;
  });

  sortGroup?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sort]');
    if (!btn) return;
    currentSort = btn.dataset.sort || 'latest';
    sortGroup.querySelectorAll('[data-sort]')
      .forEach(b => b.classList.toggle('is-active', b === btn));
    applyFiltersAndSort();
  });
  root.querySelector('[data-sort-refresh]')?.addEventListener('click', applyFiltersAndSort);

  const typingControls = initTypingMini({
    demo: root.querySelector('[data-typing-demo]'),
    input: messageInput,
    form
  });

  // 모달: 필터 상태 프리필 후 열기
  function openModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');

    const filterZoneValue = (filterZoneSel?.value || '').toUpperCase();
    const filterCodeValue = filterCodeSel?.value || '';

    if (selZone) { selZone.value = filterZoneValue; }
    const composerZone = (selZone?.value || filterZoneValue).toUpperCase();
    setComposerCodeOptions(composerZone);

    if (selCode) {
      selCode.value = '';
      if (filterCodeValue) {
        // 옵션에 없으면 그대로 빈 값 유지
        const opt = selCode.querySelector(`option[value="${filterCodeValue}"]`);
        if (opt) selCode.value = filterCodeValue;
      }
    }
    
  requestAnimationFrame(() => messageInput?.focus({ preventScroll: true }));
}


  function closeModal(){
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('is-open');
  }

  // 모달: 구역 선택 → 코드 옵션 재주입
  selZone?.addEventListener('change', () => {
    setComposerCodeOptions(selZone.value);
  });


  openBtn?.addEventListener('click', openModal);
  closeEls.forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e)=> {
    if (e.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') closeModal();
  });

  openBtn?.addEventListener('click', openModal);
  closeEls.forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  function tagClass({ code, zone }) {
    if (code) { return '--code'; }
    if (!zone) { return '--all'; }
    return `--zone-${String(zone).toUpperCase()}`;
  }

  function tagLabel({ code, zone }) {
    if (code) { return code; }
    return zone ? String(zone).toUpperCase() : 'All';
  }

  function prependRow(item) {
    const row = renderRow(item);
    stream.prepend(row);
    if (window.gsap) {
      gsap.fromTo(row, { y: -6, autoAlpha: 0 }, { duration: 0.25, y: 0, autoAlpha: 1, ease: 'power2.out' });
    }
    // prependRow(): 신규 행 추가 후 필터/정렬 재적용
    applyFiltersAndSort(); 

  }

  function initTypingMini({ demo, input, form } = {}) {
    if (!demo || !input || !window.gsap) { return null; }

    const svg = demo.querySelector('svg');
    const hiddenText = demo.querySelector('.typing-text');
    if (!svg || !hiddenText) { return null; }

    demo.querySelectorAll('.typing-display').forEach((node) => node.remove());

    const display = document.createElement('div');
    display.className = 'typing-display';
    demo.appendChild(display);

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const colors = [
      { main: '#FBDB4A', shades: ['#FAE073', '#FCE790', '#FADD65', '#E4C650'] },
      { main: '#F3934A', shades: ['#F7B989', '#F9CDAA', '#DD8644', '#F39C59'] },
      { main: '#EB547D', shades: ['#EE7293', '#F191AB', '#D64D72', '#C04567'] },
      { main: '#9F6AA7', shades: ['#B084B6', '#C19FC7', '#916198', '#82588A'] },
      { main: '#5476B3', shades: ['#6382B9', '#829BC7', '#4D6CA3', '#3E5782'] },
      { main: '#2BB19B', shades: ['#4DBFAD', '#73CDBF', '#27A18D', '#1F8171'] },
      { main: '#70B984', shades: ['#7FBE90', '#98CBA6', '#68A87A', '#5E976E'] }
    ];

    const letters = [];
    let previousValue = '';
    let promptTimer = null;
    let promptActive = false;
    let scrollTween = null;
    const PROMPT_TEXT = 'start typing';

    function updateSvgBounds() {
      const rect = demo.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
    }

    // initTypingMini(): SVG 크기 동기화로 파티클 표시 보장
    updateSvgBounds();
    new ResizeObserver(updateSvgBounds).observe(demo);
    window.addEventListener('resize', updateSvgBounds);

    function sharedPrefix(oldChars, newChars) {
      const limit = Math.min(oldChars.length, newChars.length);
      let index = 0;
      while (index < limit && oldChars[index] === newChars[index]) {
        index += 1;
      }
      return index;
    }

    function ensureLatestVisible() {
      if (!demo) { return; }
      if (demo.scrollHeight <= demo.clientHeight + 4) { return; }
      const target = demo.scrollHeight;
      const scrollNow = () => {
        if (window.gsap) {
          scrollTween?.kill();
          scrollTween = gsap.to(demo, {
            scrollTop: target,
            duration: 0.25,
            ease: 'power2.out',
            onComplete: () => { scrollTween = null; }
          });
        } else {
          demo.scrollTop = target;
          scrollTween = null;
        }
      };
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(scrollNow);
      } else {
        scrollNow();
      }
    }

    function render(value) {
      const safeValue = value ?? '';
      hiddenText.textContent = safeValue;
      const newChars = Array.from(safeValue);
      const oldChars = Array.from(previousValue);
      const keep = sharedPrefix(oldChars, newChars);

      while (letters.length > keep) {
        const entry = letters.pop();
        if (!entry) { continue; }
        gsap.to(entry.node, {
          duration: 0.2,
          y: -6,
          opacity: 0,
          ease: 'power1.in',
          onComplete: () => entry.node.remove()
        });
      }

      for (let index = keep; index < newChars.length; index += 1) {
        addLetter(newChars[index], index);
      }

      previousValue = safeValue;
      ensureLatestVisible();
    }

    function addLetter(char, index) {
      const palette = colors[index % colors.length];
      const span = document.createElement('span');
      span.className = 'typing-letter';

      const isBreak = char === ' ';
      const isSpace = char === ' ';

      if (isBreak) {
        span.classList.add('typing-letter--break');
      } else {
        if (isSpace) {
          span.classList.add('typing-letter--space');
        }
        span.style.setProperty('--typing-color', palette.main);
        span.textContent = isSpace ? ' ' : char;
      }

      display.appendChild(span);
      letters[index] = { node: span, palette, char };

      if (isBreak) {
        gsap.set(span, { opacity: 0 });
        return;
      }

      gsap.fromTo(
        span,
        { scale: 0.6, opacity: 0, y: 4 },
        { duration: 0.25, scale: 1, opacity: 1, y: 0, ease: 'back.out(2)' }
      );

      if (!isSpace) {
        spawnBurst(span, palette);
      }
    }

    function spawnBurst(target, palette) {
      if (!palette) { return; }
      const hostRect = demo.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const originX = targetRect.left + targetRect.width / 2 - hostRect.left;
      const originY = targetRect.top + targetRect.height / 2 - hostRect.top;

      for (let i = 0; i < 6; i += 1) {
        spawnCircle(originX, originY, palette.shades[i % palette.shades.length]);
      }
      for (let i = 0; i < 4; i += 1) {
        spawnTriangle(originX, originY, palette.shades[(i + 2) % palette.shades.length]);
      }
    }

    function spawnCircle(x, y, fill) {
      const radius = 1 + Math.random() * 2.6;
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', radius);
      circle.setAttribute('fill', fill);
      svg.appendChild(circle);

      const angle = Math.random() * Math.PI * 2;
      const distance = 24 + Math.random() * 36;

      gsap.fromTo(circle, { opacity: 1 }, {
        duration: 0.6,
        opacity: 0,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        ease: 'power1.out',
        onComplete: () => circle.remove()
      });
    }

    function spawnTriangle(x, y, fill) {
      const size = 5 + Math.random() * 5;
      const tri = document.createElementNS(SVG_NS, 'polygon');
      tri.setAttribute('points', `0,${size} ${size / 2},0 ${size},${size}`);
      tri.setAttribute('fill', fill);
      svg.appendChild(tri);

      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 34;
      const startX = x - size / 2;
      const startY = y - size / 2;

      gsap.fromTo(tri, { opacity: 1, x: startX, y: startY, rotation: Math.random() * 180 }, {
        duration: 0.55,
        opacity: 0,
        x: startX + Math.cos(angle) * distance,
        y: startY + Math.sin(angle) * distance,
        rotation: '+=120',
        ease: 'power1.inOut',
        onComplete: () => tri.remove()
      });
    }

    function stopPromptCycle() {
      if (!promptActive) { return; }
      promptActive = false;
      window.clearTimeout(promptTimer);
      promptTimer = null;
    }

    function startPromptCycle() {
      if (promptActive) { return; }
      promptActive = true;
      window.clearTimeout(promptTimer);
      runPrompt(0);
    }

    function runPrompt(step) {
      if (!promptActive) { return; }
      if (step <= PROMPT_TEXT.length) {
        render(PROMPT_TEXT.slice(0, step));
        promptTimer = window.setTimeout(() => runPrompt(step + 1), 140 + step * 8);
      } else {
        promptTimer = window.setTimeout(() => {
          if (!promptActive) { return; }
          render('');
          runPrompt(0);
        }, 1200);
      }
    }

    function syncFromInput() {
      const value = input.value;
      stopPromptCycle();
      render(value);
      if (!value.length) {
        startPromptCycle();
      }
    }

    input.addEventListener('input', () => {
      const value = input.value;
      stopPromptCycle();
      render(value);
      if (!value.length) {
        startPromptCycle();
      }
    });

    input.addEventListener('focus', () => {
      if (!input.value.length) {
        startPromptCycle();
      } else {
        stopPromptCycle();
        render(input.value);
      }
    });

    input.addEventListener('blur', () => {
      if (!input.value.length) {
        startPromptCycle();
      }
    });

    form?.addEventListener('reset', () => {
      window.requestAnimationFrame(() => {
        render('');
        startPromptCycle();
      });
    });

    updateSvgBounds();
    window.addEventListener('resize', () => {
      requestAnimationFrame(updateSvgBounds);
    });

    render('');
    startPromptCycle();

    return {
      syncFromInput,
      ensurePrompt: () => { if (!input.value.length) { startPromptCycle(); } },
      stopPrompt: stopPromptCycle
    };
  }

  // [02-comment] 퀵픽(이모지/자동문구) 동작
  const selectedEmojis = new Set();
  const VALID_ZONE_CODES = new Set(['A','B','C','D','E','F','G','H','I','J']);
  function normalizeZoneValue(value) {
    if (!value) { return null; }
    const zone = String(value).trim().toUpperCase();
    return VALID_ZONE_CODES.has(zone) ? zone : null;
  }

  function deriveArtworkCode(value) {
    const numeric = Number(value);
    return Number.isInteger(numeric) ? numeric : null;
  }

  function getSupabaseClient() {
    return COMMENT_STATE.connection?.supabase || window.sb || null;
  }

  function buildReactionMap(emojis) {
    if (!Array.isArray(emojis) || !emojis.length) { return {}; }
    const entries = [];
    emojis.forEach((emoji) => {
      const key = String(emoji || '').trim();
      if (key) { entries.push([key, 1]); }
    });

    return Object.fromEntries(entries);
  }

  async function sendCommentViaRpc(client, payload, zonesForRpc, artworkCode, reactionMap) {
    try {
      const { data, error } = await client.rpc('add_comment', {
        payload: {
          id: payload.id,
          text: payload.message,
          zones: zonesForRpc,
          artwork_code: artworkCode,
          reactions: reactionMap
        }
      });

      if (error) {
        console.error('[Supabase] add_comment error:', error);
        return { success: false, error };
      }
      return { success: true, data };
    } catch (err) {
      console.error('[Supabase] add_comment exception:', err);
      return { success: false, error: err };
    }
  }

  async function insertCommentDirect(client, payload, normalizedZones, artworkCode, reactionMap) {
    const baseRow = {
      external_id: payload.id,
      text: payload.message,
      artwork_code: artworkCode
    };

    const inserted = await client
      .from('comments')
      .insert(baseRow)
      .select('id')
      .single();

    let commentId = inserted.data?.id || null;
    if (inserted.error) {
      const err = inserted.error;
      if (err.code === '23505') {
        const existing = await client
          .from('comments')
          .select('id')
          .eq('external_id', payload.id)
          .single();
        if (existing.error) { throw existing.error; }
        commentId = existing.data?.id || null;
      } else {
        throw err;
      }
    }

    if (!commentId) {
      throw new Error('Failed to resolve comment id after insert');
    }

    if (normalizedZones.length) {
      const zoneRows = normalizedZones.map((zone) => ({
        comment_id: commentId,
        zone_code: zone,
        artwork_code: artworkCode
      }));

      const { error: zoneError } = await client
        .from('comment_zones')
        .upsert(zoneRows, { onConflict: 'comment_id,zone_code' });
      if (zoneError && zoneError.code !== '23505') {
        throw zoneError;
      }
    }

    const reactionKeys = Object.keys(reactionMap || {});
    if (reactionKeys.length) {
      const reactionRows = reactionKeys.map((key) => ({
        comment_id: commentId,
        emoji: key,
        count: reactionMap[key]
      }));
      const { error: reactionError } = await client
        .from('comment_reactions')
        .upsert(reactionRows, { onConflict: 'comment_id,emoji' });
      if (reactionError && reactionError.code !== '23505') {
        throw reactionError;
      }
    }
    return { success: true, commentId };
  }


  async function ensureCommentMetadata(client, externalId, normalizedZones, artworkCode) {
    try {
      const { data: existing, error } = await client
        .from('comments')
        .select('id, artwork_code')
        .eq('external_id', externalId)
        .single();
      if (error || !existing) { return; }
      const commentId = existing.id;

      if ((artworkCode ?? null) !== (existing.artwork_code ?? null)) {
        const { error: updateError } = await client
          .from('comments')
          .update({ artwork_code: artworkCode })
          .eq('id', commentId);
        if (updateError) {
          console.warn('[Supabase] comment artwork update failed:', updateError);
        }
      }

      if (normalizedZones.length) {
        const zoneRows = normalizedZones.map((zone) => ({
          comment_id: commentId,
          zone_code: zone,
          artwork_code: artworkCode
        }));

        const { error: zoneError } = await client
          .from('comment_zones')
          .upsert(zoneRows, { onConflict: 'comment_id,zone_code' });
        if (zoneError) {
          console.warn('[Supabase] comment_zones sync error:', zoneError);
        }
      }
    } catch (err) {
      console.warn('[Supabase] ensure metadata exception:', err);
    }
  }


  form?.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    // 이모지: 선택/해제 토글(보내기 시 배지로 반영)
    if (t.classList.contains('emoji')) {
      const em = (t.textContent || '').trim();
      if (!em) return;
      if (selectedEmojis.has(em)) { selectedEmojis.delete(em); t.classList.remove('is-selected'); }
      else { selectedEmojis.add(em); t.classList.add('is-selected'); }
      return;
    }

    // 자동문구: 커서 위치에 바로 삽입
    if (t.classList.contains('phrase')) {
      const phrase = (t.textContent || '').trim();
      if (!phrase || !messageInput) return;
      const el = messageInput;
      const start = el.selectionStart ?? el.value.length;
      const end   = el.selectionEnd ?? el.value.length;
      const joiner = (start > 0 && !/\s$/.test(el.value.slice(0, start))) ? ' ' : '';
      el.setRangeText(joiner + phrase, start, end, 'end');
      el.dispatchEvent(new Event('input', { bubbles: true })); // 타이핑 미니뷰 동기화
      el.focus();
    }
  });

  // [02-comment] 전송: 이모지 포함, 초기화 보강
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const msg = (fd.get('message') || '').toString().trim();
    if (!msg) { return; }

    const payload = {
      id: crypto.randomUUID(),
      message: msg,
      ts: Date.now(),
      zone: (fd.get('zone') || '').toString().trim().toUpperCase(),
      code: (fd.get('artworkCode') || '').toString().trim(),
      emojis: Array.from(selectedEmojis),
      likes: 0
    };
    prependRow(payload);

    const client = getSupabaseClient();
    if (client) {
      const normalizedZone = normalizeZoneValue(payload.zone);
      const normalizedZones = normalizedZone ? [normalizedZone] : [];
      const artworkCode = deriveArtworkCode(payload.code);
      const reactionMap = buildReactionMap(payload.emojis);
      const zonesForRpc = normalizedZones.length ? normalizedZones : ['ALL'];
      let persisted = false;
      const rpcOutcome = await sendCommentViaRpc(client, payload, zonesForRpc, artworkCode, reactionMap);
      persisted = rpcOutcome.success;
      if (!persisted) {
        try {
          const fallbackOutcome = await insertCommentDirect(client, payload, normalizedZones, artworkCode, reactionMap);
          persisted = fallbackOutcome.success;
        } catch (err) {
          console.error('[Supabase] manual comment insert failed:', err);
        }
      }

      if (persisted) {
        await ensureCommentMetadata(client, payload.id, normalizedZones, artworkCode);
        updateConnectionBadge('online')
      } else {
        updateConnectionBadge('offline');
      }
    } else {
      console.warn('[Supabase] client unavailable; comment stored locally only.');
    }

    try {
      if (ws?.readyState === 1) { ws.send(JSON.stringify(payload)); }
    } catch (_) {
      /* noop */
    }
    closeModal();
    form.reset();
    selectedEmojis.clear();
    form.querySelectorAll('.emoji.is-selected').forEach((btn) => btn.classList.remove('is-selected'));
  });

})();

/* === 04-artworks: DB 바인딩 (ADD-ON) ================================
   - zones     : 코드/이름 로드 → 필터 버튼 생성
   - artworks  : v_artworks_card(있으면) 우선 사용, 없으면 기본 테이블 조합
   - zone 필터 : zone_artworks → 코드 목록 → 카드 재조회/정렬
   - 이 블록은 04-artworks.html 에서만 동작 (data-artworks-root 감지)
===================================================================== */

async function _aw_fetchZones() {
  // zones(code,name) 기준
  const { data, error } = await sb.from('zones').select('code,name').order('code', { ascending: true });
  if (error) throw error;
  // 존재하는 존만(코드 알파벳) 정제
  return (data || []).filter(z => /^[A-Z]$/.test(z.code));
}

function _aw_renderFilterBar(root, zones, { active = 'ALL', onPick } = {}) {
  const holder = root.querySelector('[data-filter-bar]');
  if (!holder) return;
  const btn = (code, label, isActive) =>
    `<button type="button" class="artworks-filter${isActive ? ' is-active' : ''}" data-zone="${code}" aria-pressed="${isActive}">${label}</button>`;
  const html = [
    btn('ALL', 'All', active === 'ALL'),
    ...zones.map(z => btn(z.code, z.code, active === z.code))
  ].join('');
  holder.innerHTML = html;
  holder.addEventListener('click', (e) => {
    const el = e.target.closest('[data-zone]');
    if (!el) return;
    const z = el.dataset.zone;
    holder.querySelectorAll('[data-zone]').forEach(b => {
      const on = b.dataset.zone === z;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    onPick?.(z);
  });
}

function _aw_renderCards(grid, items) {
  if (!grid) return;
  if (!items || !items.length) {
    grid.innerHTML = `<p style="opacity:.7">표시할 작품이 없습니다.</p>`;
    return;
  }
  grid.innerHTML = items.map(it => {
    const cover = it.cover_url || it.poster_url || '';
    const members = Array.isArray(it.members) ? it.members.join(', ') : (it.members || '');
    const tools   = Array.isArray(it.tools)   ? it.tools.join(', ')   : (it.tools || '');
    const genres  = Array.isArray(it.genres)  ? it.genres.join(', ')  : (it.genres || '');
    const desc    = it.description || '';
    return `
      <article class="artwork-card" data-code="${it.code}">
        ${cover ? `
          <figure class="artwork-card__poster">
            <img loading="lazy" decoding="async" src="${cover}" alt="${it.title} poster" data-state="ready">
          </figure>` : ''
        }
        <div class="artwork-card__body">
          <h3 class="artwork-card__title">${it.title || it.code}</h3>
          ${desc ? `<p class="artwork-card__description">${desc}</p>` : ''}
          <div class="artwork-card__meta">
            ${members ? `<p><strong>Team</strong>${members}</p>` : ''}
            ${genres  ? `<div class="artwork-card__disciplines">${genres.split(',').map(g=>`<span class="discipline">${g.trim()}</span>`).join('')}</div>` : ''}
            ${tools   ? `<ul class="artwork-card__tools">${tools.split(',').map(t=>`<li>${t.trim()}</li>`).join('')}</ul>` : ''}
          </div>
        </div>
      </article>`;
  }).join('');
}

async function _aw_fetchCardsView_all() {
  // 뷰가 존재하면 한 번에 가져오기
  const { data, error } = await sb.from('v_artworks_card').select('*').order('code', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function _aw_fetchCardsView_inCodes(codes) {
  const { data, error } = await sb
    .from('v_artworks_card')
    .select('*')
    .in('code', codes)
    .order('code', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function _aw_fetchCardsAssemble_all() {
  // 뷰가 없을 때: 기본 테이블로 조합
  const [{ data: artworks, error: e1 }, { data: covers, error: e2 }] = await Promise.all([
    sb.from('artworks').select('code,title,description,slug').order('code', { ascending: true }),
    sb.from('media_assets').select('artwork_code,type,public_url,ord').in('type', ['cover','poster']).order('ord', { ascending: true })
  ]);
  if (e1 || e2) throw (e1 || e2);
  const coverByCode = new Map();
  (covers || []).forEach(a => { if (!coverByCode.has(a.artwork_code)) coverByCode.set(a.artwork_code, a.public_url); });

  // 멤버, 도구, 장르 조인
  const [membersRes, toolsRes, genresRes] = await Promise.all([
    sb.from('artwork_members').select('artwork_code, persons:person_id(name)').order('artwork_code'),
    sb.from('artwork_tools').select('artwork_code, tools:tool_id(name)').order('artwork_code'),
    sb.from('artwork_genres').select('artwork_code, genres:genre_id(name)').order('artwork_code')
  ]);
  if (membersRes.error || toolsRes.error || genresRes.error) {
    throw (membersRes.error || toolsRes.error || genresRes.error);
  }
  const memMap = new Map();
  (membersRes.data || []).forEach(r => {
    const key = r.artwork_code; const n = r.persons?.name; if (!n) return;
    if (!memMap.has(key)) memMap.set(key, []);
    memMap.get(key).push(n);
  });
  const toolMap = new Map();
  (toolsRes.data || []).forEach(r => {
    const key = r.artwork_code; const n = r.tools?.name; if (!n) return;
    if (!toolMap.has(key)) toolMap.set(key, []);
    toolMap.get(key).push(n);
  });
  const genMap = new Map();
  (genresRes.data || []).forEach(r => {
    const key = r.artwork_code; const n = r.genres?.name; if (!n) return;
    if (!genMap.has(key)) genMap.set(key, []);
    genMap.get(key).push(n);
  });

  return (artworks || []).map(a => ({
    code: a.code,
    title: a.title,
    description: a.description,
    cover_url: coverByCode.get(a.code) || null,
    members: memMap.get(a.code) || [],
    tools:   toolMap.get(a.code) || [],
    genres:  genMap.get(a.code) || []
  }));
}

async function _aw_fetchCodesByZone(zoneCode) {
  const { data, error } = await sb
    .from('zone_artworks')
    .select('artwork_code, position')
    .eq('zone_code', zoneCode)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data || []).map(r => r.artwork_code);
}

async function _aw_fetchAllCards_withFallback() {
  try {
    return await _aw_fetchCardsView_all();
  } catch {
    // 뷰 미존재/권한 문제 등 → 조합 모드로 폴백
    return await _aw_fetchCardsAssemble_all();
  }
}

async function _aw_fetchCardsByCodes_withFallback(codes) {
  if (!codes || !codes.length) return [];
  try {
    return await _aw_fetchCardsView_inCodes(codes);
  } catch {
    // 조합 모드: 전체를 한번 만든 뒤, 필요한 코드만 필터
    const all = await _aw_fetchCardsAssemble_all();
    const order = new Map(codes.map((c, i) => [c, i]));
    return all.filter(x => order.has(x.code)).sort((a, b) => order.get(a.code) - order.get(b.code));
  }
}

/* === 01-wall: hydrate existing plan-card from DB === */
async function loadArtworksMap() {
  const { data, error } = await sb
    .from('v_artworks_card')
    .select('code,slug,title,cover_url');
  if (error) throw error;
  const map = new Map();
  (data || []).forEach(r => {
    const key = (r.slug || r.code || '').toString().toLowerCase();
    map.set(key, { title: r.title, cover: r.cover_url });
  });
  return map;
}

async function initWallFromDB() {
  if (!document.body.classList.contains('page-wall')) return;
  try {
    const map = await loadArtworksMap();
    document.querySelectorAll('.plan-card').forEach(card => {
      const key = (card.dataset.artwork || '').toLowerCase();
      const hit = map.get(key);
      if (!hit) return;

      // 제목
      const name = card.querySelector('.plan-card__name');
      if (name && hit.title) name.textContent = hit.title;

      // 라벨은 유지, 포스터 이미지는 hover bubble 대신 미리보기 박스에 백그라운드로
      const photo = card.querySelector('.plan-card__photo');
      if (photo && hit.cover) {
        photo.style.backgroundImage = `url("${hit.cover}")`;
        photo.style.backgroundSize = 'cover';
        photo.style.backgroundPosition = 'center';
        photo.style.border = 'none';
      }
    });
  } catch (e) {
    console.warn('[Wall] hydrate failed', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initWallFromDB();
});

document.addEventListener('DOMContentLoaded', () => {
  const commentRoot = document.querySelector('[data-comment-root]');
  if (commentRoot) {
    initCommentPage(commentRoot);
  }
});
