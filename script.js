// Execute after third-party libraries load (deferred).
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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

  form?.querySelectorAll(".emoji, .phrase").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!messageInput) return;
      messageInput.value = (messageInput.value || "") + (btn.textContent || "");
      typingControls?.syncFromInput();
      messageInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
})();

/* === Comment page utilities === */
const COMMENT_STATE = {
  root: null,
  streams: {},
  store: { A: [], B: [], C: [], ALL: [] },
  connection: null
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

function initCommentPage(container) {
  COMMENT_STATE.root = container;
  COMMENT_STATE.streams = {
    A: container.querySelector('[data-comment-stream="A"]'),
    B: container.querySelector('[data-comment-stream="B"]'),
    C: container.querySelector('[data-comment-stream="C"]'),
    ALL: container.querySelector('[data-comment-stream="ALL"]')
  };

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

  SAMPLE_COMMENTS.forEach((item) => handleIncomingComment(item));

  const retry = container.querySelector('[data-comment-retry]');
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
}

function handleIncomingComment(payload) {
  const zones = mapIncomingToZone(payload);
  const targets = Array.isArray(zones) ? zones : [zones];
  targets.forEach((zone) => {
    const updated = upsertMessage(COMMENT_STATE.store, zone, payload);
    renderColumn(zone, updated);
  });
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
  list.sort((a, b) => new Date(b.timestamp || Date.now()) - new Date(a.timestamp || Date.now()));
  store[zone] = list.slice(0, 40);
  return store[zone];
}

function renderColumn(zone, items) {
  const target = COMMENT_STATE.streams[zone];
  if (!target) { return; }
  const frag = document.createDocumentFragment();
  items.forEach((item) => {
    frag.appendChild(renderCommentCard(item));
  });
  target.innerHTML = '';
  target.appendChild(frag);
}

function renderCommentCard(item) {
  const card = document.createElement('article');
  card.className = 'comment-card';
  card.dataset.id = item.id;
  card.dataset.hasArtwork = item.artwork ? 'true' : 'false';

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
    if (item.reactions.emojis) {
      Object.entries(item.reactions.emojis).forEach(([emoji, count]) => {
        const bubble = document.createElement('span');
        bubble.className = 'comment-card__reaction';
        bubble.dataset.type = 'emoji';
        bubble.textContent = `${emoji} ${count}`;
        reactions.appendChild(bubble);
      });
    }
    if (typeof item.reactions.likes === 'number') {
      const like = document.createElement('span');
      like.className = 'comment-card__reaction';
      like.dataset.type = 'like';
      like.textContent = `??${item.reactions.likes}`;
      reactions.appendChild(like);
    }
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
        { name: '김은서', studentId: '23' },
        { name: '이민재', studentId: '23' },
        { name: '박지현', studentId: '23' },
        { name: '최도희', studentId: '23' },
        { name: '안하윤', studentId: '23' },
        { name: '윤가람', studentId: '23' },
        { name: '송예린', studentId: '23' },
        { name: '정세나', studentId: '23' }
      ],
      '3D': [
        { name: '한지수', studentId: '23' },
        { name: '서정민', studentId: '23' },
        { name: '권하린', studentId: '23' },
        { name: '문예찬', studentId: '23' },
        { name: '임수혁', studentId: '23' },
        { name: '이유나', studentId: '23' },
        { name: '박혜수', studentId: '23' },
        { name: '백동연', studentId: '23' },
        { name: '강민성', studentId: '23' },
        { name: '장아름', studentId: '23' },
        { name: '신빛나', studentId: '23' },
        { name: '조수빈', studentId: '23' },
        { name: '유혜진', studentId: '23' },
        { name: '김시온', studentId: '23' },
        { name: '류예준', studentId: '23' },
        { name: '구재희', studentId: '23' }
      ],
      'UX/UI': [
        { name: '황시연', studentId: '23' },
        { name: '김하린', studentId: '23' },
        { name: '이주원', studentId: '23' },
        { name: '박소진', studentId: '23' }
      ],
      'Game': [
        { name: '배세훈', studentId: '23' },
        { name: '조이슬', studentId: '23' },
        { name: '박준', studentId: '23' },
        { name: '유다인', studentId: '23' }
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
const ARTWORKS_STATE = {
  root: null,
  grid: null,
  filterBar: null,
  data: [],
  currentZone: 'ALL',
  filterButtons: []
};

// ===== DB로 대체 필요
const DEFAULT_LQIP = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http://www.w3.org/2000/svg%22 viewBox%3D%220 0 3 4%22%3E%3Crect width%3D%223%22 height%3D%224%22 fill%3D%22%23091420%22/%3E%3C/svg%3E';

// ===== DB로 대체 필요
const ARTWORKS_DATA = [
  {
    id: 'spectral-loop',
    title: 'Spectral Loop',
    zone: 'A',
    poster: 'https://picsum.photos/seed/art-spectral/600/800',
    lqip: DEFAULT_LQIP,
    members: ['김은수', '한지수', '명진영', '김태윤', '최주성'],
    description: 'Time gradient pulses translate annotated sensor logs into the main projection spine.',
    discipline: '2D Motion',
    tools: 'TouchDesigner - After Effects'
  },
  {
    id: 'memory-patch',
    title: 'Memory Patch',
    zone: 'B',
    poster: 'https://picsum.photos/seed/art-memory/600/800',
    lqip: DEFAULT_LQIP,
    members: ['권준서', '정재희'],
    description: 'Visitors stitch their favourite wall moments into an evolving stitched mural.',
    discipline: '3D Modeling',
    tools: 'Unity - Arduino'
  },
  {
    id: 'tidal-dream',
    title: 'Tidal Dream',
    zone: 'B',
    poster: 'https://picsum.photos/seed/art-tidal/600/800',
    lqip: DEFAULT_LQIP,
    members: ['최주성', '이시현'],
    description: 'Layered foam shaders respond to live comment sentiment and ripple along the corridor.',
    discipline: 'Game',
    tools: 'Unreal Engine - Houdini'
  },
  {
    id: 'orbital-city',
    title: 'Orbital City',
    zone: 'C',
    poster: 'https://picsum.photos/seed/art-orbital/600/800',
    lqip: DEFAULT_LQIP,
    members: ['김채영', '권민주'],
    description: 'City-scale choropleths orbit the backstage glass and echo the skyline finale.',
    discipline: 'UX/UI',
    tools: 'Blender - Substance Painter'
  },
  {
    id: 'flora-signal',
    title: 'Flora Signal',
    zone: 'A',
    poster: 'https://picsum.photos/seed/art-flora/600/800',
    lqip: DEFAULT_LQIP,
    members: ['박지영', '권미진'],
    description: 'Real-time plant data pulses across the entrance plane in sync with biometric LEDs.',
    discipline: '3D Motion',
    tools: 'MaxMSP - Python'
  },
  {
    id: 'backstage-scan',
    title: 'Backstage Scan',
    zone: 'C',
    poster: 'https://picsum.photos/seed/art-backstage/600/800',
    lqip: DEFAULT_LQIP,
    members: ['권민주', '최주성', '진가언', '이성민'],
    description: 'LiDAR sweeps rebuild the staff runway as a volumetric ghost behind the wall.',
    discipline: '3D Motion',
    tools: 'RealityCapture - Notch'
  },
  {
    id: 'comment-loom',
    title: 'Comment Loom',
    zone: 'B',
    poster: 'https://picsum.photos/seed/art-loom/600/800',
    lqip: DEFAULT_LQIP,
    members: ['명진영', '김태윤'],
    description: 'Live visitor notes weave into typographic threads projected along the comment bay.',
    discipline: 'UX/UI',
    tools: 'Figma - Svelte'
  }
];


function initArtworksPage(container) {
  ARTWORKS_STATE.root = container;
  ARTWORKS_STATE.grid = container.querySelector('[data-artworks-grid]');
  ARTWORKS_STATE.filterBar = container.querySelector('[data-filter-bar]');
  ARTWORKS_STATE.data = ARTWORKS_DATA;
  ARTWORKS_STATE.currentZone = 'ALL';

  const safe = deriveSidebarSafe();
  container.style.setProperty('--sidebar-safe', `${safe}px`);

  renderFilterBar(
    [
      { label: 'All', value: 'ALL' },
      { label: 'Zone A', value: 'A' },
      { label: 'Zone B', value: 'B' },
      { label: 'Zone C', value: 'C' }
    ],
    (zone) => applyZoneFilter(zone)
  );

  renderArtworkCards(ARTWORKS_STATE.data);
  computeColumnsByWidth(container);

  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      const gutter = deriveSidebarSafe();
      container.style.setProperty('--sidebar-safe', `${gutter}px`);
      computeColumnsByWidth(container);
    });
  });
}

function renderFilterBar(zones, onChange) {
  if (!ARTWORKS_STATE.filterBar) { return; }
  ARTWORKS_STATE.filterBar.innerHTML = '';
  ARTWORKS_STATE.filterButtons = zones.map((zone, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'artworks-filter';
    button.dataset.zoneFilter = zone.value;
    button.textContent = zone.label;
    if (index === 0) {
      button.classList.add('is-active');
    }
    button.addEventListener('click', () => {
      onChange(zone.value);
    });
    ARTWORKS_STATE.filterBar.appendChild(button);
    return button;
  });
}

function applyZoneFilter(zone) {
  ARTWORKS_STATE.currentZone = zone;
  ARTWORKS_STATE.filterButtons.forEach((button) => {
    const active = button.dataset.zoneFilter === zone;
    button.classList.toggle('is-active', active);
  });
  const filtered = zone === 'ALL'
    ? ARTWORKS_STATE.data
    : ARTWORKS_STATE.data.filter((item) => item.zone === zone);
  renderArtworkCards(filtered);
  computeColumnsByWidth();
}

function renderArtworkCards(items) {
  if (!ARTWORKS_STATE.grid) { return; }
  ARTWORKS_STATE.grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'artwork-card';
    card.dataset.zone = item.zone;

    const poster = document.createElement('div');
    poster.className = 'artwork-card__poster';
    const img = document.createElement('img');
    img.alt = `${item.title} poster`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.dataset.poster = item.poster;
    hydratePoster(img, item.lqip || DEFAULT_LQIP);
    poster.appendChild(img);
    card.appendChild(poster);

    const body = document.createElement('div');
    body.className = 'artwork-card__body';

    const title = document.createElement('h3');
    title.className = 'artwork-card__title';
    title.textContent = item.title;
    body.appendChild(title);

    if (item.description) {
      const description = document.createElement('p');
      description.className = 'artwork-card__description';
      // description.textContent = item.description;
      description.textContent = `> ${item.description}`;
      body.appendChild(description);
    }

    const meta = document.createElement('div');
    meta.className = 'artwork-card__meta';

    // Team label with count, e.g. "Team (2)"
    if (item.members?.length) {
      const block = document.createElement('div');
      const label = document.createElement('strong');
      label.textContent = `Team (${item.members.length})`; // <-- add count
      block.appendChild(label);

      // Join names with a comma and a space for readability
      block.appendChild(document.createTextNode('- ' + item.members.join(', ')));
      meta.appendChild(block);
    }

    // Tools label with count, e.g. "Tools (3)"
    if (item.tools) {
      const block = document.createElement('div');
      const label = document.createElement('strong');

      // Split text into multiple tools by comma, dash, or slash
      const tools = String(item.tools)
        .split(/[,/]|[\u002D\u2013\u2014]/) // -, –, —
        .map(s => s.trim())
        .filter(Boolean);

      label.textContent = `Tools (${tools.length})`; // <-- add count
      block.appendChild(label);

      // Render one tool per line
      const list = document.createElement('ul');
      list.className = 'artwork-card__tools';
      tools.forEach(t => {
        const li = document.createElement('li');
        li.textContent = `- ${t}`;
        list.appendChild(li);
      });

      block.appendChild(list);
      meta.appendChild(block);
    }

      // Tools label with count is finished above, meta still open

      // --- Build disciplines as horizontal chips WITHIN meta (unified UX) ---
      const disciplinesWrap = document.createElement('div');
      disciplinesWrap.className = 'artwork-card__disciplines';

      /* Normalize disciplines to an array:
         - If it's already an array, use it.
         - Else split by comma, slash, or dash variations. */
      const disciplines = Array.isArray(item.discipline)
        ? item.discipline
        : String(item.discipline)
            .split(/[;,]|[\u002D\u2013\u2014]/)   // no slash as a delimiter // -, –, —
            .map(s => s.trim())
            .filter(Boolean);

      disciplines.forEach(d => {
        const chip = document.createElement('span');
        chip.className = 'discipline';
        chip.textContent = d;
        disciplinesWrap.appendChild(chip);
      });

      // Put disciplines inside meta so it stays visually unified with Team/Tools
      meta.appendChild(disciplinesWrap);

      // --- finalize card assembly AFTER meta is complete ---
      body.appendChild(meta);
      card.appendChild(body);
      frag.appendChild(card);
  });
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

function hydratePoster(img, lqipSrc = DEFAULT_LQIP) {
  if (!img) { return; }
  img.dataset.state = 'loading';
  img.src = lqipSrc;
  const finalSrc = img.dataset.poster;
  if (!finalSrc) {
    img.dataset.state = 'ready';
    return;
  }
  const loader = new Image();
  loader.decoding = 'async';
  loader.loading = 'eager';
  loader.src = finalSrc;
  loader.addEventListener('load', () => {
    img.src = finalSrc;
    img.dataset.state = 'ready';
  });
  loader.addEventListener('error', () => {
    img.dataset.state = 'ready';
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

// ====수정된 부분====
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

  const ALL_CODES = Object.values(ARTWORK_BY_ZONE).flat();  // ['C-101',..., 'F-125']

  // ----- 필터 코드 옵션 -----
  function setFilterCodeOptions(zoneValue) {
    if (!filterCodeSel) return;
    const zone = (zoneValue || '').toUpperCase();
    const opts = ['<option value="">(선택 안 함)</option>'];
    if (ARTWORK_BY_ZONE[zone]) {
      opts.push(ARTWORK_BY_ZONE[zone].map(c=>`<option>${c}</option>`).join(''));
    } else {
      // 👇 전체 목록은 ALL_CODES 사용
      opts.push(ALL_CODES.map(c=>`<option>${c}</option>`).join(''));
    }
    filterCodeSel.innerHTML = opts.join('');
  }
  setFilterCodeOptions(filterZoneSel?.value || '');

  // ----- composer 코드 옵션 -----
  function setComposerCodeOptions(zoneValue) {
    if (!selCode) return;
    const zone = (zoneValue || '').toUpperCase();
    const opts = ['<option value="">(선택 안 함)</option>'];
    if (ARTWORK_BY_ZONE[zone]) {
      opts.push(ARTWORK_BY_ZONE[zone].map(c=>`<option>${c}</option>`).join(''));
    } else {
      // 👇 구역 미선택 시 전체 코드 보여주기
      opts.push(ALL_CODES.map(c=>`<option>${c}</option>`).join(''));
    }
    selCode.innerHTML = opts.join('');
  }
  setComposerCodeOptions(selZone?.value || '');

  // ----- 필터 + 정렬 -----
  let currentSort = 'latest';
  function applyFiltersAndSort() {
    const zone = (filterZoneSel?.value || '').toUpperCase();
    const code = filterCodeSel?.value || '';
    const rows = Array.from(stream.children);

    // 필터
    rows.forEach(row => {
      const rowZone = (row.dataset.zone || '').toUpperCase();
      const rowCode = (row.dataset.code || '');
      let visible = true;
      if (zone && zone !== 'ALL') visible = visible && rowZone === zone;
      if (code) visible = visible && rowCode === code;
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
    applyFiltersAndSort();
  });
  
  // 코드 선택 → 구역 자동 변경 + 옵션 재주입 + 필터/정렬 재적용
  filterCodeSel?.addEventListener('change', () => {
    const v = filterCodeSel.value || '';
    const m = v.match(/^([A-I])-/i);     // 👈 selCode가 아니라 v를 사용
    if (m && filterZoneSel) {
      const z = m[1].toUpperCase();
      filterZoneSel.value = z;
      setFilterCodeOptions(z);           // 해당 구역 코드로 옵션 재구성
      filterCodeSel.value = v;           // 재구성 후에도 선택 유지
    }
    applyFiltersAndSort();
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
    modal?.setAttribute('aria-hidden','false');
    if (selZone) {
      selZone.value = (filterZoneSel?.value || '').toUpperCase();
      setComposerCodeOptions(selZone.value);
    }
    if (selCode && filterCodeSel?.value) selCode.value = filterCodeSel.value;
    requestAnimationFrame(()=> messageInput?.focus({ preventScroll:true }));
  }
  function closeModal(){ modal?.setAttribute('aria-hidden','true'); }

  // 모달: 코드 선택 → 구역 자동 반영
  selCode?.addEventListener('change', () => {
    const v = selCode.value || '';
    const m = v.match(/^([A-I])-/i);
    if (m && selZone) {
      const z = m[1].toUpperCase();
      selZone.value = z;
      setComposerCodeOptions(z);  // 해당 구역 코드들로 목록 재구성
      selCode.value = v;          // 재구성 후에도 선택 유지
    }
  });

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

  // [02-comment] renderRow: dataset 순서 오류 해결 + 이모지 배지 출력
  function renderRow(item) {
    const li = document.createElement('li');
    li.className = 'chat-row';
    li.setAttribute('role', 'article');
    li.setAttribute('aria-roledescription', 'comment');

    const timestampSource = item.ts ?? Date.now();
    let timestamp = new Date(timestampSource);
    if (Number.isNaN(timestamp.getTime())) timestamp = new Date();

    // !! 타임스탬프 계산 후 dataset 부여 (오류 수정)
    li.dataset.ts   = String(timestamp.getTime());
    li.dataset.zone = (item.zone || '').toString().toUpperCase();
    li.dataset.code = (item.code || '').toString();

    const meta = document.createElement('div');
    meta.className = 'chat-row__meta';

    const tag = document.createElement('span');
    tag.className = `chat-tag ${tagClass(item)}`;
    tag.textContent = tagLabel(item);

    // 선택 이모지 배지
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
    try { timeEl.dateTime = timestamp.toISOString(); } catch (_) { timeEl.dateTime = new Date().toISOString(); }
    timeEl.textContent = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const likeBtn = document.createElement('button');
    likeBtn.type = 'button';
    likeBtn.className = 'chat-like';
    const likeCount = document.createElement('span');
    likeCount.className = 'chat-like__count';
    likeCount.textContent = String(Number.isFinite(item.likes) ? Number(item.likes) : 0);
    likeBtn.appendChild(likeCount);
    likeBtn.addEventListener('click', () => {
      const nextValue = parseInt(likeCount.textContent || '0', 10) + 1;
      likeCount.textContent = String(nextValue);
    });

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

  /* --- WebSocket --- */
  const WS_URL = (window.COMMENT_WS_URL || 'wss://example.com/live');
  let ws; let retry = 0; let timer;

  function connect(){
    try {
      ws = new WebSocket(WS_URL);
      ws.addEventListener('open', () => {
        retry = 0;
      });
      ws.addEventListener('message', (e) => {
        const data = JSON.parse(e.data);
        prependRow(data);
      });
      ws.addEventListener('close', () => retryConnect());
      ws.addEventListener('error', () => {
        try { ws.close(); } catch (_) {}
      });
    } catch (err) {
      retryConnect();
    }
  }

  function retryConnect(){
    if (retry > 6) { return; }
    clearTimeout(timer);
    const wait = Math.min(2000 * (retry + 1), 8000);
    timer = setTimeout(connect, wait);
    retry += 1;
  }
  connect();

  if (location.hostname === 'localhost' || location.protocol === 'file:') {
    setInterval(() => {
      prependRow({
        id: crypto.randomUUID(),
        message: ['Amazing','Incredible','Wow!','Love the color','Super vibrant'][Math.floor(Math.random() * 5)],
        ts: Date.now(),
        zone: ['A','B','C',null][Math.floor(Math.random() * 4)],
        code: Math.random() > .7 ? ARTWORK_CODES[Math.floor(Math.random() * ARTWORK_CODES.length)] : '',
        artworkPoster: Math.random() > .6 ? 'https://picsum.photos/400/600?grayscale&random=' + Math.floor(Math.random() * 1000) : '',
        likes: Math.floor(Math.random() * 5)
      });
    }, 2500);
  }

  // [02-comment] 퀵픽(이모지/자동문구) 동작
  const selectedEmojis = new Set();

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
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const msg = (fd.get('message') || '').toString().trim();
    if (!msg) return;

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

    try { if (ws?.readyState === 1) ws.send(JSON.stringify(payload)); } catch (_) {}

    closeModal();
    form.reset();
    selectedEmojis.clear();
    form.querySelectorAll('.emoji.is-selected').forEach(btn => btn.classList.remove('is-selected'));
  });


})();


