/* Original words; independently drawn SVG matte animation on each page entry. */
(() => {
  'use strict';
  const cover = document.querySelector('[data-home-cover]');
  if (!cover || cover.dataset.homeReady) return;
  cover.dataset.homeReady = 'true';
  const opening = cover.querySelector('[data-home-opening]');
  if (!opening || typeof opening.showModal !== 'function') return;
  const skip = opening.querySelector('[data-opening-skip]');
  const art = opening.querySelector('[data-opening-art]');
  const wait = opening.querySelector('[data-opening-wait]');
  const bounce = opening.querySelector('[data-wait-bounce]');
  const ball = opening.querySelector('[data-wait-ball]');
  const line = opening.querySelector('[data-wait-line]');
  const discs = [...opening.querySelectorAll('[data-opening-disc]')];
  const masks = [...opening.querySelectorAll('[data-opening-mask]')];
  const texts = [0, 1, 2].map(index => [...opening.querySelectorAll(`[data-opening-text="${index}"]`)]);
  const coverReplay = cover.querySelector('[data-home-opening-replay]');
  const logo = document.querySelector('body > .topbar .logo');
  const primary = cover.querySelector('.primary-action');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!skip || !art || !wait || !bounce || !ball || !line || discs.length !== 3 || masks.length !== 3 || texts.some(pair => pair.length !== 2)) return;

  let animations = [];
  let generation = 0;
  let returnState = null;
  let restoreOnClose = true;
  let restoreFrame = 0;
  let entryFrame = 0;
  let pendingEntry = null;
  let initialEntryHandled = false;
  const cancelMotion = () => {
    generation += 1;
    animations.forEach(animation => animation.cancel());
    animations = [];
    opening.removeAttribute('data-motion-playing');
  };
  const hashTarget = (hash) => {
    if (!hash || hash.length < 2) return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch (_) { return null; }
  };
  let entered = false;
  function captureReturn(trigger) { return { focus: trigger }; }
  function restoreDestination() {
    if (!restoreOnClose) return;
    cancelAnimationFrame(restoreFrame);
    restoreFrame = requestAnimationFrame(() => {
      if (opening.open || !restoreOnClose) return;
      const directory = document.getElementById('directory');
      if (!directory) return;
      history.replaceState(history.state, '', '#directory');
      directory.setAttribute('tabindex', '-1');
      directory.focus({ preventScroll: true });
      const header = document.querySelector('body > .topbar');
      window.scrollTo({ top: Math.max(0, directory.getBoundingClientRect().top + scrollY - (header?.offsetHeight || 0) - 18), behavior: 'instant' });
    });
  }
  function finish(restore = true) {
    cancelMotion();
    restoreOnClose = restore;
    if (opening.open) opening.close();
    opening.removeAttribute('data-phase');
  }
  function start(trigger = document.activeElement, source = 'manual') {
    if (opening.open) return;
    if (entered) { restoreOnClose = true; restoreDestination(); return; }
    entered = true;
    cancelAnimationFrame(restoreFrame);
    cancelMotion();
    if (!opening.open) returnState = captureReturn(trigger, source);
    restoreOnClose = true;
    if (reduced.matches || typeof art.animate !== 'function') {
      if (opening.open) finish(); else restoreDestination();
      return;
    }
    opening.dataset.phase = 'playing';
    skip.textContent = '跳过开场 →';
    if (!opening.open) {
      try { opening.showModal(); } catch (_) { return; }
    }
    skip.focus({ preventScroll: true });
    const token = generation;
    const model = window.innerWidth < 480 ? {
      width: 430, height: 932, cx: 215, cy: 466, radius: 515, end: 233, cap: 40.523,
      discs: [[0,112],[68,179],[120,231]],
      words: [[12,116,963,-33],[78,171,968,-33],[126,232,967,-34]]
    } : window.innerWidth < 992 ? {
      width: 768, height: 1024, cx: 384, cy: 512, radius: 650, end: 223, cap: 87.16,
      discs: [[0,102],[58,159],[110,211]],
      words: [[12,106,1069,-47],[78,161,1074,-47],[126,222,1073,-48]]
    } : {
      width: 2086, height: 1080, cx: 1043, cy: 540, radius: 1182.625, end: 194, cap: 218.968,
      discs: [[0,82],[58,139],[110,191]],
      words: [[12,86,1193,-123],[78,141,1202,-109],[126,192,1197,-120]]
    };
    art.setAttribute('viewBox', `0 0 ${model.width} ${model.height}`);
    const frameMs = 3230 / (model.end - 2);
    const origin = document.timeline?.currentTime;
    const make = (element, frames, options) => {
      const animation = element.animate(frames, { fill: 'both', ...options });
      if (typeof origin === 'number') animation.startTime = origin;
      animations.push(animation);
      return animation;
    };
    opening.setAttribute('data-motion-playing', '');
    try {
      /* 800 ms of the compact bouncing-ball motif, without a fake loader delay. */
      make(bounce, [
        { transform: 'translateY(0px)', offset: 0, easing: 'cubic-bezier(.641,0,.702,.74)' },
        { transform: 'translateY(78.028px)', offset: 4/13, easing: 'cubic-bezier(.271,.715,.592,1)' },
        { transform: 'translateY(84.5px)', offset: 5/13 },
        { transform: 'translateY(84.5px)', offset: 6/13, easing: 'cubic-bezier(.167,.021,.833,1)' },
        { transform: 'translateY(0px)', offset: 1 }
      ], { duration: 13000/24, iterations: Infinity });
      make(ball, [
        [0,1,1],[2,1,1],[3,.90,1.105],[4,.825,1.075],[5,1.20,.80],
        [6,1.25,.75],[7,.825,1.075],[8,.91,1.075],[10,1,1],[13,1,1]
      ].map(([frame,x,y]) => ({ offset: frame/13, transform: `scale(${x},${y})` })),
      { duration: 13000/24, iterations: Infinity });
      make(line, [{ transform:'scaleX(1)',offset:0 },{ transform:'scaleX(.5)',offset:5/13 },
        { transform:'scaleX(.5)',offset:7/13 },{ transform:'scaleX(1)',offset:1 }],
        { duration:13000/24,iterations:Infinity });
      make(wait, [{opacity:1,offset:0},{opacity:1,offset:.999},{opacity:0,offset:1}], {duration:800});
      model.discs.forEach(([from,to], index) => {
        [discs[index],masks[index]].forEach(circle => {
          circle.setAttribute('cx', model.cx);
          circle.setAttribute('cy', model.cy);
          circle.setAttribute('r', model.radius);
          circle.style.transformOrigin = `${model.cx}px ${model.cy}px`;
          make(circle, [{transform:'scale(0)'},{transform:'scale(1)'}], {
            delay:800+(from-2)*frameMs, duration:(to-from)*frameMs,
            easing:'cubic-bezier(.65,0,.833,.833)'
          });
        });
      });
      model.words.forEach(([from,to,startY,endY], index) => {
        texts[index].forEach(text => {
          text.setAttribute('x', model.cx);
          text.setAttribute('y', model.cap/2);
          text.style.fontSize = `${model.cap/.716}px`;
          make(text, [{transform:`translateY(${startY}px)`},{transform:`translateY(${endY}px)`}], {
            delay:800+(from-2)*frameMs, duration:(to-from)*frameMs,
            easing:index===0?'cubic-bezier(.309,0,.833,.833)':'cubic-bezier(.35,0,.833,.833)'
          });
        });
      });
      /* The art appears at frame 2, then runs continuously to its real endpoint. */
      const master = make(art, [{opacity:1},{opacity:1}], {delay:800,duration:3230,fill:'forwards'});
      master.finished.then(() => {
        if (token === generation && opening.open) finish();
      }).catch(() => {});
    } catch (_) { finish(); }
  }
  function resetHome() {
    cancelAnimationFrame(restoreFrame);
    finish(false);
    entered = false;
    history.scrollRestoration = 'manual';
    history.replaceState(history.state, '', location.pathname + location.search);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  }
  skip.addEventListener('click', () => finish());
  opening.addEventListener('cancel', event => { event.preventDefault(); finish(); });
  opening.addEventListener('close', () => {
    // A queued pre-BFCache close event must not cancel a newly reopened dialog.
    if (opening.open) return;
    cancelMotion();
    restoreDestination();
  });
  if (coverReplay) coverReplay.hidden = true;
  const enter = event => {
    if (event.defaultPrevented || (event.button != null && event.button !== 0) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    start(event.currentTarget);
  };
  logo?.addEventListener('click', enter);
  primary?.addEventListener('click', enter);
  cover.querySelector('[data-home-enter]')?.addEventListener('click', enter);
  reduced.addEventListener?.('change', () => {
    if (reduced.matches && opening.open) finish();
  });
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(restoreFrame);
    finish(false);
  });
  window.addEventListener('pageshow', resetHome);
  resetHome();
})();
