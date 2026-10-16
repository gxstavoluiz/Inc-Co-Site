const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function initMotion() {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 901px) and (min-height: 680px)');
  const toggle = document.querySelector('.motion-toggle');
  let paused = false;
  try { paused = localStorage.getItem('inc-motion-paused') === 'true'; } catch { /* Storage is optional. */ }
  let enabled = !preference.matches && !paused;
  const animations = new Set();
  const section = document.querySelector('#projetos');
  const pin = section.querySelector('.projects-pin');
  const viewport = section.querySelector('.project-viewport');
  const track = section.querySelector('.project-grid');
  const counter = section.querySelector('.project-counter');
  const previous = section.querySelector('.project-prev');
  const next = section.querySelector('.project-next');
  const hint = section.querySelector('#project-scroll-hint');
  let visibleCards = [];
  let travel = 0;
  let sectionTop = 0;
  let pinned = false;
  let progress = 0;
  let activeIndex = 0;
  let measureFrame = 0;
  let scrollFrame = 0;
  let filterChanged = false;
  const heroStage = document.querySelector('.hero-stage');
  const heroSurface = heroStage.querySelector('.hero-surface');
  let heroTop = 0;
  let heroTravel = 1;
  let heroPinned = false;
  let lastHeroProgress = -1;

  function updateHero() {
    const progress = enabled ? clamp((window.scrollY - heroTop) / heroTravel) : 0;
    if (progress === lastHeroProgress) return;
    lastHeroProgress = progress;
    // Scroll-linked and reversible: the entire opening panel recedes together.
    const eased = progress * progress * (3 - 2 * progress);
    heroSurface.style.setProperty('--hero-scale', String(1 - eased * (heroPinned ? .18 : .06)));
    heroSurface.style.setProperty('--hero-radius', `${eased * (heroPinned ? 36 : 20)}px`);
    heroSurface.style.setProperty('--hero-edge', String(eased));
  }

  function measureHero() {
    // Measure the untransformed stage, never the shrinking surface's bounds.
    heroTop = heroStage.getBoundingClientRect().top + window.scrollY;
    const height = heroSurface.offsetHeight;
    heroPinned = enabled && desktop.matches && height <= window.innerHeight;
    heroTravel = heroPinned ? clamp(window.innerHeight * .65, 320, 640) : height * .75;
    heroStage.classList.toggle('is-pinned', heroPinned);
    heroStage.style.setProperty('--hero-height', `${height + heroTravel}px`);
    lastHeroProgress = -1;
    updateHero();
  }

  function playEntrance(element, delay = 0) {
    if (!enabled || typeof element.animate !== 'function') return;
    const animation = element.animate([
      { opacity: 0, transform: 'translateY(32px) scale(.94)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ], { duration: 850, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    animations.add(animation);
    const done = () => animations.delete(animation);
    animation.onfinish = done;
    animation.oncancel = done;
  }

  // Elements are never hidden by default: JS failures cannot hide the content.
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      playEntrance(entry.target);
      reveal.unobserve(entry.target);
    }
  }, { threshold: .12 });
  document.querySelectorAll('.about h2, .about .lead, .principles > div, .services .section-heading, .service-list, .contact h2, .contact form').forEach(element => reveal.observe(element));

  function updateGallery() {
    progress = travel > 0 ? clamp(pinned ? (window.scrollY - sectionTop) / travel : viewport.scrollLeft / travel) : 0;
    if (pinned) track.style.transform = `translate3d(${-progress * travel}px, 0, 0)`;
    const position = progress * travel;
    activeIndex = visibleCards.reduce((best, card, index) => {
      const target = Math.min(card.offsetLeft, travel);
      const bestTarget = Math.min(visibleCards[best].offsetLeft, travel);
      return Math.abs(target - position) < Math.abs(bestTarget - position) ? index : best;
    }, 0);
    const count = visibleCards.length;
    counter.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
    counter.setAttribute('aria-label', `Projeto ${activeIndex + 1} de ${count}`);
    previous.disabled = count < 2 || progress <= .001;
    next.disabled = count < 2 || progress >= .999;
    section.style.setProperty('--gallery-progress', count < 2 ? '1' : String(progress));
  }

  function measureGallery() {
    measureFrame = 0;
    measureHero();
    const oldPinned = pinned;
    const pinBounds = pin.getBoundingClientRect();
    const galleryVisible = pinBounds.top < window.innerHeight && pinBounds.bottom > 0;
    const oldProgress = progress;
    const wasInside = oldPinned && window.scrollY >= sectionTop && window.scrollY <= sectionTop + travel;
    section.classList.remove('is-pinned');
    track.style.removeProperty('transform');
    visibleCards = [...track.querySelectorAll('.project:not([hidden])')];
    travel = Math.max(0, track.scrollWidth - viewport.clientWidth + 6);
    if (visibleCards.length < 2) travel = 0;
    sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const pinHeight = pin.getBoundingClientRect().height;
    pinned = enabled && desktop.matches && travel > 0 && pinHeight <= window.innerHeight + 1;
    section.classList.toggle('is-pinned', pinned);
    section.style.setProperty('--gallery-height', `${pinHeight + travel}px`);
    if (pinned) viewport.scrollLeft = 0;
    else if (oldPinned) viewport.scrollLeft = oldProgress * travel;
    if (filterChanged) {
      viewport.scrollLeft = 0;
      if (galleryVisible && (oldPinned || pinned)) window.scrollTo({ top: sectionTop, behavior: 'instant' });
      filterChanged = false;
    } else if (wasInside && !pinned) window.scrollTo({ top: sectionTop, behavior: 'instant' });
    hint.textContent = pinned ? 'ROLE PARA EXPLORAR →' : 'DESLIZE OU USE AS SETAS →';
    updateGallery();
  }

  function scheduleMeasure() {
    if (!measureFrame) measureFrame = requestAnimationFrame(measureGallery);
  }

  function goTo(index, behavior = enabled ? 'smooth' : 'instant') {
    const card = visibleCards[clamp(index, 0, visibleCards.length - 1)];
    if (!card) return;
    const target = clamp(card.offsetLeft, 0, travel);
    if (pinned) window.scrollTo({ top: sectionTop + target, behavior });
    else viewport.scrollTo({ left: target, behavior });
  }
  previous.addEventListener('click', () => goTo(activeIndex - 1));
  next.addEventListener('click', () => goTo(activeIndex + 1));
  viewport.addEventListener('keydown', event => {
    const destinations = { ArrowLeft: activeIndex - 1, ArrowRight: activeIndex + 1, Home: 0, End: visibleCards.length - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    goTo(destinations[event.key]);
  });
  track.addEventListener('focusin', event => {
    const index = visibleCards.indexOf(event.target.closest('.project'));
    if (index < 0) return;
    if (pinned) viewport.scrollLeft = 0;
    if (event.target.matches(':focus-visible')) goTo(index, 'instant');
  });
  viewport.addEventListener('scroll', () => { if (!pinned) updateGallery(); }, { passive: true });
  new MutationObserver(() => { filterChanged = true; scheduleMeasure(); }).observe(track, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  new ResizeObserver(scheduleMeasure).observe(pin);
  new ResizeObserver(scheduleMeasure).observe(heroSurface);
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  document.querySelectorAll('.service-list details').forEach(detail => detail.addEventListener('toggle', scheduleMeasure));
  document.fonts.ready.then(scheduleMeasure);

  const art = document.querySelector('.hero-art');
  const amp = art.querySelector('.amp');
  const displacement = document.querySelector('#inc-liquid feDisplacementMap');
  const noise = document.querySelector('#inc-liquid feTurbulence');
  let artVisible = false;
  let liquidFrame = 0;
  let energy = 0;
  let lastTime = 0;
  let pointer = { x: 0, y: 0 };
  let current = { x: 0, y: 0, scale: 1 };
  let targetScale = 1;

  function stopLiquid() {
    cancelAnimationFrame(liquidFrame);
    liquidFrame = 0;
    lastTime = 0;
    energy = 0;
    displacement.setAttribute('scale', '0');
    amp.classList.remove('is-liquid');
    if (!enabled) amp.removeAttribute('style');
  }

  function animateLiquid(time) {
    liquidFrame = 0;
    if (!enabled || !artVisible || document.hidden) { stopLiquid(); return; }
    const step = Math.min((time - (lastTime || time - 16.67)) / 16.67, 3);
    lastTime = time;
    const ease = 1 - Math.pow(.87, step);
    energy *= Math.pow(.93, step);
    current.x += (pointer.x - current.x) * ease;
    current.y += (pointer.y - current.y) * ease;
    current.scale += (targetScale - current.scale) * ease;
    amp.style.setProperty('--amp-x', `${current.x * 14}px`);
    amp.style.setProperty('--amp-y', `${current.y * 10}px`);
    amp.style.setProperty('--amp-rotate', `${-12 + current.x * 8}deg`);
    amp.style.setProperty('--amp-scale', String(current.scale));
    const strength = energy * 55;
    amp.classList.toggle('is-liquid', strength > .2);
    displacement.setAttribute('scale', strength.toFixed(2));
    if (strength > .2) noise.setAttribute('baseFrequency', `${.009 + Math.sin(time * .0007) * .002} ${.014 + Math.cos(time * .0005) * .003}`);
    const unsettled = Math.abs(pointer.x - current.x) + Math.abs(pointer.y - current.y) + Math.abs(targetScale - current.scale);
    if (energy > .002 || unsettled > .001) liquidFrame = requestAnimationFrame(animateLiquid);
    else { lastTime = 0; amp.classList.remove('is-liquid'); displacement.setAttribute('scale', '0'); }
  }

  function wakeLiquid(pulse = 0) {
    if (!enabled || !artVisible || document.hidden) return;
    energy = clamp(energy + pulse);
    if (!liquidFrame) liquidFrame = requestAnimationFrame(animateLiquid);
  }
  art.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const rect = art.getBoundingClientRect();
    const nextPointer = { x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 };
    const speed = Math.hypot(nextPointer.x - pointer.x, nextPointer.y - pointer.y);
    pointer = nextPointer;
    targetScale = 1.06;
    wakeLiquid(Math.min(.4, speed * .9));
  });
  art.addEventListener('pointerenter', () => wakeLiquid(.6));
  art.addEventListener('pointerdown', () => wakeLiquid(.8));
  art.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 }; targetScale = 1; wakeLiquid(); });
  new IntersectionObserver(entries => {
    artVisible = entries[0].isIntersecting;
    if (artVisible) wakeLiquid(.65);
    else stopLiquid();
  }, { threshold: .05 }).observe(art);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopLiquid(); });

  let previousY = window.scrollY;
  function updateScroll() {
    scrollFrame = 0;
    updateHero();
    updateGallery();
    if (artVisible && enabled) {
      const speed = Math.min(Math.abs(window.scrollY - previousY) / 500, .25);
      targetScale = 1 + clamp((window.scrollY - heroTop) / heroTravel) * .04;
      wakeLiquid(speed);
    }
    previousY = window.scrollY;
  }
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }, { passive: true });

  function applyPreference() {
    enabled = !preference.matches && !paused;
    document.documentElement.dataset.motion = enabled ? 'on' : 'off';
    toggle.setAttribute('aria-pressed', String(!enabled));
    toggle.disabled = preference.matches;
    toggle.textContent = preference.matches ? 'Movimento reduzido' : enabled ? 'Pausar efeitos Ⅱ' : 'Ativar efeitos ↗';
    if (!enabled) {
      for (const animation of animations) animation.cancel();
      stopLiquid();
    }
    updateHero();
    scheduleMeasure();
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('inc-motion-paused', String(paused)); } catch { /* Storage is optional. */ }
    applyPreference();
    if (enabled) wakeLiquid(.65);
  });
  preference.addEventListener('change', applyPreference);
  desktop.addEventListener('change', scheduleMeasure);
  applyPreference();
  document.querySelectorAll('.hero-copy h1, .hero-copy > p, .hero-actions, .hero-art').forEach((element, index) => playEntrance(element, index * 90));
  measureGallery();
}
