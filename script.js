/* ==========================================================
   Diwali Greeting Card – script.js
   Sections: helpers, intro/replay, fairy lights, canvas FX,
             surprise, replay
   ========================================================== */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Intro animation (also used by Replay) ---------- */
  const intro = $('intro');
  let introTimer;

  function playIntro() {
    clearTimeout(introTimer);
    document.body.classList.remove('ready');
    intro.classList.remove('hide', 'play');
    void intro.offsetWidth;                 // force reflow so animations restart
    intro.classList.add('play');
    introTimer = setTimeout(() => {
      intro.classList.add('hide');
      document.body.classList.add('ready');
      launchFireworks(3);
    }, reduceMotion ? 300 : 2800);
  }

  /* ---------- Fairy lights around the card ---------- */
  const fairy = $('fairy');
  const COLORS = ['#ffd24d', '#ff9933', '#ffe9a8', '#ff7a1a'];

  function buildFairyLights() {
    fairy.innerHTML = '';
    const w = fairy.clientWidth, h = fairy.clientHeight, gap = 26;
    const points = [];
    for (let x = 0; x <= w; x += gap) { points.push([x, 0], [x, h]); }          // top & bottom
    for (let y = gap; y < h; y += gap) { points.push([0, y], [w, y]); }          // left & right
    points.forEach(([x, y], i) => {
      const bulb = document.createElement('span');
      bulb.style.left = x + 'px';
      bulb.style.top = y + 'px';
      bulb.style.setProperty('--c', COLORS[i % COLORS.length]);
      bulb.style.animationDelay = (i % 7) * 0.3 + 's';
      fairy.appendChild(bulb);
    });
  }

  /* ---------- Canvas: golden particles, stars, fireworks ---------- */
  const canvas = $('fx');
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildFairyLights();
  }

  function makeFloater(anywhere) {
    return { x: rand(0, W), y: anywhere ? rand(0, H) : H + 10, r: rand(1, 3.2),
             vy: rand(.2, .7), vx: rand(-.15, .15), phase: rand(0, 6.28), star: Math.random() < .3 };
  }

  function drawStar(x, y, r) {                  // 4-point twinkle star
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      ctx.lineTo(x + Math.cos(a) * r * 2.6, y + Math.sin(a) * r * 2.6);
      ctx.lineTo(x + Math.cos(a + Math.PI / 4) * r * .6, y + Math.sin(a + Math.PI / 4) * r * .6);
    }
    ctx.closePath(); ctx.fill();
  }

  let floaters = [], sparks = [];

  function burst(x, y) {
    const colors = ['#f5b82e', '#ff9933', '#f2701d', '#ffd86b', '#ff6a3d'];
    const n = W < 600 ? 36 : 56;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, s = rand(1.5, 4.2);
      sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color: colors[i % colors.length] });
    }
  }

  function launchFireworks(count) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) {
      setTimeout(() => burst(rand(W * .15, W * .85), rand(H * .12, H * .5)), i * 350);
    }
  }

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    for (const f of floaters) {
      f.y -= f.vy; f.x += f.vx + Math.sin(t / 1000 + f.phase) * .2;
      if (f.y < -10) Object.assign(f, makeFloater(false));
      ctx.globalAlpha = .45 + .45 * Math.sin(t / 400 + f.phase);
      ctx.fillStyle = '#f2a516'; ctx.shadowColor = '#ffb62e'; ctx.shadowBlur = 8;
      if (f.star) drawStar(f.x, f.y, f.r);
      else { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.28); ctx.fill(); }
    }
    sparks = sparks.filter((s) => s.life > 0);
    for (const s of sparks) {
      s.x += s.vx; s.y += s.vy; s.vy += .045; s.vx *= .985; s.life -= .015;
      ctx.globalAlpha = Math.max(s.life, 0);
      ctx.fillStyle = s.color; ctx.shadowColor = s.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, 6.28); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    requestAnimationFrame(frame);
  }

  /* ---------- Surprise wish ---------- */
  const modal = $('surprise');
  const closeModal = () => { modal.hidden = true; };

  $('surpriseBtn').addEventListener('click', () => {
    modal.hidden = false;
    $('closeBtn').focus();
    launchFireworks(7);
  });
  $('closeBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------- Replay ---------- */
  $('replayBtn').addEventListener('click', playIntro);

  /* ---------- Init ---------- */
  resize();
  floaters = Array.from({ length: W < 600 ? 35 : 70 }, () => makeFloater(true));
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
  playIntro();
  if (!reduceMotion) {                          // subtle ambient fireworks
    setInterval(() => { if (!document.hidden) burst(rand(W * .1, W * .9), rand(H * .1, H * .4)); }, 4500);
  }
})();
