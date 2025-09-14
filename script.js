// 의존 라이브러리 로드 이후 실행됨 (defer)
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
// 예: 스크롤 트리거
gsap.to(".fade-in", {
  opacity: 1,
  y: 0,
  duration: 0.8,
  scrollTrigger: { trigger: ".fade-in", start: "top 85%" }
});





/* 원반 title 로딩 함수 */
// 기본 애니메이션 (로딩화면)
const createAnimation = ({
  duration = 21,
  reversed = false,
  target,
  text,
  textProperties = undefined
}) => {
  const pathId = `path-${gsap.utils.random(100000, 999999, 1)}`;
  const props = { duration, ease: "none", repeat: -1 };

  gsap.set(target.querySelector("path"), {
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

// 애니메이션 breath 애니메이션
const DISC_PULSE_MIN = 0.45;
const DISC_PULSE_MAX = 1.0;
const DISC_PULSE_DUR = 1.05; // 느리게: 2.5~4.0 추천

let discPulse = gsap.fromTo(
  ".ellipse svg",
  { opacity: DISC_PULSE_MIN },
  {
    opacity: DISC_PULSE_MAX,
    duration: DISC_PULSE_DUR,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    paused: false // 기본은 정지, 필요 시 showDisc에서 켬
  }
);
// 원반 title 기본 애니메이션 끝


// 원반 title 표시/숨김 함수
const discEl = document.querySelector(".ellipse");
const DISC_FADE_IN  = 1.25;
const DISC_FADE_OUT = 0.75;

// 디스크(원반) 표시: 필요 시 타이틀 텍스트 애니메이션도 함께 시작
function showDisc({ withTitle = false, text = "" } = {}) {
  if (!discEl) return;

  // 오버레이 표시 + 시각적으로 등장
  gsap.set(discEl, { pointerEvents: "auto" }); // 오버레이로 클릭 막고 싶다면 auto, 아니면 none
  gsap.to(discEl, { duration:DISC_FADE_IN, autoAlpha: 1, ease: "power2.out" });
  
  if (withTitle) {
    // 기존 title 애니메이션 유틸을 재사용한다면:
    if (typeof startEllipseTitle === "function") {
      startEllipseTitle(text || "Loading // Please wait // --");
    } else {
      // 현재 파일은 즉시 실행(createAnimation 호출) 중이니, 그 부분을 주석 처리하고
      // startEllipseTitle/stopEllipseTitle 래퍼를 도입하세요. (아래 안내 참고)
    }
  }
}

// 디스크(원반) 숨김: 텍스트 애니메이션도 같이 정지
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
// 원반 끝






/* 모자이크 배경 */
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
  const colors = Array.from({ length: colorsLen }, (_, index) => `hsl(${Math.floor(rand(h, h + (index + 1) * 10))} 100% ${rand(50, 100)}%)`);
  
  const gap = 6; // Math.floor(width * 0.025)
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
 
  width = Math.floor(rect.width);
  height = Math.floor(rect.height);
  
  canvas.width = width;
  canvas.height = height;
  
  initPixels();
  
  ticker = 0;
  
  animate();
}

if (container) {
  new ResizeObserver(resize).observe(container);
  resize();
}
// 모자이크 배경 끝





/* 웹 동작 함수 */
// 모자이크 페이드아웃 + 루프 정지
function fadeOutMosaic() {
  gsap.to("#mosaic", { duration: 0.8, autoAlpha: 0, ease: "power2.out" });
  // 다음 프레임 예약 취소로 루프 중지
  if (typeof request !== "undefined") cancelAnimationFrame(request);
}

// 메뉴 표시
function showSelectMenu() {
  gsap.set("#select-menu", { visibility: "visible", pointerEvents: "auto" });
  gsap.to("#select-menu", { duration: 0.8, autoAlpha: 1, ease: "power2.out" });
}

// 인트로 시퀀스: 타이틀 클릭 시 실행
function runIntroSequence() {
  const tl = gsap.timeline();

  // 1) 타이틀 페이드아웃
  tl.to(".title-container", { duration: 0.6, autoAlpha: 0, ease: "power2.out" }, 0);

  // 2) 모자이크 페이드아웃(+루프정지)
  tl.add(() => fadeOutMosaic(), 0);

  // 3) 원반 표시 → 3s 유지 → 원반 숨김
  tl.add(() => { if (typeof discPulse !== "undefined" && discPulse) discPulse.play(); }, "<");
  tl.to(".ellipse", { duration: DISC_FADE_IN, autoAlpha: 1, ease: "power2.out" }, "<");
  tl.to({}, { duration: 3 }); // 3초 유지
  tl.to(".ellipse", {
    duration: DISC_FADE_OUT,
    autoAlpha: 0,
    ease: "power2.in",
    onStart: () => { if (typeof discPulse !== "undefined" && discPulse) discPulse.pause(); }
  });

  // 4) 메뉴 표시
  tl.add(() => showSelectMenu());
}

// 타이틀 클릭 트리거
document.querySelector(".title-container")
  .addEventListener("click", runIntroSequence);





// 테스트용 사용자 입력
document.addEventListener('keydown', (ev) => {
  // 입력 필드에 포커스된 경우 단축키 무시
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



// === Inject corners into each .menu-item and animate on hover ===
(() => {
  // 동일한 아이콘 path를 사용 (md의 corner SVG path)
  const cornerSVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 4V12H4V14H14V4H12Z"></path>
    </svg>`;

  const items = document.querySelectorAll('.menu-item');
  items.forEach((item) => {
    // 코너가 없으면 4개 생성
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

    // hover 시 나타나기 (stagger로 순차)
    const showCorners = () => gsap.to(corners, { opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' });
    const hideCorners = () => gsap.to(corners, { opacity: 0, duration: 0.3, stagger: 0.05, ease: 'power2.in' });

    item.addEventListener('mouseenter', showCorners);
    item.addEventListener('mouseleave', hideCorners);
    // 키보드 접근성(탭 포커스)도 동일 처리
    item.addEventListener('focus', showCorners);
    item.addEventListener('blur', hideCorners);
  });
})();

 