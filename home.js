/*
 * Home page: the things that are shown working rather than described.
 *
 * The three hero cards each play their game on a loop, the tool plates run
 * small live readouts, and the scores panel reads the real Snake board. None
 * of it is needed to use the page: the markup already holds a finished state
 * for everything here, and with reduced motion that is what stays on screen.
 */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // ---- palette, re-read when the theme flips ----

  function cssVar(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  function hexToRgb(hex) {
    let h = String(hex).replace('#', '').trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-f]{6}$/i.test(h)) return [128, 128, 128];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }

  const rgba = (rgb, a) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

  const palette = {};
  const themeListeners = [];

  function readPalette() {
    palette.accent = hexToRgb(cssVar('--accent'));
    palette.warn = hexToRgb(cssVar('--warn'));
    palette.text = hexToRgb(cssVar('--text'));
    palette.dim = hexToRgb(cssVar('--text-dim'));
    palette.bg = hexToRgb(cssVar('--bg'));
  }
  readPalette();

  new MutationObserver(() => {
    readPalette();
    themeListeners.forEach((fn) => fn());
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  // ---- only animate what is on screen, in a visible tab ----

  function whileVisible(el, start, stop) {
    let onScreen = false;
    let running = false;
    const sync = () => {
      const should = onScreen && document.visibilityState === 'visible';
      if (should === running) return;
      running = should;
      if (running) start();
      else stop();
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        onScreen = entries[entries.length - 1].isIntersecting;
        sync();
      }).observe(el);
    } else {
      onScreen = true;
    }
    document.addEventListener('visibilitychange', sync);
    sync();
  }

  // Render at device resolution so the little boards stay crisp.
  function fitCanvas(canvas, w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
    ctx.fill();
  }

  // ---- Snake, steering itself toward the food ----

  (function snakeDemo() {
    const canvas = document.getElementById('demoSnake');
    if (!canvas) return;

    const W = 264;
    const H = 168;
    const CELL = 12;
    const COLS = W / CELL;
    const ROWS = H / CELL;
    const ctx = fitCanvas(canvas, W, H);

    let snake;
    let dir;
    let food;

    const same = (a, b) => a.x === b.x && a.y === b.y;
    const onSnake = (c) => snake.some((s) => same(s, c));

    function placeFood() {
      do {
        food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      } while (onSnake(food));
    }

    function reset() {
      snake = [];
      for (let i = 0; i < 5; i += 1) snake.push({ x: 8 - i, y: 7 });
      dir = { x: 1, y: 0 };
      placeFood();
    }

    function step() {
      const head = snake[0];
      const options = [
        { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
      ].filter((d) => {
        if (d.x === -dir.x && d.y === -dir.y) return false;
        const c = { x: head.x + d.x, y: head.y + d.y };
        if (c.x < 0 || c.y < 0 || c.x >= COLS || c.y >= ROWS) return false;
        // The tail cell frees up as the snake moves, so it is fair game.
        return !snake.slice(0, -1).some((s) => same(s, c));
      });

      if (!options.length || snake.length > 20) {
        reset();
        return;
      }

      const dist = (d) => Math.abs(head.x + d.x - food.x) + Math.abs(head.y + d.y - food.y);
      options.sort((a, b) => {
        const diff = dist(a) - dist(b);
        if (diff) return diff;
        // On a tie, keep going straight: fewer twitchy turns.
        return (same(b, dir) ? 1 : 0) - (same(a, dir) ? 1 : 0);
      });

      dir = options[0];
      const next = { x: head.x + dir.x, y: head.y + dir.y };
      snake.unshift(next);
      if (same(next, food)) placeFood();
      else snake.pop();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = rgba(palette.text, 0.04);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = CELL; x < W; x += CELL) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, H);
      }
      for (let y = CELL; y < H; y += CELL) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(W, y + 0.5);
      }
      ctx.stroke();

      ctx.fillStyle = rgba(palette.warn, 1);
      roundRect(ctx, food.x * CELL + 2.5, food.y * CELL + 2.5, CELL - 5, CELL - 5, 2.5);

      snake.forEach((seg, i) => {
        const fade = 1 - (i / snake.length) * 0.6;
        ctx.fillStyle = rgba(palette.accent, fade);
        roundRect(ctx, seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, 3);
      });
    }

    reset();
    // A few steps in, so the still frame already looks like a game under way.
    for (let i = 0; i < 9; i += 1) step();
    draw();
    themeListeners.push(draw);
    if (reduceMotion) return;

    let timer = null;
    whileVisible(canvas, () => {
      timer = setInterval(() => {
        step();
        draw();
      }, 120);
    }, () => clearInterval(timer));
  })();

  // ---- Driftwalk: rings of a tunnel coming toward you ----

  (function tunnelDemo() {
    const canvas = document.getElementById('demoTunnel');
    if (!canvas) return;

    const W = 264;
    const H = 168;
    const CX = W / 2;
    const CY = H / 2 - 4;
    const SIDES = 8;
    const RINGS = 9;
    const NEAR = 0.11;
    const ctx = fitCanvas(canvas, W, H);

    // Each ring sits at a depth z in (NEAR, 1]. One in three has a floor panel
    // missing, which is the gap the runner hops.
    const rings = [];
    for (let i = 0; i < RINGS; i += 1) {
      rings.push({ z: NEAR + ((i + 0.5) / RINGS) * (1 - NEAR), gap: i % 3 === 1 });
    }

    const radius = (z) => 13 / z;

    function vertex(z, k, spin) {
      const a = spin + Math.PI / SIDES + (k / SIDES) * Math.PI * 2;
      const r = radius(z);
      return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
    }

    function draw(t) {
      const spin = Math.sin(t * 0.55) * 0.42;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;

      // The long edges of the tunnel, from the far end to past the viewer.
      ctx.strokeStyle = rgba(palette.dim, 0.16);
      ctx.beginPath();
      for (let k = 0; k < SIDES; k += 1) {
        const far = vertex(1, k, spin);
        const near = vertex(NEAR, k, spin);
        ctx.moveTo(far[0], far[1]);
        ctx.lineTo(near[0], near[1]);
      }
      ctx.stroke();

      let hop = 0;
      rings.forEach((ring) => {
        const closeness = 1 - (ring.z - NEAR) / (1 - NEAR);
        ctx.strokeStyle = rgba(palette.accent, 0.1 + closeness * 0.75);
        ctx.lineWidth = 1 + closeness * 0.8;
        ctx.beginPath();
        for (let k = 0; k < SIDES; k += 1) {
          // Panel 1 is the floor: the side whose midpoint points straight down.
          if (ring.gap && k === 1) continue;
          const a = vertex(ring.z, k, spin);
          const b = vertex(ring.z, k + 1, spin);
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        }
        ctx.stroke();

        // The runner leaves the floor as a gap passes underneath.
        if (ring.gap) {
          const d = (ring.z - 0.2) / 0.09;
          if (Math.abs(d) < 1) hop = Math.max(hop, Math.cos((d * Math.PI) / 2));
        }
      });

      const floor = CY + radius(0.2) * Math.cos(Math.PI / SIDES);
      const rx = CX + Math.sin(spin) * -14;
      ctx.fillStyle = rgba(palette.text, 1);
      roundRect(ctx, rx - 4, floor - 13 - hop * 16, 8, 12, 3);
    }

    let t = 2.4;
    draw(t);
    themeListeners.push(() => draw(t));
    if (reduceMotion) return;

    let raf = null;
    let last = 0;
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      t += dt;
      rings.forEach((ring) => {
        // Depth closes faster the nearer it gets, which is what sells speed.
        ring.z -= dt * 0.42 * ring.z;
        if (ring.z < NEAR) ring.z += 1 - NEAR;
      });
      draw(t);
      raf = requestAnimationFrame(frame);
    }
    whileVisible(canvas, () => {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }, () => cancelAnimationFrame(raf));
  })();

  // ---- Wordle: three guesses, typed and scored, on a loop ----

  (function wordleDemo() {
    const board = document.getElementById('demoWordle');
    if (!board || reduceMotion) return;

    const rows = Array.from(board.querySelectorAll('.demo-wordle__row')).map((row) => (
      Array.from(row.children).map((tile) => ({
        el: tile,
        letter: tile.textContent,
        state: ['is-correct', 'is-present', 'is-absent'].find((c) => tile.classList.contains(c)),
      }))
    ));

    let visible = false;
    let waiters = [];
    whileVisible(board, () => {
      visible = true;
      waiters.forEach((fn) => fn());
      waiters = [];
    }, () => { visible = false; });

    // Sleeps, then also holds until the board is back on screen.
    const wait = (ms) => new Promise((resolve) => {
      setTimeout(() => {
        if (visible) resolve();
        else waiters.push(resolve);
      }, ms);
    });

    async function play() {
      for (;;) {
        await wait(2800);
        rows.flat().forEach((tile) => {
          tile.el.textContent = '';
          tile.el.classList.remove('is-correct', 'is-present', 'is-absent');
        });
        await wait(500);

        for (const row of rows) {
          for (const tile of row) {
            tile.el.textContent = tile.letter;
            await wait(110);
          }
          await wait(260);
          for (const tile of row) {
            tile.el.classList.add('is-turning');
            await wait(160);
            tile.el.classList.add(tile.state);
            tile.el.classList.remove('is-turning');
          }
          await wait(420);
        }
      }
    }
    play();
  })();

  // ---- Tool plates ----

  (function convertDemo() {
    const el = document.getElementById('demoConvert');
    const kind = document.getElementById('demoConvertKind');
    if (!el || reduceMotion) return;

    // The same factors tools/convert.js uses.
    const pairs = [
      ['1 m', '3.28084 ft', 'length'],
      ['1 kg', '2.20462 lb', 'weight'],
      ['100 °C', '212 °F', 'temperature'],
      ['26.2 mi', '42.1648 km', 'length'],
    ];
    const [from, , to] = el.children;
    let i = 0;
    let timer = null;

    whileVisible(el, () => {
      timer = setInterval(() => {
        i = (i + 1) % pairs.length;
        from.textContent = pairs[i][0];
        to.textContent = pairs[i][1];
        kind.textContent = pairs[i][2];
        el.classList.remove('is-swapping');
        void el.offsetWidth; // restart the animation
        el.classList.add('is-swapping');
      }, 3200);
    }, () => clearInterval(timer));
  })();

  (function epochDemo() {
    const el = document.getElementById('demoEpoch');
    const iso = document.getElementById('demoEpochIso');
    if (!el) return;

    function tick() {
      const now = new Date();
      el.textContent = String(Math.floor(now.getTime() / 1000));
      iso.textContent = now.toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
    }
    tick();
    if (!reduceMotion) setInterval(tick, 1000);
  })();

  (function baseDemo() {
    const bits = document.getElementById('demoBits');
    const text = document.getElementById('demoBase');
    if (!bits || reduceMotion) return;

    const cells = Array.from(bits.children);
    let n = 204;
    let timer = null;

    whileVisible(bits, () => {
      timer = setInterval(() => {
        n = (n + 1) % 256;
        cells.forEach((cell, i) => cell.classList.toggle('is-on', Boolean(n & (128 >> i))));
        text.textContent = `dec ${n}   hex ${n.toString(16).padStart(2, '0')}   oct ${n.toString(8)}`;
      }, 650);
    }, () => clearInterval(timer));
  })();

  // The colour plate audits the page it is on: each ink against the page's
  // background, in whichever theme is showing.
  (function auditDemo() {
    const list = document.getElementById('demoAudit');
    if (!list) return;

    function luminance(rgb) {
      const [r, g, b] = rgb.map((v) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function contrast(a, b) {
      const la = luminance(a);
      const lb = luminance(b);
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    }

    function measure() {
      const bg = hexToRgb(cssVar('--bg'));
      list.querySelectorAll('[data-ratio]').forEach((cell) => {
        const ratio = contrast(hexToRgb(cssVar(cell.dataset.ratio)), bg);
        cell.textContent = ratio.toFixed(2) + ':1';
        const grade = list.querySelector('[data-grade="' + cell.dataset.ratio + '"]');
        grade.textContent = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'fail';
        grade.classList.toggle('is-fail', ratio < 4.5);
      });
    }
    measure();
    themeListeners.push(measure);
  })();

  // ---- Snake high scores, straight from the board the game writes to ----

  (function scores() {
    const list = document.getElementById('homeScores');
    const status = document.getElementById('homeScoresStatus');
    const scope = document.getElementById('homeScoresScope');
    const board = window.Leaderboard;
    if (!list) return;

    if (!board) {
      status.textContent = 'Scores are unavailable right now';
      return;
    }

    scope.textContent = board.isRemote() ? 'Everyone' : 'This browser';

    board.top('snake').then((rows) => {
      if (!rows.length) {
        status.textContent = 'No scores yet. Be the first.';
        return;
      }
      status.textContent = '';
      rows.slice(0, 5).forEach((row, i) => {
        const li = document.createElement('li');
        li.className = 'scores__row';

        const rank = document.createElement('span');
        rank.className = 'scores__rank';
        rank.textContent = String(i + 1);

        const name = document.createElement('span');
        name.className = 'scores__name';
        name.textContent = row.name;

        const value = document.createElement('span');
        value.className = 'scores__score';
        value.textContent = String(row.score);

        li.append(rank, name, value);
        list.appendChild(li);
      });
    }, () => {
      status.textContent = 'Scores are unavailable right now';
    });
  })();
})();
