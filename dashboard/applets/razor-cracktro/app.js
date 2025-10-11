const marqueeText = document.getElementById('marqueeText');
const starfield = document.querySelector('.cracktro__starfield');
const banners = Array.from(document.querySelectorAll('.cracktro__banner'));
const loadingBar = document.getElementById('loadingBar');
const loadingPercentage = document.getElementById('loadingPercentage');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const STAR_COUNT = prefersReducedMotion ? 20 : 80;
const LOADING_DURATION = prefersReducedMotion ? 2500 : 6500;
let ambientTimer = null;
let stars = [];

function extendMarquee() {
  if (!marqueeText) return;
  const content = marqueeText.textContent.trim();
  marqueeText.textContent = `${content} ${content}`;
}

function createStarfield() {
  if (!starfield) return;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < STAR_COUNT; i += 1) {
    const star = document.createElement('span');
    star.className = 'star';
    const size = (Math.random() * 2.5 + 1).toFixed(2);
    star.style.setProperty('--size', `${size}px`);
    star.style.setProperty('--delay', `${Math.random() * 6}s`);
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    fragment.appendChild(star);
    stars.push(star);
  }
  starfield.appendChild(fragment);
}

function revealBanners() {
  banners.forEach((banner) => {
    const delay = Number(banner.dataset.delay) || 0;
    setTimeout(() => {
      banner.classList.add('is-visible');
    }, delay);
  });
}

function animateLoadingBar() {
  if (!loadingBar) return;
  let startTime = null;

  function step(timestamp) {
    if (startTime === null) {
      startTime = timestamp;
    }
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / LOADING_DURATION, 1);
    const percent = Math.floor(progress * 100);
    loadingBar.style.width = `${percent}%`;
    if (loadingPercentage) {
      loadingPercentage.textContent = `${percent}%`;
    }

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      loadingBar.style.width = '100%';
      loadingBar.classList.add('is-complete');
      if (loadingPercentage) {
        loadingPercentage.textContent = '100%';
      }
      startAmbientLoop();
    }
  }

  requestAnimationFrame(step);
}

function startAmbientLoop() {
  if (ambientTimer || stars.length === 0) return;
  ambientTimer = setInterval(() => {
    const star = stars[Math.floor(Math.random() * stars.length)];
    if (!star) {
      return;
    }
    star.classList.add('twinkle');
    setTimeout(() => star.classList.remove('twinkle'), 700);
  }, prefersReducedMotion ? 1200 : 450);
}

function init() {
  extendMarquee();
  createStarfield();
  revealBanners();
  animateLoadingBar();
}

document.addEventListener('DOMContentLoaded', init);
