(function () {
  const canvas = document.getElementById('tunnelCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('tunnelScore');
  const bestEl = document.getElementById('tunnelBest');
  const overlay = document.getElementById('tunnelOverlay');
  const overlayTitle = document.getElementById('tunnelOverlayTitle');
  const overlaySub = document.getElementById('tunnelOverlaySub');
  const jumpBtn = document.getElementById('tunnelJumpBtn');
  const flipBtn = document.getElementById('tunnelFlipBtn');

  const W = canvas.width;
  const H = canvas.height;
  const CELL = 50;
  const WALL_THICK = 34;
  const PLAYER_SIZE = 22;
  const PLAYER_SCREEN_X = 110;

  const FLOOR_Y = H - WALL_THICK; // top edge of floor tiles
  const CEIL_Y = WALL_THICK; // bottom edge of ceiling tiles

  const START_SPEED = 3.2; // px per frame
  const MAX_SPEED = 7.5;
  const SPEED_RAMP = 0.0006; // per frame

  let worldX, speed, gravitySide, airborne, airborneFrames, airborneTotal;
  let cells, lastCellType, sinceBothGap;
  let score, best, running, alive, rafId, distanceForSpeed;

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

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
      // storage unavailable — ignore
    }
  }

  function currentDifficulty() {
    // 0 at start, ramps up to 1 over ~4000px of travel
    return Math.min(1, distanceForSpeed / 4000);
  }

  function generateCell() {
    const diff = currentDifficulty();
    const bothGapChance = 0.04 + diff * 0.07; // up to ~11%
    const gapChance = 0.16 + diff * 0.08; // up to ~24% each side

    if (sinceBothGap < 1) {
      // force a safe cell right after a full gap so it's always landable
      sinceBothGap += 1;
      lastCellType = 'open';
      return 'open';
    }

    const roll = Math.random();
    let type;
    if (roll < bothGapChance) {
      type = 'bothGap';
      sinceBothGap = 0;
    } else if (roll < bothGapChance + gapChance) {
      type = 'floorGap';
      sinceBothGap += 1;
    } else if (roll < bothGapChance + gapChance * 2) {
      type = 'ceilingGap';
      sinceBothGap += 1;
    } else {
      type = 'open';
      sinceBothGap += 1;
    }
    lastCellType = type;
    return type;
  }

  function cellTypeAt(index) {
    while (cells.length <= index) {
      cells.push(generateCell());
    }
    return cells[index];
  }

  function resetState() {
    worldX = 0;
    speed = START_SPEED;
    distanceForSpeed = 0;
    gravitySide = 'floor';
    airborne = false;
    airborneFrames = 0;
    airborneTotal = 0;
    cells = [];
    lastCellType = 'open';
    sinceBothGap = 2;
    // guarantee a safe run-in so the player doesn't start on a gap
    for (let i = 0; i < 4; i++) cells.push('open');
    score = 0;
    alive = true;
    scoreEl.textContent = '0';
  }

  function playerCellIndex() {
    return Math.floor(worldX / CELL);
  }

  function cellScreenX(index) {
    return PLAYER_SCREEN_X + (index * CELL - worldX);
  }

  function startJump() {
    if (airborne || !alive) return;
    airborneTotal = Math.max(10, Math.round((CELL * 1.35) / speed));
    airborneFrames = airborneTotal;
    airborne = true;
  }

  function flipGravity() {
    if (!alive) return;
    const target = gravitySide === 'floor' ? 'ceiling' : 'floor';
    if (airborne) {
      gravitySide = target;
      return;
    }
    // grounded flip: instantly relocate, but only survives if destination is open
    gravitySide = target;
    checkGroundedSafety();
  }

  function checkGroundedSafety() {
    const idx = playerCellIndex();
    const type = cellTypeAt(idx);
    const unsafe =
      type === 'bothGap' ||
      (gravitySide === 'floor' && type === 'floorGap') ||
      (gravitySide === 'ceiling' && type === 'ceilingGap');
    if (unsafe) {
      die();
    }
  }

  function die() {
    if (!alive) return;
    alive = false;
    const distance = Math.floor(worldX / 10);
    if (distance > best) {
      best = distance;
      saveBest(best);
      bestEl.textContent = String(best);
    }
    overlayTitle.textContent = 'run over';
    overlaySub.textContent = `distance: ${distance} — press any key for a new run`;
    overlay.classList.remove('is-hidden');
  }

  function update() {
    if (!alive) return;

    distanceForSpeed = worldX;
    speed = Math.min(MAX_SPEED, START_SPEED + distanceForSpeed * SPEED_RAMP);
    worldX += speed;
    score = Math.floor(worldX / 10);
    scoreEl.textContent = String(score);

    if (airborne) {
      airborneFrames -= 1;
      if (airborneFrames <= 0) {
        airborne = false;
        checkGroundedSafety();
      }
    } else {
      checkGroundedSafety();
    }
  }

  function playerDrawY() {
    const baseY = gravitySide === 'floor' ? FLOOR_Y - PLAYER_SIZE : CEIL_Y;
    if (!airborne) return baseY;
    const t = 1 - airborneFrames / airborneTotal; // 0 -> 1 across the jump
    const arc = Math.sin(t * Math.PI); // 0 -> 1 -> 0
    const liftDistance = (H - WALL_THICK * 2 - PLAYER_SIZE) * 0.55;
    return gravitySide === 'floor' ? baseY - arc * liftDistance : baseY + arc * liftDistance;
  }

  function draw() {
    ctx.fillStyle = '#0e2129';
    ctx.fillRect(0, 0, W, H);

    const mint = cssVar('--mint', '#7c9dfc');
    const coral = cssVar('--coral', '#ef6e64');
    const line = 'rgba(61, 47, 122, 0.55)';
    const gapEdge = 'rgba(239, 110, 100, 0.55)';

    const startIdx = Math.floor((worldX - PLAYER_SCREEN_X) / CELL) - 1;
    const endIdx = startIdx + Math.ceil(W / CELL) + 2;

    for (let i = startIdx; i <= endIdx; i++) {
      const type = cellTypeAt(Math.max(0, i));
      const x = cellScreenX(i);

      const floorSolid = type !== 'floorGap' && type !== 'bothGap';
      const ceilSolid = type !== 'ceilingGap' && type !== 'bothGap';

      if (floorSolid) {
        ctx.fillStyle = line;
        ctx.fillRect(x, FLOOR_Y, CELL - 2, WALL_THICK);
        ctx.strokeStyle = 'rgba(124, 157, 252, 0.25)';
        ctx.strokeRect(x, FLOOR_Y, CELL - 2, WALL_THICK);
      } else {
        ctx.fillStyle = gapEdge;
        ctx.fillRect(x, FLOOR_Y - 3, CELL - 2, 3);
      }

      if (ceilSolid) {
        ctx.fillStyle = line;
        ctx.fillRect(x, 0, CELL - 2, CEIL_Y);
        ctx.strokeStyle = 'rgba(124, 157, 252, 0.25)';
        ctx.strokeRect(x, 0, CELL - 2, CEIL_Y);
      } else {
        ctx.fillStyle = gapEdge;
        ctx.fillRect(x, CEIL_Y, CELL - 2, 3);
      }
    }

    // player
    const py = playerDrawY();
    ctx.fillStyle = alive ? mint : coral;
    const r = 5;
    ctx.beginPath();
    ctx.moveTo(PLAYER_SCREEN_X + r, py);
    ctx.arcTo(PLAYER_SCREEN_X + PLAYER_SIZE, py, PLAYER_SCREEN_X + PLAYER_SIZE, py + PLAYER_SIZE, r);
    ctx.arcTo(PLAYER_SCREEN_X + PLAYER_SIZE, py + PLAYER_SIZE, PLAYER_SCREEN_X, py + PLAYER_SIZE, r);
    ctx.arcTo(PLAYER_SCREEN_X, py + PLAYER_SIZE, PLAYER_SCREEN_X, py, r);
    ctx.arcTo(PLAYER_SCREEN_X, py, PLAYER_SCREEN_X + PLAYER_SIZE, py, r);
    ctx.closePath();
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    if (alive) {
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

  const CONTROL_KEYS = new Set([
    'ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S', ' ',
  ]);

  window.addEventListener('keydown', (e) => {
    if (!CONTROL_KEYS.has(e.key)) return;
    e.preventDefault();

    if (!running || !alive) {
      startGame();
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
      startJump();
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      flipGravity();
    }
  });

  jumpBtn.addEventListener('click', () => {
    if (!running || !alive) {
      startGame();
      return;
    }
    startJump();
  });

  flipBtn.addEventListener('click', () => {
    if (!running || !alive) {
      startGame();
      return;
    }
    flipGravity();
  });

  overlay.addEventListener('click', () => {
    startGame();
  });

  best = loadBest();
  bestEl.textContent = String(best);
  running = false;
  resetState();
  draw();
})();
