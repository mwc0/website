(function () {
  const canvas = document.getElementById('rippleCanvas');
  if (!canvas) return;

  const ctxOpts = { alpha: false, antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: false };
  const gl = canvas.getContext('webgl2', ctxOpts) || canvas.getContext('webgl', ctxOpts);
  if (!gl) {
    canvas.style.display = 'none';
    return;
  }

  const VERT_SRC = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  // Domain-warped fbm (in the spirit of iq's "Fractal Brownian Motion" warp
  // technique) driving a black -> violet -> blue -> pink -> white palette,
  // plus a gentle *bounded* swirl/wander and a couple of red filament
  // layers to match the reference image's tendrils.
  const FRAG_SRC = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    mat2 rot2(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float amp = 0.55;
      for (int i = 0; i < 5; i++) {
        v += amp * noise(p);
        p = rot2(0.6) * p * 2.03 + vec2(1.3, -0.7);
        amp *= 0.55;
      }
      return v;
    }

    void main() {
      vec2 res = u_resolution;
      vec2 uv = (gl_FragCoord.xy - 0.5 * res) / res.y;
      float t = u_time;

      // Bounded wander instead of an unbounded linear pan -- keeps the
      // scene "breathing" in place rather than continuously flying/zooming
      // in one direction forever.
      vec2 center = vec2(-0.16, -0.10) + 0.14 * vec2(cos(t * 0.045), sin(t * 0.06));
      vec2 toC = uv - center;
      float d = length(toC);
      float swirlAmt = 1.8 * exp(-d * d * 2.2);
      float ang = swirlAmt + 0.15 * sin(t * 0.08);
      vec2 swirled = center + rot2(ang) * toC;

      vec2 drift = 0.55 * vec2(cos(t * 0.05), sin(t * 0.037));
      vec2 p = swirled * 1.55 + drift;

      vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));
      vec2 r = vec2(
        fbm(p + 3.4 * q + vec2(1.7, 9.2) + 0.06 * sin(t * 0.2)),
        fbm(p + 3.4 * q + vec2(8.3, 2.8) - 0.06 * cos(t * 0.17))
      );
      float f = fbm(p + 3.6 * r);

      vec3 col = vec3(0.008, 0.004, 0.02);
      col = mix(col, vec3(0.05, 0.02, 0.18), smoothstep(0.15, 0.55, f));
      col = mix(col, vec3(0.22, 0.08, 0.85), smoothstep(0.35, 0.75, f + 0.15 * r.x));
      col = mix(col, vec3(0.75, 0.32, 0.95), smoothstep(0.55, 0.92, f + 0.20 * q.y));
      col = mix(col, vec3(1.0, 0.85, 0.98), smoothstep(0.78, 1.05, f + 0.25 * r.y));

      float redMask = smoothstep(0.45, 0.85, r.x) * smoothstep(0.05, 0.55, q.y);
      col += redMask * vec3(0.85, 0.18, 0.16) * 0.85;

      float redLine = pow(clamp(1.0 - abs(fract(r.x * 3.0 + t * 0.05) - 0.5) * 2.0, 0.0, 1.0), 8.0);
      col += redLine * vec3(0.9, 0.2, 0.2) * 0.4 * smoothstep(0.3, 0.7, q.x);

      float veins = pow(clamp(1.0 - abs(fract(f * 7.0) - 0.5) * 2.0, 0.0, 1.0), 10.0);
      col += veins * vec3(0.6, 0.5, 1.0) * 0.5;

      float vig = smoothstep(1.5, 0.2, length(uv));
      col *= mix(0.55, 1.05, vig);

      col = pow(clamp(col, 0.0, 1.5), vec3(0.92));
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('ripple-bg shader error:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vs || !fs) {
    canvas.style.display = 'none';
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('ripple-bg link error:', gl.getProgramInfoLog(program));
    canvas.style.display = 'none';
    return;
  }
  gl.useProgram(program);

  const posLoc = gl.getAttribLocation(program, 'a_pos');
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed = prefersReducedMotion ? 0.06 : 1.0;

  // Render at a fraction of the CSS size and let the GPU/CSS upscale it --
  // this is a soft glow effect so full native-resolution sharpness isn't
  // needed, and it noticeably cuts fragment-shader cost.
  const DPR_CAP = 1.25;
  const RENDER_SCALE = 0.75;

  let width = 0, height = 0;
  let resizePending = false;

  function applyResize() {
    resizePending = false;
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr * RENDER_SCALE));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr * RENDER_SCALE));
    if (w === width && h === height) return;
    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }

  function scheduleResize() {
    if (resizePending) return;
    resizePending = true;
    requestAnimationFrame(applyResize);
  }

  window.addEventListener('resize', scheduleResize);
  if (window.ResizeObserver) {
    new ResizeObserver(scheduleResize).observe(canvas);
  }

  let elapsed = 0;
  let lastTs = null;
  let rafId = null;

  function frame(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    elapsed += dt * speed;

    gl.uniform2f(uRes, width, height);
    gl.uniform1f(uTime, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId === null) {
      lastTs = null;
      rafId = requestAnimationFrame(frame);
    }
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  applyResize();
  start();
})();
