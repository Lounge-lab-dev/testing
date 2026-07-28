const menuButton = document.getElementById('menuBtn');
const navMenu = document.getElementById('navMenu');
const navMenuBg = navMenu?.querySelector('.nav-menu-bg');
const navMenuLinks = navMenu ? [...navMenu.querySelectorAll('.nav-menu-link')] : [];
const navMenuFooter = navMenu?.querySelector('.nav-menu-footer');


let menuOpen = false;
let menuTween = null;

if (menuButton && navMenu) {
  menuButton.addEventListener('click', toggleMenu);
  navMenuLinks.forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}

function toggleMenu() { menuOpen ? closeMenu() : openMenu(); }

function openMenu() {
  if (!navMenu || menuOpen) return;
  menuOpen = true;
  stopTimer();
  menuTween?.kill();

  navMenu.classList.add('is-open');
  navMenu.setAttribute('aria-hidden', 'false');
  menuButton.classList.add('is-open');
  menuButton.setAttribute('aria-expanded', 'true');

  gsap.set(navMenuLinks, { opacity: 0, y: 70, rotateX: -15 });
  gsap.set(navMenuFooter, { opacity: 0, y: 20 });

  menuTween = gsap.timeline({ defaults: { ease: 'expo.out' } });
  menuTween.to(navMenuBg, { yPercent: 100, duration: 0.85 }, 0);
  menuTween.to(navMenuLinks, { opacity: 1, y: 0, rotateX: 0, duration: 1, stagger: 0.075 }, 0.22);
  menuTween.to(navMenuFooter, { opacity: 1, y: 0, duration: 0.75 }, 0.55);
}

function closeMenu() {
  if (!navMenu || !menuOpen) return;
  menuOpen = false;
  menuTween?.kill();

  menuButton.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');

  menuTween = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    onComplete: () => {
      navMenu.classList.remove('is-open');
      navMenu.setAttribute('aria-hidden', 'true');
      gsap.set(navMenuBg, { yPercent: -100 });
      gsap.set(navMenuLinks, { opacity: 0, y: 70, rotateX: -15 });
      gsap.set(navMenuFooter, { opacity: 0, y: 20 });
      startTimer();
    }
  });

  menuTween.to(navMenuLinks, { opacity: 0, y: -35, rotateX: 15, duration: 0.35, stagger: 0.035 }, 0);
  menuTween.to(navMenuFooter, { opacity: 0, y: -12, duration: 0.3 }, 0);
  menuTween.to(navMenuBg, { yPercent: -100, duration: 0.65 }, 0.12);
}

/* ── SLIDE CAROUSEL ── */
const SLIDE_DURATION = 4000;
const SWIPE_DURATION = 0.50;
const DRAG_TRIGGER = 90;

const slides = [...document.querySelectorAll('.slide')];
const tabs = [...document.querySelectorAll('.slide-tab')];
const heroStage = document.getElementById('heroStage');
const heroStageMetaRight = document.getElementById('heroStageMetaRight');
const heroStageMetaRightInner = document.getElementById('heroStageMetaRightInner');

let current = 0;
let timer = null;
let animating = false;
let dragging = false;
let dragPointerId = null;
let dragStartX = 0;
let dragX = 0;
let dragDirection = 1;
let dragTargetIndex = null;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.documentElement.style.setProperty('--slide-duration', `${SLIDE_DURATION}ms`);

window.addEventListener('load', () => {
  setupCarousel();
  applySlideTheme(current);
  prepareIntroText();
  setupLogoLetters();
  initLogoHover();

  if (reduceMotion) {
    finishIntroFast();
    startTimer();
    return;
  }

  runAwwwardsIntro();
});

/* ── SETUP CAROUSEL ── */
function setupCarousel() {
  slides.forEach((slide, i) => {
    gsap.killTweensOf(slide);
    gsap.set(slide, {
      opacity: i === current ? 1 : 0, x: 0, scale: 1,
      zIndex: i === current ? 2 : 1,
      clipPath: 'inset(0% 0% 0% 0%)'
    });
    slide.classList.toggle('active', i === current);
    const bg = slide.querySelector('.slide-bg');
    if (bg) gsap.set(bg, { xPercent: 0, scale: 1 });
  });
  tabs.forEach((t, i) => t.classList.toggle('active', i === current));
  if (heroStageMetaRightInner) {
    const label = slides[current]?.dataset.meta;
    if (label) updateMeta(current, true);
  }
}

function setupLogoLetters() {
  var wordmark = document.getElementById("logoWordmark");
  if (!wordmark || wordmark.dataset.split === "true") return;

  var text = wordmark.textContent;
  wordmark.textContent = '';
  wordmark.dataset.split = "true";

  // Split text into individual letters and build the top/bottom hover structure
  // (mirrors what GSAP SplitText would do, but no external dependency needed)
  for (var i = 0; i < text.length; i++) {
    var letter = text[i] === ' ' ? '\u00A0' : text[i];

    var wrapper = document.createElement('span');
    wrapper.className = 'logo-letter';
    wrapper.dataset.i = i;

    var top = document.createElement('span');
    top.className = 'logo-letter-top';
    top.textContent = letter;

    var bottom = document.createElement('span');
    bottom.className = 'logo-letter-bottom';
    bottom.textContent = letter;

    wrapper.appendChild(top);
    wrapper.appendChild(bottom);
    wordmark.appendChild(wrapper);
  }
}

function prepareIntroText() {
  splitText('#brandName', 'char');
  splitText('.tagline-line', 'word');
}

function splitText(selector, mode = 'char') {
  document.querySelectorAll(selector).forEach(el => {
    if (el.dataset.split === 'true') return;
    const orig = el.textContent;
    el.dataset.split = 'true';

    if (mode === 'word') {
      // Walk child nodes to preserve existing element classes (e.g. .accent)
      const children = Array.from(el.childNodes);
      el.textContent = '';

      children.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const words = child.textContent.trim().split(/\s+/);
          if (!words[0] || !words[0].length) return;
          words.forEach((word, i, arr) => {
            const wrap = document.createElement('span');
            wrap.style.display = 'inline-block';
            wrap.style.overflow = 'hidden';
            const inner = document.createElement('span');
            inner.className = 'js-word-inner';
            inner.textContent = word;
            inner.style.display = 'inline-block';
            wrap.appendChild(inner);
            el.appendChild(wrap);
            if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
          });
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          // Preserve existing element with its class(es)
          const wrap = document.createElement('span');
          wrap.style.display = 'inline-block';
          wrap.style.overflow = 'hidden';
          const inner = document.createElement('span');
          inner.className = (child.className || '') + ' js-word-inner';
          inner.textContent = child.textContent;
          inner.style.display = 'inline-block';
          wrap.appendChild(inner);
          el.appendChild(wrap);
        }
      });
      return;
    }

    el.textContent = '';
    [...orig].forEach(ch => {
      const span = document.createElement('span');
      span.className = 'js-char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.display = 'inline-block';
      el.appendChild(span);
    });
  });
}
/* ── SLIDE THEME (light/dark bg adaptation) ── */
function applySlideTheme(index) {
  const slide = slides[index];
  if (!slide) return;
  const theme = slide.dataset.theme || 'dark';
  const isLight = theme === 'light';
  heroStage?.classList.toggle('is-light', isLight);
  heroStage?.classList.toggle('is-dark', !isLight);
  document.body.classList.toggle('is-light', isLight);
  document.body.classList.toggle('is-dark', !isLight);
}

/* ── INTRO ANIMATION ── */
function runAwwwardsIntro() {
  const overlay = document.getElementById('pageOverlay');
  const tl = gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete: () => { restartProgress(current); startTimer(); }
  });

  gsap.set(['#navbar', '.slide-indicators', '.hero-stage-meta'], { opacity: 0, y: 18 });
  gsap.set('.js-char', { yPercent: 115, rotate: 3, opacity: 0 });
  gsap.set('.js-word-inner', { yPercent: 115, opacity: 0 });
  if (overlay) {
    tl.to(overlay, { opacity: 0, duration: 1, delay: 0.15, ease: 'power3.out', onComplete: () => { overlay.style.display = 'none'; } }, 0);
  }
  tl.to('#navbar', { opacity: 1, y: 0, duration: 0.8 }, 0.35);
  tl.to('.js-char', { yPercent: 0, rotate: 0, opacity: 1, duration: 1.15, stagger: { each: 0.012, from: 'start' }, ease: 'expo.out' }, 0.55);
  tl.to('.js-word-inner', { yPercent: 0, opacity: 1, duration: 1, stagger: 0.075, ease: 'expo.out' }, 0.8);
  tl.to(['.slide-indicators', '.hero-stage-meta'], { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 1.05);

  // Continuous brand float
  gsap.to('.brand-name', { y: -6, duration: 2.5, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2.5 });
}

function finishIntroFast() {
  const overlay = document.getElementById('pageOverlay');
  if (overlay) overlay.style.display = 'none';
  gsap.set(['#navbar', '.slide-indicators', '.hero-stage-meta'], { opacity: 1, y: 0 });
  gsap.set(['.js-char', '.js-word-inner'], { yPercent: 0, opacity: 1, rotate: 0 });
  gsap.to('.brand-name', { y: -6, duration: 2.5, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 0.5 });
  restartProgress(current);
}

/* ── TIMER ── */
function startTimer() { stopTimer(); if (slides.length < 2 || animating || dragging) return; timer = setTimeout(() => goTo(current + 1, 1), SLIDE_DURATION); }
function stopTimer() { if (timer !== null) { clearTimeout(timer); timer = null; } }

/* ── SLIDE NAVIGATION ── */
function goTo(index, direction) {
  if (animating || dragging || slides.length < 2) return;
  const ni = wrap(index);
  if (ni === current) return;
  animating = true;
  stopTimer();
  const old = slides[current], next = slides[ni];
  prepareSlide(next);
  restartProgress(ni);
  applySlideTheme(ni);
  gsap.set(next, { clipPath: getClip(direction, 0) });
  gsap.to(next, {
    clipPath: getClip(direction, 1),
    duration: SWIPE_DURATION,
    ease: 'power4.inOut',
    onComplete: () => completeSwipe(old, next, ni)
  });
}

function prepareSlide(slide) {
  slide.classList.add('active');
  gsap.killTweensOf(slide);
  gsap.set(slide, { opacity: 1, x: 0, scale: 1, zIndex: 3 });
  const bg = slide.querySelector('.slide-bg');
  if (bg) gsap.set(bg, { xPercent: 0, scale: 1 });
}

function completeSwipe(oldS, newS, ni) {
  oldS.classList.remove('active');
  gsap.set(oldS, { opacity: 0, x: 0, zIndex: 1, clipPath: 'inset(0% 0% 0% 0%)' });
  const obg = oldS.querySelector('.slide-bg');
  if (obg) gsap.set(obg, { xPercent: 0, scale: 1 });
  gsap.set(newS, { opacity: 1, x: 0, scale: 1, zIndex: 2, clipPath: 'inset(0% 0% 0% 0%)' });
  const nbg = newS.querySelector('.slide-bg');
  if (nbg) gsap.set(nbg, { scale: 1 });
  current = ni;
  animating = false;
  dragTargetIndex = null;
  applySlideTheme(current);
  updateMeta(current);
  startTimer();
}

function updateMeta(index, skipAnim) {
  if (!heroStageMetaRightInner) return;
  const label = slides[index]?.dataset.meta;
  if (!label) return;

  // Build character spans helper
  function buildChars() {
    var chars = label.split('').map(function(ch) {
      var span = document.createElement('span');
      span.className = 'meta-char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      return span;
    });
    var arrowHTML = '<span class="hero-stage-meta-arrow-wrap" aria-hidden="true">' +
      '<span class="hero-stage-meta-arrow"></span>' +
      '<span class="hero-stage-meta-arrow hero-stage-meta-arrow-dup"></span>' +
      '</span>';
    // Wrap chars in a container so the parent's gap:6px doesn't space out each letter
    var wrap = document.createElement('span');
    wrap.className = 'meta-chars-wrap';
    chars.forEach(function(c) { wrap.appendChild(c); });
    heroStageMetaRightInner.innerHTML = '';
    heroStageMetaRightInner.appendChild(wrap);
    heroStageMetaRightInner.insertAdjacentHTML('beforeend', arrowHTML);
    return chars;
  }

  // If skipAnim, just build chars immediately (used on initial load)
  if (skipAnim) {
    buildChars();
    gsap.set(heroStageMetaRightInner.querySelectorAll('.meta-char'), {
      yPercent: 0, opacity: 1, rotate: 0
    });
    return;
  }

  gsap.killTweensOf(heroStageMetaRightInner);

  var oldChars = heroStageMetaRightInner.querySelectorAll('.meta-char');
  var newChars = null;

  var tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });

  // Animate out old chars with stagger
  if (oldChars.length) {
    tl.to(oldChars, {
      yPercent: -60,
      opacity: 0,
      rotateX: -10,
      duration: 0.28,
      stagger: 0.015
    }, 0);
  }

  // Rebuild content with individual character spans
  tl.call(function() {
    newChars = buildChars();
    gsap.set(newChars, { yPercent: 115, opacity: 0, rotate: 3 });
  });

  // Stagger in new chars
  tl.add(function() {
    gsap.to(newChars, {
      yPercent: 0,
      opacity: 1,
      rotate: 0,
      duration: 0.55,
      stagger: { each: 0.012, from: 'start' },
      ease: 'expo.out'
    });
  });
}

function restartProgress(index) {
  tabs.forEach(t => t.classList.remove('active'));
  const tab = tabs[index];
  if (!tab) return;
  void tab.offsetWidth;
  tab.classList.add('active');
}

function wrap(i) { return (i + slides.length) % slides.length; }
function getClip(dir, p) {
  const h = 100 - p * 100;
  return dir === 1 ? `inset(0% 0% 0% ${h}%)` : `inset(0% ${h}% 0% 0%)`;
}

/* ── TAB CLICK ── */
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const i = Number(tab.dataset.idx);
    goTo(i, i > current ? 1 : -1);
  });
});

/* ── DRAG ── */
if (heroStage) {
  heroStage.addEventListener('pointerdown', startDrag);
  heroStage.addEventListener('pointermove', moveDrag);
  heroStage.addEventListener('pointerup', endDrag);
  heroStage.addEventListener('pointercancel', cancelDrag);
}

function startDrag(e) {
  if (animating || slides.length < 2) return;
  dragging = true;
  dragPointerId = e.pointerId;
  dragStartX = e.clientX;
  dragX = e.clientX;
  dragDirection = 1;
  dragTargetIndex = null;
  stopTimer();
  heroStage.classList.add('is-dragging');
  if (heroStage.setPointerCapture) heroStage.setPointerCapture(e.pointerId);
}

function moveDrag(e) {
  if (!dragging || e.pointerId !== dragPointerId) return;
  dragX = e.clientX;
  const diff = dragX - dragStartX;
  if (Math.abs(diff) < 6) return;
  dragDirection = diff < 0 ? 1 : -1;
  const ni = wrap(current + dragDirection);
  if (dragTargetIndex !== null && dragTargetIndex !== ni) resetSlide(slides[dragTargetIndex]);
  dragTargetIndex = ni;
  const old = slides[current], next = slides[dragTargetIndex];
  prepareSlide(next);
  gsap.set(old, { opacity: 1, zIndex: 2, clipPath: 'inset(0% 0% 0% 0%)' });
  const w = heroStage.offsetWidth || window.innerWidth;
  const p = Math.min(Math.abs(diff) / w, 1);
  gsap.set(next, { clipPath: getClip(dragDirection, p) });
}

function endDrag(e) {
  if (!dragging || e.pointerId !== dragPointerId) return;
  const diff = dragX - dragStartX;
  const swipe = Math.abs(diff) >= DRAG_TRIGGER;
  dragging = false;
  dragPointerId = null;
  heroStage.classList.remove('is-dragging');
  if (heroStage.releasePointerCapture) { try { heroStage.releasePointerCapture(e.pointerId); } catch {} }
  if (swipe && dragTargetIndex !== null) finishDragSwipe(dragTargetIndex, dragDirection);
  else cancelDrag();
}

function finishDragSwipe(ti, dir) {
  animating = true;
  const old = slides[current], next = slides[ti];
  restartProgress(ti);
  applySlideTheme(ti);
  gsap.to(next, {
    clipPath: getClip(dir, 1),
    duration: 0.55,
    ease: 'power4.out',
    onComplete: () => completeSwipe(old, next, ti)
  });
}

function cancelDrag() {
  const next = dragTargetIndex !== null ? slides[dragTargetIndex] : null;
  dragging = false;
  dragPointerId = null;
  if (heroStage) heroStage.classList.remove('is-dragging');
  if (!next || next === slides[current]) { startTimer(); return; }
  gsap.to(next, {
    clipPath: getClip(dragDirection, 0),
    duration: 0.35,
    ease: 'power3.out',
    onComplete: () => { resetSlide(next); dragTargetIndex = null; startTimer(); }
  });
}

function resetSlide(slide) {
  if (!slide || slide === slides[current]) return;
  slide.classList.remove('active');
  gsap.killTweensOf(slide);
  gsap.set(slide, { opacity: 0, x: 0, scale: 1, zIndex: 1, clipPath: 'inset(0% 0% 0% 0%)' });
  const bg = slide.querySelector('.slide-bg');
  if (bg) gsap.set(bg, { xPercent: 0, scale: 1 });
}

/* ── LOGO LETTER STAGGER HOVER ── */
function initLogoHover() {
  const tops = gsap.utils.toArray('.logo-letter-top');
  const bottoms = gsap.utils.toArray('.logo-letter-bottom');
  const logo = document.getElementById('logoWordmark');
  if (!logo || tops.length === 0) return;

  let hoverTween = null;

  logo.addEventListener('mouseenter', () => {
    hoverTween?.kill();
    hoverTween = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.5, stagger: 0.06 } });
    hoverTween.to(tops, { y: '-100%' }, 0);
    hoverTween.to(bottoms, { y: '0%' }, 0);
  });

  logo.addEventListener('mouseleave', () => {
    hoverTween?.kill();
    hoverTween = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.4, stagger: 0.04 } });
    hoverTween.to(bottoms, { y: '100%' }, 0);
    hoverTween.to(tops, { y: '0%' }, 0);
  });
}
