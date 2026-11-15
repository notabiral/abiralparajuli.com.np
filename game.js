/* Policy Patrol — vanilla canvas reimplementation.
   Mechanics preserved exactly from the October 2026 build: gravity 0.75,
   jump velocity -14.5, speed 4.5 rising 0.25 per 180 distance to a 10.5 cap,
   the same five obstacle types and sizes, 4px-inset collision, and the same
   weighted-recall formula. No double jump. Session-only high score. */
(function () {
  "use strict";

  var canvas = document.getElementById("game-canvas");
  var stage = document.getElementById("game-stage");
  if (!canvas || !stage) return;

  var GRAVITY = 0.75;
  var JUMP = -14.5;
  var SPEED_START = 4.5;
  var SPEED_MAX = 10.5;
  var SPEED_STEP = 0.25;
  var SPEED_EVERY = 180;

  var overlayReady = document.getElementById("overlay-ready");
  var overlayPaused = document.getElementById("overlay-paused");
  var overlayOver = document.getElementById("overlay-over");
  var toggleBtn = document.getElementById("game-toggle");
  var stateChip = document.getElementById("game-state-chip");
  var stateChipText = document.getElementById("game-state-chip-text");
  var stateLabel = document.getElementById("game-state-label");
  var scoreEl = document.getElementById("game-score");
  var bestEl = document.getElementById("game-best");
  var finalScore = document.getElementById("final-score");
  var finalRecall = document.getElementById("final-recall");
  var finalBest = document.getElementById("final-best");
  var finalSpeed = document.getElementById("final-speed");

  var state = "READY";
  var width = 900;
  var height = 360;
  var ground = 310;
  var distance = 0;
  var best = 0;
  var speed = SPEED_START;
  var spawnIn = 15;
  var firstSpawn = true;
  var player = { x: 60, y: 0, w: 48, h: 48, vy: 0, onGround: true, leg: 0 };
  var obstacles = [];
  var clouds = [];
  var rafId = null;

  function defaultClouds() {
    return [
      { x: 100, y: 30, w: 60, h: 18 },
      { x: 350, y: 50, w: 80, h: 20 },
      { x: 600, y: 25, w: 50, h: 14 },
      { x: 800, y: 45, w: 70, h: 16 }
    ];
  }

  function reset() {
    ground = height - 50;
    player = { x: 60, y: ground - 48, w: 48, h: 48, vy: 0, onGround: true, leg: 0 };
    obstacles = [];
    spawnIn = 15;
    firstSpawn = true;
    distance = 0;
    speed = SPEED_START;
    clouds = defaultClouds();
    renderScore();
  }

  function setState(next) {
    state = next;
    syncUI();
  }

  function syncUI() {
    overlayReady.hidden = state !== "READY";
    overlayPaused.hidden = state !== "PAUSED";
    overlayOver.hidden = state !== "GAME_OVER";
    var inRun = state === "PLAYING" || state === "PAUSED";
    toggleBtn.hidden = !inRun;
    stateChip.hidden = inRun;
    if (inRun) {
      var paused = state === "PAUSED";
      toggleBtn.setAttribute("aria-label", paused ? "Resume game" : "Pause game");
      toggleBtn.innerHTML = paused
        ? '<span aria-hidden="true">&#9654;&#65039;</span> Resume'
        : '<span aria-hidden="true">&#9208;&#65039;</span> Pause';
    } else {
      stateChipText.textContent = state === "GAME_OVER" ? "GAME OVER" : "READY";
    }
    stateLabel.textContent =
      state === "PLAYING" ? "Playing" :
      state === "PAUSED" ? "Paused" :
      state === "GAME_OVER" ? "Run ended" : "Ready";
  }

  function recall() {
    return Math.min(99.9, 88.9 + distance * 0.18).toFixed(1);
  }

  function renderScore() {
    var s = Math.floor(distance);
    if (scoreEl.textContent !== String(s)) scoreEl.textContent = String(s);
    if (bestEl.textContent !== String(best)) bestEl.textContent = String(best);
  }

  function startRun() {
    reset();
    setState("PLAYING");
    setTimeout(function () { canvas.focus(); }, 0);
  }

  function jump() {
    if (state === "GAME_OVER") { startRun(); return; }
    if (!player.onGround) return;
    if (state === "PLAYING" || state === "READY") {
      if (state === "READY") {
        startRun();
        player.vy = JUMP;
        player.onGround = false;
        return;
      }
      player.vy = JUMP;
      player.onGround = false;
    }
  }

  function togglePause() {
    if (state === "PLAYING") setState("PAUSED");
    else if (state === "PAUSED") setState("PLAYING");
  }

  function backToLobby() {
    reset();
    setState("READY");
  }

  function endRun() {
    if (distance > best) best = Math.floor(distance);
    finalScore.textContent = String(Math.floor(distance));
    finalRecall.textContent = recall();
    finalBest.textContent = String(Math.max(best, Math.floor(distance)));
    finalSpeed.textContent = speed.toFixed(2);
    renderScore();
    setState("GAME_OVER");
  }

  /* ---- sizing ---- */
  function resize() {
    var rect = stage.getBoundingClientRect();
    var w = Math.min(900, rect.width);
    var h = window.innerWidth >= 768 ? 420 : 360;
    var dpr = window.devicePixelRatio || 1;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    width = w;
    height = h;
    ground = h - 50;
    if (state !== "PLAYING") player.y = ground - player.h;
    var ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---- drawing ---- */
  function rr(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
    }
  }

  function drawBackground(ctx) {
    ctx.fillStyle = "#fcfcf9";
    ctx.fillRect(0, 0, width, height);
    // Clouds: soft white blobs drifting with the world.
    clouds.forEach(function (c) {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#eceae2";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.3, c.y + c.h * 0.6, c.w * 0.28, c.h * 0.45, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w * 0.6, c.y + c.h * 0.4, c.w * 0.3, c.h * 0.55, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w * 0.8, c.y + c.h * 0.65, c.w * 0.22, c.h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    // Ground line.
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, ground + 0.5);
    ctx.lineTo(width, ground + 0.5);
    ctx.stroke();
    ctx.fillStyle = "#f3f1ea";
    ctx.fillRect(0, ground + 1, width, height - ground);
  }

  function drawPlayer(ctx) {
    var p = player;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, ground + 4, p.w * 0.4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    var B = 36, H = 32, j = p.x + 6, ge = p.y + 4;
    ctx.fillStyle = "#111827";
    rr(ctx, j, ge, B, H, 8);
    ctx.fill();
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.arc(j + B / 2, ge + 6, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(j + B / 2 - 12, ge + 6, 24, 4);
    ctx.fillStyle = "#d1e7dd";
    ctx.fillRect(j + 8, ge + 12, 20, 6);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(j + 28, ge + 14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(j + 29, ge + 14, 1.5, 0, Math.PI * 2);
    ctx.fill();
    var swing = p.onGround ? Math.sin(p.leg) * 4 : 0;
    ctx.fillStyle = "#111827";
    ctx.fillRect(j + 6, ge + H, 6, 10 + swing);
    ctx.fillRect(j + B - 12, ge + H, 6, 10 - swing);
    ctx.fillStyle = "#e8ff59";
    ctx.beginPath();
    ctx.arc(j + B / 2, ge + 22, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawObstacle(ctx, o) {
    ctx.save();
    var x = o.x, y = o.y, w = o.w, h = o.h;
    if (o.type === "SLOT") {
      ctx.fillStyle = "#dc2626";
      rr(ctx, x, y, w, h, 6);
      ctx.fill();
      ctx.fillStyle = "#991b1b";
      ctx.fillRect(x + 6, y + 8, w - 12, 10);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 28, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("7", x + w / 2, y + 28 + 0.5);
      ctx.fillRect(x + w - 8, y + 12, 6, 14);
      ctx.beginPath();
      ctx.arc(x + w - 5, y + 12, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === "CARD") {
      ctx.fillStyle = "white";
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 1.5;
      rr(ctx, x, y, w, h, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#111827";
      ctx.font = "16px serif";
      ctx.textAlign = "center";
      ctx.fillText("\u2660", x + w / 2, y + h / 2 + 6);
      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 8px Inter, sans-serif";
      ctx.fillText("A", x + 6, y + 10);
    } else if (o.type === "DICE") {
      ctx.fillStyle = "white";
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 1.5;
      rr(ctx, x, y, w, h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#111827";
      [[w * 0.25, h * 0.25], [w * 0.5, h * 0.5], [w * 0.75, h * 0.75]].forEach(function (pt) {
        ctx.beginPath();
        ctx.arc(x + pt[0], y + pt[1], 3, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (o.type === "CHIP") {
      ctx.fillStyle = "white";
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, w / 2 - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#e5e7eb";
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, w / 2 - 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === "SCAM") {
      ctx.fillStyle = "white";
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 1.5;
      rr(ctx, x, y, w, h, h / 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 7px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SCAM", x + w / 2, y + h / 2 + 0.5);
    }
    ctx.restore();
  }

  function draw() {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx);
    obstacles.forEach(function (o) { drawObstacle(ctx, o); });
    drawPlayer(ctx);
  }

  /* ---- update ---- */
  function spawn() {
    var types = ["SLOT", "CARD", "DICE", "CHIP", "SCAM"];
    var type = types[Math.floor(Math.random() * types.length)];
    var w = 40, h = 50;
    if (type === "SLOT") { w = 40; h = 50; }
    else if (type === "CARD") { w = 28; h = 42; }
    else if (type === "DICE") { w = 36; h = 36; }
    else if (type === "CHIP") { w = 36; h = 36; }
    else if (type === "SCAM") { w = 44; h = 24; }
    var y = type === "SCAM" ? ground - h - 6 : type === "CHIP" ? ground - h - 2 : ground - h;
    var x = firstSpawn ? width * 0.85 : width + 20;
    obstacles.push({ x: x, y: y, w: w, h: h, type: type });
    if (firstSpawn) firstSpawn = false;
    spawnIn = 70 + Math.random() * 110;
  }

  function collides(a, b) {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x &&
      a.y < b.y + b.h && a.y + a.h > b.y
    );
  }

  function update(dt) {
    var step = dt / 16.67;
    distance += 0.25 * step;
    var tier = Math.floor(distance / SPEED_EVERY);
    speed = Math.min(SPEED_MAX, SPEED_START + tier * SPEED_STEP);
    renderScore();

    if (!player.onGround) {
      player.vy += GRAVITY;
      player.y += player.vy;
      if (player.y >= ground - player.h) {
        player.y = ground - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
    player.leg += speed * 0.25 * step;

    spawnIn -= 1 * step;
    if (spawnIn <= 0) spawn();

    obstacles.forEach(function (o) { o.x -= speed * step; });
    obstacles = obstacles.filter(function (o) { return o.x + o.w > -40; });
    clouds.forEach(function (c) {
      c.x -= speed * 0.22 * step;
      if (c.x + c.w < -20) c.x = width + 40 + Math.random() * 200;
    });

    var hitbox = {
      x: player.x + 4, y: player.y + 4,
      w: player.w - 8, h: player.h - 8
    };
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      var ob = { x: o.x + 4, y: o.y + 4, w: o.w - 8, h: o.h - 8 };
      if (collides(hitbox, ob)) { endRun(); break; }
    }
  }

  /* ---- loop ---- */
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(32, now - last);
    last = now;
    if (state === "PLAYING") update(dt);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  /* ---- input ---- */
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      if (state === "GAME_OVER") { startRun(); return; }
      if (state === "PAUSED") { setState("PLAYING"); return; }
      jump();
    } else if (e.code === "KeyP" || e.code === "Escape") {
      if (state === "GAME_OVER") return;
      e.preventDefault();
      togglePause();
    }
  });

  canvas.addEventListener("click", function () {
    if (state === "PAUSED") togglePause();
    else if (state === "GAME_OVER") startRun();
    else jump();
  });
  canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    if (state === "PAUSED") togglePause();
    else if (state === "GAME_OVER") startRun();
    else jump();
  }, { passive: false });

  document.getElementById("btn-start").addEventListener("click", startRun);
  document.getElementById("btn-resume").addEventListener("click", togglePause);
  document.getElementById("btn-restart").addEventListener("click", startRun);
  document.getElementById("btn-again").addEventListener("click", startRun);
  document.getElementById("btn-lobby").addEventListener("click", backToLobby);
  toggleBtn.addEventListener("click", togglePause);

  window.addEventListener("resize", resize);

  /* ---- boot ---- */
  resize();
  reset();
  syncUI();
  draw();
  rafId = requestAnimationFrame(frame);
})();
