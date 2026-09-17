(function () {
  const canvas = document.getElementById('tunnelCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('tunnelScore');
  const bestEl = document.getElementById('tunnelBest');
  const overlay = document.getElementById('tunnelOverlay');
  const overlayTitle = document.getElementById('tunnelOverlayTitle');
  const overlaySub = document.getElementById('tunnelOverlaySub');
  const leftBtn = document.getElementById('tunnelLeftBtn');
  const jumpBtn = document.getElementById('tunnelJumpBtn');
  const rightBtn = document.getElementById('tunnelRightBtn');

  const VIEW_W = 480;
  const VIEW_H = 340;
  const CX = VIEW_W / 2;
  const CY = VIEW_H / 2;

  // Tunnel is a square tube down +z. The view rotates so whichever wall the
  // player is on is always drawn at the bottom, which keeps the physics flat.
  const R = 1;              // half width of the tube
  const LANES = 5;          // tiles across each wall (holes are tile shaped)
  const LANE_W = (2 * R) / LANES;
  // Roughly square tiles. Deeper segments shrink the ring so fast that only
  // two or three are ever visible, which flattens the tube into a funnel.
  const SEG = 0.65;         // depth of one segment
  const Z_GAP = 0.035;      // seam between segments
  const LANE_GAP = 0.015;   // seam between lanes
  const FOCAL = 300;
  const NEAR_PLANE = 0.3;
  const DRAW_SEGMENTS = 22;
  const PLAYER_Z = 3.1;     // how far ahead of the camera the player runs

  const START_SPEED = 0.062; // segments per frame
  const MAX_SPEED = 0.12;
  const SPEED_RAMP = 0.000006;

  const GRAVITY = 0.0135;
  const JUMP_V = 0.13;

  // Sideways movement builds up and bleeds off rather than starting and
  // stopping dead, so steering feels weighted.
  const MOVE_MAX = 0.05;     // world units per frame at full tilt
  const MOVE_ACCEL = 0.0045;
  const MOVE_FRICTION = 0.84;

  const TURN_EASE = 0.075;   // share of the remaining corner turn per frame
  const RESTART_LOCKOUT_MS = 650; // swallow keys still held from the fatal run

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let travelled, speed, segments, firstSegment;
  let sideTurns, localX, vx, height, vy, airborne;
  let viewAngle, viewTarget;
  let score, best, running, alive, rafId;
  let falling, fallSpin, deadAt;
  let safeSide, safeLane;
  let moveLeft = false;
  let moveRight = false;

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function hexToRgb(hex, fallback) {
    let h = String(hex).replace('#', '').trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-f]{6}$/i.test(h)) return fallback;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  const palette = {};

  function readPalette() {
    palette.accent = cssVar('--accent', '#4bcf8a');
    palette.accentRgb = hexToRgb(palette.accent, [75, 207, 138]);
    palette.danger = cssVar('--danger', '#ff6b5e');
    palette.dangerRgb = hexToRgb(palette.danger, [255, 107, 94]);
    palette.void = cssVar('--bg', '#0a0b0a');
    palette.voidRgb = hexToRgb(palette.void, [10, 11, 10]);
  }

  function setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(VIEW_W * dpr);
    canvas.height = Math.round(VIEW_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', setupCanvas);

  function loadBest() {
    try {
      return parseInt(localStorage.getItem('driftwalk-best-distance') || '0', 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(v) {
    try {
      localStorage.setItem('driftwalk-best-distance', String(v));
    } catch (e) {
      // storage unavailable, ignore
    }
  }

  // ---- starfield seen through the holes ----

  const STARS = [];
  for (let i = 0; i < 140; i++) {
    STARS.push({
      a: Math.random() * Math.PI * 2,
      r: 40 + Math.random() * 330,
      size: Math.random() * 1.5 + 0.4,
      bright: 0.35 + Math.random() * 0.65,
    });
  }

  function drawStars() {
    ctx.fillStyle = palette.void;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    for (const s of STARS) {
      const a = s.a + viewAngle;
      const x = CX + Math.cos(a) * s.r;
      const y = CY + Math.sin(a) * s.r;
      if (x < 0 || x > VIEW_W || y < 0 || y > VIEW_H) continue;
      ctx.fillStyle = `rgba(255, 255, 255, ${s.bright})`;
      ctx.fillRect(x, y, s.size, s.size);
    }
  }

  // ---- level generation ----

  function difficulty() {
    return Math.min(1, travelled / 700);
  }

  function makeSegment() {
    const d = difficulty();
    const holeChance = 0.05 + d * 0.28;

    const cells = [];
    for (let s = 0; s < 4; s++) {
      const row = [];
      for (let l = 0; l < LANES; l++) row.push(Math.random() > holeChance);
      cells.push(row);
    }

    // Walk a guaranteed-solid route forward so a survivable path always
    // exists: it only ever steps one lane, or around one corner, at a time.
    if (Math.random() < 0.25 + d * 0.3) {
      if (Math.random() < 0.5) {
        safeLane -= 1;
        if (safeLane < 0) {
          safeSide = (safeSide + 3) % 4;
          safeLane = LANES - 1;
        }
      } else {
        safeLane += 1;
        if (safeLane > LANES - 1) {
          safeSide = (safeSide + 1) % 4;
          safeLane = 0;
        }
      }
    }
    cells[safeSide][safeLane] = true;

    return { cells: cells };
  }

  function segmentAt(index) {
    while (index >= firstSegment + segments.length) segments.push(makeSegment());
    const i = index - firstSegment;
    return i >= 0 && i < segments.length ? segments[i] : null;
  }

  function resetState() {
    travelled = 0;
    speed = START_SPEED;
    segments = [];
    firstSegment = 0;
    sideTurns = 0;
    localX = 0;
    vx = 0;
    height = 0;
    vy = 0;
    airborne = false;
    viewAngle = 0;
    viewTarget = 0;
    score = 0;
    alive = true;
    falling = false;
    fallSpin = 0;
    safeSide = 0;
    safeLane = Math.floor(LANES / 2);

    // Solid runway, long enough to read the tunnel before the first hole.
    for (let i = 0; i < 14; i++) {
      const seg = { cells: [] };
      for (let s = 0; s < 4; s++) {
        const row = [];
        for (let l = 0; l < LANES; l++) row.push(true);
        seg.cells.push(row);
      }
      segments.push(seg);
    }
    scoreEl.textContent = '0';
  }

  // ---- geometry ----

  function laneX(l) {
    return (l - (LANES - 1) / 2) * LANE_W;
  }

  function side() {
    return ((sideTurns % 4) + 4) % 4;
  }

  // Tile under the player's centre. Movement is continuous, holes are not.
  function laneUnderPlayer() {
    return Math.min(LANES - 1, Math.max(0, Math.floor((localX + R) / LANE_W)));
  }

  function project(x, y, z) {
    const s = FOCAL / z;
    return { x: CX + x * s, y: CY + y * s };
  }

  function rotate(x, y, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x: x * c - y * s, y: x * s + y * c };
  }

  // ---- drawing ----

  function drawPanel(x0, x1, zNear, zFar, angle, shade, depth) {
    const a = rotate(x0, R, angle);
    const b = rotate(x1, R, angle);
    const p1 = project(a.x, a.y, zNear);
    const p2 = project(b.x, b.y, zNear);
    const p3 = project(b.x, b.y, zFar);
    const p4 = project(a.x, a.y, zFar);

    // Falls off hard with distance so the tube reads as depth rather than a
    // flat funnel, and so the far end sinks into the starfield.
    const fade = Math.pow(1 - depth, 1.5);
    const rgb = palette.accentRgb;
    const lift = (0.15 + 0.6 * shade) * fade;
    const r = Math.round(8 + rgb[0] * lift);
    const g = Math.round(11 + rgb[1] * lift);
    const b2 = Math.round(9 + rgb[2] * lift);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.fillStyle = `rgb(${r}, ${g}, ${b2})`;
    ctx.fill();

    // Fades to nothing with depth. A constant floor here piles up dozens of
    // strokes at the vanishing point and lights it up like a lamp.
    const edge = (0.12 + 0.45 * shade) * fade;
    if (edge > 0.07) {
      ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${edge})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawTunnel() {
    const base = Math.floor(travelled);
    const frac = travelled - base;

    // Painter's order: far segments first so near ones cover them.
    for (let i = DRAW_SEGMENTS; i >= 0; i--) {
      const seg = segmentAt(base + i);
      if (!seg) continue;

      // Tiles are inset on all sides. The seams are what sell the forward
      // motion, and without them neighbouring segments fuse into one funnel.
      const zStart = (i - frac) * SEG + 0.55 + Z_GAP;
      const zFar = zStart + SEG - Z_GAP * 2;
      if (zFar <= NEAR_PLANE) continue;
      // The nearest tile's front edge passes through the camera as it scrolls
      // by. Projecting a depth at or below zero flings it to infinity and it
      // floods the screen for a frame, so clamp it to the near plane.
      const zNear = Math.max(zStart, NEAR_PLANE);

      const depth = Math.min(1, (i - frac) / DRAW_SEGMENTS);

      for (let s = 0; s < 4; s++) {
        const angle = viewAngle - s * (Math.PI / 2);
        const shade = Math.max(0, (Math.cos(angle) + 1) / 2);

        for (let l = 0; l < LANES; l++) {
          if (!seg.cells[s][l]) continue; // a hole: let the stars show through
          drawPanel(
            laneX(l) - LANE_W / 2 + LANE_GAP,
            laneX(l) + LANE_W / 2 - LANE_GAP,
            zNear, zFar, angle, shade, depth
          );
        }
      }
    }
  }

  function drawPlayer() {
    // Place the player on its own wall through the same rotation the walls
    // use. While the view is still easing round a corner this sweeps the
    // player round with it, instead of jumping from one edge to the other.
    const angle = viewAngle - side() * (Math.PI / 2);
    const pos = rotate(localX, R - height, angle);
    const p = project(pos.x, pos.y, PLAYER_Z);
    const scale = FOCAL / PLAYER_Z;
    const size = 0.17 * scale;
    const rgb = alive ? palette.accentRgb : palette.dangerRgb;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle); // stand upright on whichever wall it is on
    if (falling) ctx.rotate(fallSpin);
    ctx.translate(0, -size * 0.5);

    if (!reduceMotion) {
      ctx.shadowColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.9)`;
      ctx.shadowBlur = 16;
    }
    ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    const r = size * 0.32;
    ctx.beginPath();
    ctx.moveTo(-size / 2 + r, -size / 2);
    ctx.arcTo(size / 2, -size / 2, size / 2, size / 2, r);
    ctx.arcTo(size / 2, size / 2, -size / 2, size / 2, r);
    ctx.arcTo(-size / 2, size / 2, -size / 2, -size / 2, r);
    ctx.arcTo(-size / 2, -size / 2, size / 2, -size / 2, r);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // eyes, so it reads as facing down the tunnel
    ctx.fillStyle = palette.void;
    const eye = Math.max(1.2, size * 0.1);
    ctx.beginPath();
    ctx.arc(-size * 0.17, -size * 0.05, eye, 0, Math.PI * 2);
    ctx.arc(size * 0.17, -size * 0.05, eye, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // The far end is tiles a pixel or two across. As they slide forward they
  // alias and shimmer, so fog the vanishing point out into the void.
  function drawDepthFog() {
    const v = palette.voidRgb;
    const fog = ctx.createRadialGradient(CX, CY, 0, CX, CY, 78);
    fog.addColorStop(0, `rgba(${v[0]}, ${v[1]}, ${v[2]}, 1)`);
    fog.addColorStop(0.45, `rgba(${v[0]}, ${v[1]}, ${v[2]}, 0.85)`);
    fog.addColorStop(1, `rgba(${v[0]}, ${v[1]}, ${v[2]}, 0)`);
    ctx.fillStyle = fog;
    ctx.fillRect(CX - 78, CY - 78, 156, 156);
  }

  function draw() {
    drawStars();
    drawTunnel();
    drawDepthFog();
    drawPlayer();
  }

  // ---- movement ----

  // Slide along the current wall. Past either edge the player rounds the
  // corner onto the neighbouring wall and the view turns to put it underfoot.
  function steer() {
    const dir = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
    if (dir) {
      vx += dir * MOVE_ACCEL;
    } else {
      vx *= MOVE_FRICTION;
      if (Math.abs(vx) < 0.0004) vx = 0;
    }
    vx = Math.max(-MOVE_MAX, Math.min(MOVE_MAX, vx));
    if (!vx) return;

    localX += vx;
    while (localX > R) {
      localX -= 2 * R;
      sideTurns += 1;
      viewTarget = sideTurns * (Math.PI / 2);
    }
    while (localX < -R) {
      localX += 2 * R;
      sideTurns -= 1;
      viewTarget = sideTurns * (Math.PI / 2);
    }
  }

  function releaseSteering() {
    moveLeft = false;
    moveRight = false;
  }

  function jump() {
    if (!running || !alive || airborne) return;
    airborne = true;
    vy = JUMP_V;
  }

  function fallOut() {
    alive = false;
    falling = true;
  }

  function die() {
    running = false;
    deadAt = performance.now();
    releaseSteering();
    const distance = Math.floor(travelled * 10);
    if (distance > best) {
      best = distance;
      bestEl.textContent = String(best);
      saveBest(best);
    }
    overlayTitle.textContent = 'run over';
    overlaySub.textContent = `distance: ${distance}. press any key for a new run`;
    overlay.classList.remove('is-hidden');
  }

  function update() {
    if (falling) {
      // Tumble away through the hole before the overlay appears.
      height -= 0.055;
      fallSpin += 0.22;
      if (height < -3.2) {
        falling = false;
        die();
      }
      return;
    }

    if (!alive) return;

    speed = Math.min(MAX_SPEED, speed + SPEED_RAMP);
    travelled += speed;
    steer();

    // Ease the tube around when the player rounds a corner.
    const turnStep = reduceMotion ? 1 : TURN_EASE;
    viewAngle += (viewTarget - viewAngle) * turnStep;

    if (airborne) {
      height += vy;
      vy -= GRAVITY;
      if (height <= 0) {
        height = 0;
        vy = 0;
        airborne = false;
      }
    }

    // Checked every frame, not just on reaching a new tile, since sideways
    // movement can carry a grounded player onto a hole mid-tile. It reads the
    // segment under the player rather than the camera, so the hole that kills
    // you is the one drawn beneath your feet.
    const underfoot = segmentAt(Math.floor(travelled + PLAYER_Z / SEG));
    if (underfoot && !airborne && !underfoot.cells[side()][laneUnderPlayer()]) {
      fallOut();
      return;
    }

    // Drop stale segments so the array does not grow without bound.
    const keepFrom = Math.floor(travelled) - 2;
    if (keepFrom > firstSegment) {
      segments.splice(0, keepFrom - firstSegment);
      firstSegment = keepFrom;
    }

    const distance = Math.floor(travelled * 10);
    if (distance !== score) {
      score = distance;
      scoreEl.textContent = String(score);
    }
  }

  function loop() {
    update();
    draw();
    if (alive || falling) {
      rafId = requestAnimationFrame(loop);
    }
  }

  function startGame() {
    if (rafId) cancelAnimationFrame(rafId);
    resetState();
    running = true;
    overlay.classList.add('is-hidden');
    rafId = requestAnimationFrame(loop);
  }

  // ---- input ----

  const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A']);
  const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
  const JUMP_KEYS = new Set([' ', 'ArrowUp', 'w', 'W']);

  function playing() {
    return running && alive;
  }

  // A run can only start once the fall has finished and the lockout has
  // passed, so a key still held from the fatal moment cannot restart it.
  // `alive` is already false mid-fall while `running` is not, which is why
  // the fall is checked separately.
  function tryStart() {
    if (falling || playing()) return false;
    // Only after a death: performance.now() counts from page load, so
    // treating "never died" as time 0 would block the first start too.
    if (deadAt !== undefined && performance.now() - deadAt < RESTART_LOCKOUT_MS) return false;
    startGame();
    return true;
  }

  window.addEventListener('keydown', (e) => {
    // On the desktop every game listens at once, so only act when focused.
    if (window.Desktop && !window.Desktop.hasFocus('tunnel')) return;

    const isControl = LEFT_KEYS.has(e.key) || RIGHT_KEYS.has(e.key) || JUMP_KEYS.has(e.key);
    if (!isControl) return;
    e.preventDefault();

    if (!playing()) {
      if (!e.repeat) tryStart();
      return;
    }

    if (LEFT_KEYS.has(e.key)) moveLeft = true;
    else if (RIGHT_KEYS.has(e.key)) moveRight = true;
    else jump();
  });

  window.addEventListener('keyup', (e) => {
    if (LEFT_KEYS.has(e.key)) moveLeft = false;
    else if (RIGHT_KEYS.has(e.key)) moveRight = false;
  });

  // Held keys never get a keyup if focus leaves mid-press.
  window.addEventListener('blur', releaseSteering);

  // On-screen buttons are hold-to-steer, matching the keyboard.
  function holdToSteer(btn, set) {
    if (!btn) return;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!playing()) {
        tryStart();
        return;
      }
      set(true);
    });
    const release = () => set(false);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
  }

  holdToSteer(leftBtn, (on) => { moveLeft = on; });
  holdToSteer(rightBtn, (on) => { moveRight = on; });

  if (jumpBtn) {
    jumpBtn.addEventListener('click', () => {
      if (!playing()) tryStart();
      else jump();
    });
  }

  overlay.addEventListener('click', () => {
    tryStart();
  });

  // Touch: drag sideways to steer for as long as the finger is down, tap to
  // jump.
  const DRAG_THRESHOLD = 12;
  let touchX = null;
  let dragged = false;

  canvas.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX;
    dragged = false;
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (touchX === null || !playing()) return;
    const dx = e.touches[0].clientX - touchX;
    if (Math.abs(dx) < DRAG_THRESHOLD) return;
    dragged = true;
    moveRight = dx > 0;
    moveLeft = dx < 0;
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    const wasTap = touchX !== null && !dragged;
    touchX = null;
    releaseSteering();
    if (!wasTap) return;
    if (!playing()) tryStart();
    else jump();
  }, { passive: true });

  // ---- lifecycle ----

  function pauseLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function resumeLoop() {
    if (running && (alive || falling) && rafId === null) rafId = requestAnimationFrame(loop);
  }

  const hostWindow = document.querySelector('[data-window="tunnel"]');
  if (hostWindow) {
    // Losing focus also drops held keys, or the player keeps sliding sideways
    // on return because the keyup went to another window.
    hostWindow.addEventListener('desktop:blur', () => { pauseLoop(); releaseSteering(); });
    hostWindow.addEventListener('desktop:close', () => { pauseLoop(); releaseSteering(); });
    hostWindow.addEventListener('desktop:focus', resumeLoop);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseLoop();
    else if (!hostWindow || !hostWindow.hidden) resumeLoop();
  });

  readPalette();
  setupCanvas();
  best = loadBest();
  bestEl.textContent = String(best);
  running = false;
  resetState();
  draw();
})();
