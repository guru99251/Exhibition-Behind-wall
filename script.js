// ?섏〈 ?쇱씠釉뚮윭由?濡쒕뱶 ?댄썑 ?ㅽ뻾??(defer)
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
// ?? ?ㅽ겕濡??몃━嫄?
gsap.to(".fade-in", {
  opacity: 1,
  y: 0,
  duration: 0.8,
  scrollTrigger: { trigger: ".fade-in", start: "top 85%" }
});





/* ?먮컲 title 濡쒕뵫 ?⑥닔 */
// 湲곕낯 ?좊땲硫붿씠??(濡쒕뵫?붾㈃)
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

// ?좊땲硫붿씠??breath ?좊땲硫붿씠??
const DISC_PULSE_MIN = 0.45;
const DISC_PULSE_MAX = 1.0;
const DISC_PULSE_DUR = 1.05; // ?먮━寃? 2.5~4.0 異붿쿇

let discPulse = gsap.fromTo(
  ".ellipse svg",
  { opacity: DISC_PULSE_MIN },
  {
    opacity: DISC_PULSE_MAX,
    duration: DISC_PULSE_DUR,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    paused: true  // 湲곕낯 ?뺤? ??showDisc/hideDisc?먯꽌 ?쒖뼱
  }
);
// ?먮컲 title 湲곕낯 ?좊땲硫붿씠????


// ?먮컲 title ?쒖떆/?④? ?⑥닔
const discEl = document.querySelector(".ellipse");
const DISC_FADE_IN  = 1.25;
const DISC_FADE_OUT = 0.75;

// ?붿뒪???먮컲) ?쒖떆: ?꾩슂 ????댄? ?띿뒪???좊땲硫붿씠?섎룄 ?④퍡 ?쒖옉
function showDisc({ withTitle = false, text = "" } = {}) {
  if (!discEl) return;

  // ?ㅻ쾭?덉씠 ?쒖떆 + ?쒓컖?곸쑝濡??깆옣
  gsap.set(discEl, { pointerEvents: "auto" }); // ?ㅻ쾭?덉씠濡??대┃ 留됯퀬 ?띕떎硫?auto, ?꾨땲硫?none
  gsap.to(discEl, { duration:DISC_FADE_IN, autoAlpha: 1, ease: "power2.out" });
  
  if (withTitle) {
    // 湲곗〈 title ?좊땲硫붿씠???좏떥???ъ궗?⑺븳?ㅻ㈃:
    if (typeof startEllipseTitle === "function") {
      startEllipseTitle(text || "Loading // Please wait // --");
    } else {
      // ?꾩옱 ?뚯씪? 利됱떆 ?ㅽ뻾(createAnimation ?몄텧) 以묒씠?? 洹?遺遺꾩쓣 二쇱꽍 泥섎━?섍퀬
      // startEllipseTitle/stopEllipseTitle ?섑띁瑜??꾩엯?섏꽭?? (?꾨옒 ?덈궡 李멸퀬)
    }
  }
}

// ?붿뒪???먮컲) ?④?: ?띿뒪???좊땲硫붿씠?섎룄 媛숈씠 ?뺤?
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
// ?먮컲 ??






/* 紐⑥옄?댄겕 諛곌꼍 */
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

// (理쒖쟻??A) ?꾨젅???명똿
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
  // (理쒖쟻??B) ???뚯떛 ?명솚?? ?쇳몴??HSL濡?怨좎젙
  const colors = Array.from({ length: colorsLen }, (_, index) => {
    const hh = Math.floor(rand(h, h + (index + 1) * 10));
    const ll = Math.floor(rand(55, 85));
    return `hsl(${hh}, 100%, ${ll}%)`;
  });
  
  // (理쒖쟻??C) 珥??쎌? ???쒗븳(?숈쟻 gap): N ??(w/g)*(h/g) ??MAX_PIXELS
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
  // (理쒖쟻??D) ?대? ?댁긽??異뺤냼 + 蹂댁젙 ?ㅼ???
  const RENDER_SCALE = (window.devicePixelRatio > 1) ? 0.66 : 0.8; // 怨잻PR?쇱닔濡?????땄
  width  = Math.floor(rect.width);   // ?쇰━(?덉씠?꾩썐) ?ш린
  height = Math.floor(rect.height);
  canvas.width  = Math.floor(width  * RENDER_SCALE);  // ?ㅼ젣 ?뚮뜑 ?ш린
  canvas.height = Math.floor(height * RENDER_SCALE);
  canvas.style.width  = width  + 'px';
  canvas.style.height = height + 'px';
  // ?덉씠?꾩썐 醫뚰몴怨??쎌?) ???대? 醫뚰몴怨?蹂댁젙
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  
  initPixels();
  
  ticker = 0;
  
  animate();
}

if (container) {
  new ResizeObserver(resize).observe(container);
  resize();
}

// (理쒖쟻??E) ??鍮꾧?????猷⑦봽 ?뺤?
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (typeof request !== "undefined") cancelAnimationFrame(request);
  } else {
    // ?ㅼ떆 蹂댁씠硫??꾨젅???ш컻
    resize();
  }
});
// 紐⑥옄?댄겕 諛곌꼍 ??





/* ???숈옉 ?⑥닔 */
// 紐⑥옄?댄겕 ?섏씠?쒖븘??+ 猷⑦봽 ?뺤?
function fadeOutMosaic() {
  gsap.to("#mosaic", { duration: 0.8, autoAlpha: 0, ease: "power2.out" });
  // ?ㅼ쓬 ?꾨젅???덉빟 痍⑥냼濡?猷⑦봽 以묒?
  if (typeof request !== "undefined") cancelAnimationFrame(request);
}

// 硫붾돱 ?쒖떆
function showSelectMenu() {
  gsap.set("#select-menu", { visibility: "visible", pointerEvents: "auto" });
  gsap.to("#select-menu", { duration: 0.8, autoAlpha: 1, ease: "power2.out" });
}

// ?명듃濡??쒗?? ??댄? ?대┃ ???ㅽ뻾
function runIntroSequence() {
  const tl = gsap.timeline();

  // 1) ??댄? ?섏씠?쒖븘??
  tl.to(".title-container", { duration: 0.6, autoAlpha: 0, ease: "power2.out" }, 0);

  // 2) 紐⑥옄?댄겕 ?섏씠?쒖븘??+猷⑦봽?뺤?)
  tl.add(() => fadeOutMosaic(), 0);

  // 3) ?먮컲 ?쒖떆 ???s ?좎? ???먮컲 ?④?
  tl.add(() => { if (typeof discPulse !== "undefined" && discPulse) discPulse.play(); }, "<");
  tl.to(".ellipse", { duration: DISC_FADE_IN, autoAlpha: 1, ease: "power2.out" }, "<");
  tl.to({}, { duration: 2.8 }); // n珥??좎? ?쒓컙 ?ㅼ젙?
  tl.to(".ellipse", {
    duration: DISC_FADE_OUT,
    autoAlpha: 0,
    ease: "power2.in",
    onStart: () => { if (typeof discPulse !== "undefined" && discPulse) discPulse.pause(); }
  });

  // 4) 硫붾돱 ?쒖떆
  tl.add(() => showSelectMenu());
}
// ?명듃濡??쒗????






/* ?ъ슜???낅젰 ?몃━嫄?紐⑥쓬 */
// ??댄? ?대┃ ?몃━嫄?
document.querySelector(".title-container")
  .addEventListener("click", runIntroSequence);

// ?뚯뒪?몄슜 ?ъ슜???낅젰
document.addEventListener('keydown', (ev) => {
  // ?낅젰 ?꾨뱶???ъ빱?ㅻ맂 寃쎌슦 ?⑥텞??臾댁떆
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
// ?ъ슜???낅젰 ?몃━嫄???



// // === Page transition loader (?s disc before navigating) ===
// (function setupPageTransitionLoader() {
//   const DURATION_MS = 2200; // ?섏씠吏 ?대룞 ???붿뒪???깆옣 ?쒓컙 ?ㅼ젙)

//   // ?덉쟾?섍쾶 body ?대┃?먯꽌 <a>留??↔린
//   document.addEventListener('click', (ev) => {
//     const a = ev.target.closest && ev.target.closest('a[href]');
//     if (!a) return;

//     const href = a.getAttribute('href') || '';
//     // ?????덈룄?? ?ㅼ슫濡쒕뱶, ?댁떆 ?대룞, ?몃? 留곹겕 ?깆? ?쒖쇅
//     if (
//       a.target === '_blank' ||
//       a.hasAttribute('download') ||
//       href.startsWith('#') ||
//       /^https?:\/\//i.test(href) && !href.startsWith(location.origin)
//     ) {
//       return; // 湲곕낯 ?숈옉 洹몃?濡?
//     }

//     // ?꾩옱 ?섏씠吏濡쒖쓽 ?대룞? 臾댁떆
//     if (href.replace(/#.*$/, '') === location.pathname.replace(/\/+$/, '')) {
//       return;
//     }

//     ev.preventDefault();

//     // 濡쒕뵫 ?붿뒪???쒖떆 (?꾩슂 ???띿뒪??蹂寃?媛??
//     if (typeof showDisc === 'function') {
//       showDisc({ withTitle: false });
//     }
//     setTimeout(() => {
//       window.location.href = href;
//     }, DURATION_MS);
//   });

//   // ?ъ슜?먭? ?ㅻ줈媛湲??깆쑝濡??뚯븘?붿쓣 ???붿뒪?ш? 蹂댁씠吏 ?딅룄濡?蹂댁젙
//   window.addEventListener('pageshow', (e) => {
//     if (e.persisted && typeof hideDisc === 'function') hideDisc();
//   });
// })();
// // ?섏씠吏 ?꾪솚 濡쒕뜑 ??






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
// 肄붾꼫 二쇱엯 諛??몃쾭 ?좊땲硫붿씠????



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
          const delay = Math.hypot(dx,dy); // 以묒븰?먯꽌 ?쒖옉
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
  CardPixelCanvas.register(); // <pixel-canvas> ?ъ슜 媛??
})();
// pixel-canvas ??
(() => {
  const floorSections = Array.from(document.querySelectorAll('.floor-section'));
  const floorButtons = Array.from(document.querySelectorAll('.floor-selector__button'));
  const cards = Array.from(document.querySelectorAll('.plan-card'));
  if (!floorSections.length || !floorButtons.length || !cards.length) { return; }

  const WALL_ARTWORK_ROLLOUT = {
    'spectral-loop': {
      name: 'Spectral Loop',
      summary: '?ъ슫?쒖? ?됱쓣 ?숆린?뷀븯??紐곗엯???ㅼ튂.',
      floors: [
        { level: '1F 쨌 Reference', note: '二쇳뙆?섎?蹂?而щ윭 ?ㅽ럺?몃읆怨??뚰뼢 ?섑뵆???뺣━.' },
        { level: '2F 쨌 Storyboard', note: '猷⑦봽 ?쒖옉쨌媛먯냽 援ш컙??紐낆떆???쒗??蹂대뱶.' },
        { level: '3F 쨌 Sketches', note: '?뚮룞 ?⑦꽩怨??쇱씠???덉씠?대? ???쒕줈?됱쑝濡??ㅽ뿕.' },
        { level: '4F 쨌 Work Photos', note: '?꾨줈?앺꽣 援먯젙怨??ш렇 癒몄떊 ?명똿 怨쇱젙 湲곕줉.' },
        { level: '5F 쨌 Screenshots', note: '8K 理쒖쥌 ?꾨젅?꾧낵 ?됰낫??LUT 寃곌낵.' },
        { level: '6F 쨌 Light Lab', note: '?덉씠?, ?ㅻえ洹? ?쇱꽌 諛섏쓳 ?뚯뒪??濡쒓렇.' },
        { level: '7F 쨌 Final', note: '愿?뚭컼 ?꾩튂???곕씪 ?뚯쟾?섎뒗 理쒖쥌 鍮??곗텧.' }
      ]
    },
    'memory-patch': {
      name: 'Memory Patch',
      summary: '愿?뚯옄??硫붿떆吏瑜??덉씠?대뱶 UI濡??ш뎄?깊븯???명꽣?숈뀡.',
      floors: [
        { level: '1F 쨌 Reference', note: '媛먯꽦 ?ㅼ썙?쒖? 而щ윭 ?ㅼ?移?由ъ꽌移?' },
        { level: '2F 쨌 Storyboard', note: 'QR ?ㅼ틪遺??媛먯젙 遺꾨쪟源뚯????ъ슜???뚮줈??' },
        { level: '3F 쨌 Sketches', note: '移대뱶 ?뺣젹, 紐⑤떖 ?꾪솚???꾪븳 ??댁뼱 ?ㅼ?移?' },
        { level: '4F 쨌 Work Photos', note: '?꾨줈?좏????λ퉬? ? ?묒뾽 ?λ㈃.' },
        { level: '5F 쨌 Screenshots', note: '?ㅼ젣 ?볤? ?곗씠?곌? ?꾩쟻??UI 罹≪쿂.' },
        { level: '6F 쨌 Light Lab', note: '?쒖뒪泥??몄떇怨?LED 諛섏쓳 ?섑뵆留?' },
        { level: '7F 쨌 Final', note: '?쇱씠釉?肄붾찘???ㅻ쾭?덉씠媛 ?⑹퀜吏?理쒖쥌 踰쎈㈃.' }
      ]
    },
    'tidal-dream': {
      name: 'Tidal Dream',
      summary: '?댁뼇 ?앺깭 ?쒕??덉씠?섏쓣 ?ㅼ떆媛꾩쑝濡??ъ궗?섎뒗 ?묓뭹.',
      floors: [
        { level: '1F 쨌 Reference', note: '?앸Ъ 諛쒓킅怨??뚮룄 ?ъ쭊, ?곗씠???섏쭛.' },
        { level: '2F 쨌 Storyboard', note: '議곗닔 ?먮쫫怨??명꽣?숈뀡 ??대컢 ?ㅽ넗由щ씪??' },
        { level: '3F 쨌 Sketches', note: '?뚰떚???쇱슦?낃낵 鍮?踰덉쭚 ?뺥깭 ?곌뎄.' },
        { level: '4F 쨌 Work Photos', note: '?섎㈃ 諛섏궗 ?뚯뒪?몄? ?뚰떚???붾쾭源??꾩옣.' },
        { level: '5F 쨌 Screenshots', note: 'HDR ?ㅽ떥怨??됱긽 鍮꾧탳 ?꾨젅??' },
        { level: '6F 쨌 Light Lab', note: '?쇱꽌 留듯븨, ?섎룞 ?뚰삎 議곗젅 湲곕줉.' },
        { level: '7F 쨌 Final', note: '愿媛??뚯꽦??諛섏쓳?섎뒗 ?ㅼ뀡 ?쇰궇??' }
      ]
    },
    'orbital-city': {
      name: 'Orbital City',
      summary: '寃뚯엫 ?붿쭊 湲곕컲 ?명꽣?숉떚釉??쒕꽕癒명떛.',
      floors: [
        { level: '1F 쨌 Reference', note: '?꾩떆 援ъ“臾쇨낵 吏덇컧 ?덊띁?곗뒪.' },
        { level: '2F 쨌 Storyboard', note: '?좏깮 遺꾧린? 而룹떊 ?꾪솚 湲고쉷.' },
        { level: '3F 쨌 Sketches', note: '?먭렐怨?移대찓??寃쎈줈 ?ㅼ?移?' },
        { level: '4F 쨌 Work Photos', note: '而⑦듃濡ㅻ윭 泥댄뿕議??뗭뾽 湲곕줉.' },
        { level: '5F 쨌 Screenshots', note: '?쒕꽕癒명떛 而룰낵 UI ?ㅻ쾭?덉씠.' },
        { level: '6F 쨌 Light Lab', note: '而⑦듃濡ㅻ윭 吏꾨룞, ???LED ?곕룞 ?뚯뒪??' },
        { level: '7F 쨌 Final', note: '沅ㅻ룄 蹂?붽? ?ㅼ떆媛꾩쑝濡?諛섏쁺???붾뵫 ?쒗??' }
      ]
    },
    'flora-signal': {
      name: 'Flora Signal',
      summary: '?앸Ъ ?앹껜 ?곗씠?곕? ?쒓컖쨌泥?컖?쇰줈 踰덉뿭???ㅼ튂.',
      floors: [
        { level: '1F 쨌 Reference', note: '?앸Ъ ?꾧린 ?좏샇? ?⑦꽩 ?먮즺.' },
        { level: '2F 쨌 Storyboard', note: '愿?뚯옄 ?명꽣?숈뀡怨??곗씠???먮쫫 ?ㅼ씠?닿렇??' },
        { level: '3F 쨌 Sketches', note: '洹몃옒??紐⑤뱢怨??꾪삎 諛곗튂 ?곌뎄.' },
        { level: '4F 쨌 Work Photos', note: '?쇱꽌 罹섎━釉뚮젅?댁뀡 諛??꾨궇濡쒓렇 ?ㅽ뿕.' },
        { level: '5F 쨌 Screenshots', note: '?곗씠??鍮꾩＜?쇨낵 ?뚰삎 UI 罹≪쿂.' },
        { level: '6F 쨌 Light Lab', note: '?좏샇 蹂댁젙怨??뚰뼢 ?뚯뒪??濡쒓렇.' },
        { level: '7F 쨌 Final', note: '?ㅼ떆媛??좏샇媛 ?ъ궗?섎뒗 理쒖쥌 紐⑥뒿.' }
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
      tooltip.innerHTML = '<div class="plan-tooltip__title">?먮즺 以鍮꾩쨷</div>';
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
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveFloor(entry.target.dataset.floor);
      }
    });
  }, { rootMargin: '-35% 0px -35% 0px', threshold: 0.35 });

  floorSections.forEach((section) => observer.observe(section));
  setActiveFloor('1');
})();

(() => {
  const header = document.querySelector('[data-page-header]');
  if (!header) { return; }

  const headerId = header.getAttribute('data-page-header') || 'primary';
  const toggle = header.querySelector('[data-page-header-toggle]');
  const floating = document.querySelector(`[data-page-header-floating="${headerId}"]`);

  const setCollapsed = (collapsed) => {
    header.classList.toggle('is-collapsed', collapsed);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(!collapsed));
    }
    if (floating) {
      floating.hidden = !collapsed;
      floating.setAttribute('aria-expanded', String(!collapsed));
    }
  };

  setCollapsed(false);

  toggle?.addEventListener('click', () => setCollapsed(true));
  floating?.addEventListener('click', () => {
    setCollapsed(false);
    toggle?.focus();
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
