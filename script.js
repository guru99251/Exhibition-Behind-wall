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

  // ?쒖꽦痢??쒖떆 ?ы띁
  const setActiveFloor = (floorVal) => {
    floorButtons.forEach((button) => {
      const isActive = button.dataset.floor === String(floorVal);
      button.classList.toggle('is-active', isActive);
      if (isActive) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  };

  // ??踰덉뿉 ?섎굹??痢듬쭔 蹂댁씠?꾨줉 ?쒖뼱
  let index = 0;
  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
  const showByIndex = (i) => {
    index = clamp(i, 0, floorSections.length - 1);
    floorSections.forEach((sec, idx) => {
      sec.classList.toggle('is-active', idx === index);
    });
    setActiveFloor(floorSections[index].dataset.floor);
  };

  // 珥덇린 1F
  showByIndex(0);

  // 1) 痢?踰꾪듉: 利됱떆 ?꾪솚 (?ㅽ겕濡??쒓굅)
  floorButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(button.dataset.target);
      const i = floorSections.indexOf(target);
      if (i >= 0) showByIndex(i);
    });
  });

  // 2) ???곗튂: ?붾㈃ ?대룞 ?놁씠 利됱떆 ?ㅼ쓬/?댁쟾痢?
  let lock = false;
  const step = (delta) => {
    if (lock) return;
    lock = true;
    showByIndex(index + (delta > 0 ? 1 : -1));
    setTimeout(() => { lock = false; }, 220); // ?붾컮?댁뒪
  };

  scroller.addEventListener('wheel', (ev) => {
    ev.preventDefault();                 // ?ㅽ겕濡??먯껜 ?쒓굅
    if (Math.abs(ev.deltaY) < 8) return; // 誘몄꽭 ?쒖뒪泥?臾댁떆
    step(ev.deltaY);
  }, { passive: false });

  // ?곗튂 ???
  let startY = 0;
  scroller.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
  scroller.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const dy = startY - e.touches[0].clientY;
    if (Math.abs(dy) > 24) { step(dy); startY = e.touches[0].clientY; }
  }, { passive: false });

  // ?ㅻ낫?????? PageUp/Down)???섏씠吏 諛⑹떇?쇰줈
  scroller.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); step(1); }
    if (k === 'ArrowUp'   || k === 'PageUp')   { e.preventDefault(); step(-1); }
  });

  // ?대뼡 ?댁쑀濡??ㅽ겕濡ㅼ씠 諛쒖깮?대룄 利됱떆 ?먯쐞移?
  scroller.addEventListener('scroll', () => { scroller.scrollTop = 0; });
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
})();

/* === Comment page utilities === */
const COMMENT_STATE = {
  root: null,
  streams: {},
  store: { A: [], B: [], C: [], ALL: [] },
  connection: null
};

const SAMPLE_COMMENTS = [
  {
    id: 'c-001',
    zones: ['A'],
    text: 'Spectral Loop is brighter than earlier rehearsal. The afterglow wraps the ceiling perfectly.',
    author: { name: 'Eunseo Kim', department: 'Spatial Media', studentId: '20231204' },
    timestamp: '2024-05-12T11:42:00+09:00',
    reactions: { emojis: { Light: 3, Spark: 1 }, likes: 7 },
    artwork: { title: 'Spectral Loop', poster: 'https://picsum.photos/seed/spectral-loop/600/800' }
  },
  {
    id: 'c-002',
    zones: ['B'],
    text: 'Kids keep reaching for the holographic coral. Interactive depth feels stable tonight.',
    author: { name: 'Anonymous', department: 'Visitor', studentId: '' },
    timestamp: '2024-05-12T11:45:12+09:00',
    reactions: { emojis: { Wave: 4, Wonder: 2 }, likes: 5 },
    artwork: { title: 'Tidal Dream', poster: 'https://picsum.photos/seed/tidal-dream/600/800' }
  },
  {
    id: 'c-003',
    zones: ['C'],
    text: 'Backstage projection syncs with the live feed. Lag is gone after the afternoon patch.',
    author: { name: 'Byungwoo Han', department: 'Systems', studentId: 'STF-14' },
    timestamp: '2024-05-12T11:48:30+09:00',
    reactions: { emojis: { Gear: 2 }, likes: 3 }
  },
  {
    id: 'c-004',
    zones: ['ALL'],
    text: 'Standing ovation when the skyline flips to night cycle. Audio swell gave goosebumps.',
    author: { name: 'Seoyeon Park', department: 'Guest', studentId: '202405' },
    timestamp: '2024-05-12T11:51:02+09:00',
    reactions: { emojis: { Clap: 9, Sky: 3 }, likes: 11 }
  },
  {
    id: 'c-005',
    zones: ['A', 'B'],
    text: 'Please bump narration level 2dB around the walkway; words disappear behind the jet fan.',
    author: { name: 'Engineering Team', department: 'Audio', studentId: 'OPS-08' },
    timestamp: '2024-05-12T11:53:40+09:00',
    reactions: { emojis: { Audio: 2 }, likes: 0 }
  }
];

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
      Planning: [
        { name: 'Heewon Jung', role: 'Planning Lead' },
        { name: 'Mina Rho', role: 'Programmer' },
        { name: 'Seojin Park', role: 'Archivist' },
        { name: 'Yeji Jeon', role: 'Copywriter' },
        { name: 'Joonseo Lee', role: 'Logistics' }
      ],
      Design: [
        { name: 'Hyejin Kang', role: 'Design Director' },
        { name: 'Yerin Koo', role: 'Visual Designer' },
        { name: 'Taeyang Kim', role: 'Motion Designer' }
      ],
      Operations: [
        { name: 'Suhyun Bae', role: 'Show Caller' },
        { name: 'Minsu Chae', role: 'Technical Operator' },
        { name: 'Yunseo Lee', role: 'Stage Manager' }
      ],
      Chair: [
        { name: 'Prof. Myungho Park', role: 'Dept. Chair' }
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

function renderParticipants(groups, container = CONTRIBUTORS_STATE.root) {
  if (!container) { return; }
  const grid = container.querySelector('[data-participants-grid]');
  if (!grid) { return; }
  grid.innerHTML = '';
  Object.entries(groups).forEach(([discipline, people]) => {
    const column = document.createElement('div');
    column.className = 'contributors-column';
    column.dataset.discipline = discipline;
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

const DEFAULT_LQIP = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http://www.w3.org/2000/svg%22 viewBox%3D%220 0 3 4%22%3E%3Crect width%3D%223%22 height%3D%224%22 fill%3D%22%23091420%22/%3E%3C/svg%3E';

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










