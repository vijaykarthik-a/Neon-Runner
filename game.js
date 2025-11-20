/* Neon Runner - Fullscreen Smooth Neon Version (19 Levels + Running Character) */

class NeonRunnerFixed {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.boot = document.getElementById("bootScreen");
    this.menu = document.getElementById("mainMenu");
    this.uiPanel = document.getElementById("uiPanel");
    this.hud = document.getElementById("hud");
    this.trollMessage = document.getElementById("trollMessage");

    this.TILE = 36;
    this.PLAYER_W = 28;
    this.PLAYER_H = 36;
    this.DOT_R = 8;

    this.level = 1;
    this.score = 0;
    this.lives = 3;
    this.dotsCollected = 0;
    this.totalDots = 0;

    this.playing = false;
    this.keys = {};

    this.platforms = [];
    this.enemies = [];
    this.dots = [];
    this.exit = { x: 0, y: 0 };

    this.controlsReversed = false;
    this.speedMultiplier = 1;
    this.fakeExits = [];
    this.invisiblePlatforms = [];

    this.makeLevels(19);

    this.attachEvents();
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    setTimeout(() => this.hideBoot(), 2000);
  }

  hideBoot() {
    this.boot.style.display = "none";
    this.menu.style.display = "flex";
  }

  attachEvents() {
    document.addEventListener("keydown", (e) => {
      this.keys[e.key] = true;
      if (e.key === " ") e.preventDefault();
    });
    document.addEventListener("keyup", (e) => (this.keys[e.key] = false));

    document.getElementById("startBtn").addEventListener("click", () => this.startLevel(this.level));
    document.getElementById("levelsBtn").addEventListener("click", () => this.showLevelSelect());
    document.getElementById("instrBtn").addEventListener("click", () => this.showInstructions());
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  makeLevels(n) {
    this.levels = [];
    for (let L = 1; L <= n; L++) {
      const w = Math.max(14, Math.floor(14 + L / 2));
      const platforms = [];

      platforms.push([0, 18, w * 2, 2]);

      for (let i = 0; i < Math.min(8, 3 + Math.floor(L / 3)); i++) {
        const px = 3 + i * 4 + (L % 3);
        const py = 14 - Math.floor(i * 1.5) - (L % 4);
        const pw = 3 + (i % 3);
        platforms.push([px, py, pw, 1]);
      }

      const enemies = [];
      const numEnemies = Math.min(6, Math.floor(L / 3));
      for (let e = 0; e < numEnemies; e++) {
        enemies.push([6 + e * 5, 15 - (e % 3) * 2, 0.6 + L / 20]);
      }

      const dots = Math.min(12, 3 + Math.floor(L / 2));
      const startX = 2,
        startY = 14;

      const exitX = w * 2 - 4;
      const exitY = 10 - Math.min(6, Math.floor(L / 4));

      const trolls =
        L > 15
          ? ["reverse", "speed", "invisible"]
          : L > 10
          ? ["speed", "invisible"]
          : L > 6
          ? ["speed"]
          : [];

      this.levels.push({ platforms, enemies, dots, startX, startY, exitX, exitY, trolls });
    }
  }

  showLevelSelect() {
    const modal = document.createElement("div");
    modal.className = "modal";

    const box = document.createElement("div");
    box.className = "box";
    box.innerHTML = `<h3>Select Level</h3>`;

    this.levels.forEach((_, i) => {
      const b = document.createElement("button");
      b.textContent = "Level " + (i + 1);
      b.onclick = () => {
        modal.remove();
        this.level = i + 1;
        this.startLevel(this.level);
      };
      box.appendChild(b);
    });

    const close = document.createElement("button");
    close.textContent = "Close";
    close.onclick = () => modal.remove();
    box.appendChild(close);

    modal.appendChild(box);
    document.body.appendChild(modal);
  }

  showInstructions() {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="box">
        <h3>Instructions</h3>
        <p>← → or A D: Move</p>
        <p>Space / W / ↑: Jump</p>
        <p>Collect all dots & reach green exit.</p>
        <button onclick="this.closest('.modal').remove()">Close</button>
      </div>`;
    document.body.appendChild(modal);
  }

  startLevel(levelNum) {
    this.menu.style.display = "none";
    this.uiPanel.style.display = "block";
    this.hud.style.display = "block";

    this.loadLevel(levelNum);
    this.playing = true;

    if (!this._loop) this.loop();
  }

  loadLevel(n) {
    const data = this.levels[n - 1];
    if (!data) return;

    this.platforms = [];
    this.enemies = [];
    this.dots = [];

    const rows = 20;
    this.TILE = Math.max(24, Math.floor(Math.min(this.canvas.width / 30, this.canvas.height / rows)));

    this.PLAYER_W = Math.floor(this.TILE * 0.75);
    this.PLAYER_H = Math.floor(this.TILE * 1.0);
    this.DOT_R = Math.floor(this.TILE * 0.22);

    data.platforms.forEach((p) =>
      this.platforms.push({ x: p[0] * this.TILE, y: p[1] * this.TILE, w: p[2] * this.TILE, h: p[3] * this.TILE })
    );

    data.enemies.forEach((e) =>
      this.enemies.push({ x: e[0] * this.TILE, y: e[1] * this.TILE, w: this.PLAYER_W, h: this.PLAYER_H, vx: e[2], dir: 1 })
    );

    this.totalDots = data.dots;
    this.dotsCollected = 0;

    const surfaces = [];
    this.platforms.forEach((p) => surfaces.push({ x: p.x + 5, y: p.y - this.DOT_R * 2, w: p.w - 10 }));

    for (let i = 0; i < this.totalDots; i++) {
      const s = surfaces[i % surfaces.length];
      const rx = s.x + Math.random() * Math.max(5, s.w - this.DOT_R * 2);
      const ry = s.y - Math.random() * Math.min(60, this.TILE * 1.5);
      this.dots.push({ x: rx, y: ry, collected: false });
    }

    this.player = {
      x: data.startX * this.TILE,
      y: data.startY * this.TILE - this.PLAYER_H,
      vx: 0,
      vy: 0,
      ground: false,
      runCycle: 0,
    };

    this.exit = {
      x: data.exitX * this.TILE,
      y: data.exitY * this.TILE,
      w: this.TILE,
      h: this.TILE,
    };

    this.controlsReversed = false;
    this.speedMultiplier = 1;
    this.fakeExits = [];
    this.invisiblePlatforms = [];

    if (data.trolls && data.trolls.length) this.applyTrolls(data.trolls);

    document.getElementById("levelLabel").textContent = "LEVEL: " + n;
    document.getElementById("scoreLabel").textContent = "SCORE: " + this.score;
    document.getElementById("livesLabel").textContent = "LIVES: " + this.lives;
    document.getElementById("dotsLabel").textContent = `DOTS: ${this.dotsCollected}/${this.totalDots}`;
  }

  applyTrolls(trolls) {
    trolls.forEach((t) => {
      if (t === "reverse")
        setTimeout(() => {
          this.controlsReversed = true;
          this.showTroll("🔄 Controls Reversed!");
          setTimeout(() => (this.controlsReversed = false), 5000);
        }, 3000);

      if (t === "speed")
        setTimeout(() => {
          this.speedMultiplier = 1.8;
          this.showTroll("⚡ Speed Boost!");
          setTimeout(() => (this.speedMultiplier = 1), 4000);
        }, 2000);

      if (t === "invisible")
        setTimeout(() => {
          const p = this.platforms[Math.floor(Math.random() * this.platforms.length)];
          if (p) {
            this.invisiblePlatforms.push(p);
            this.showTroll("👻 Invisible Platform");
            setTimeout(() => (this.invisiblePlatforms = this.invisiblePlatforms.filter((x) => x !== p)), 5500);
          }
        }, 3500);
    });
  }

  showTroll(msg) {
    this.trollMessage.textContent = msg;
    this.trollMessage.style.display = "block";
    setTimeout(() => (this.trollMessage.style.display = "none"), 2800);
  }

  loop() {
    this._loop = requestAnimationFrame(() => this.loop());
    if (!this.playing) return;
    this.update();
    this.render();
  }

  update() {
    const move = 4 * this.speedMultiplier;
    const jumpPower = Math.max(10, this.TILE * 0.32);

    let left = this.keys["ArrowLeft"] || this.keys["a"];
    let right = this.keys["ArrowRight"] || this.keys["d"];

    if (this.controlsReversed) [left, right] = [right, left];

    if (left) this.player.vx = -move;
    else if (right) this.player.vx = move;
    else this.player.vx *= 0.8;

    if ((this.keys[" "] || this.keys["ArrowUp"] || this.keys["w"]) && this.player.ground) {
      this.player.vy = -jumpPower;
      this.player.ground = false;
    }

    this.player.vy += 0.8;
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    const cw = this.canvas.width / (window.devicePixelRatio || 1);
    const ch = this.canvas.height / (window.devicePixelRatio || 1);

    this.player.ground = false;
    for (const p of this.platforms) {
      if (this.invisiblePlatforms.includes(p)) continue;

      if (this.collide(this.player, p)) {
        if (this.player.vy > 0 && this.player.y + this.PLAYER_H <= p.y + 12) {
          this.player.y = p.y - this.PLAYER_H;
          this.player.vy = 0;
          this.player.ground = true;
        } else if (this.player.vx > 0) {
          this.player.x = p.x - this.PLAYER_W;
          this.player.vx = 0;
        } else if (this.player.vx < 0) {
          this.player.x = p.x + p.w;
          this.player.vx = 0;
        }
      }
    }

    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x > cw - this.PLAYER_W) this.player.x = cw - this.PLAYER_W;
    if (this.player.y > ch) this.loseLife();

    for (const e of this.enemies) {
      e.x += e.vx * e.dir * (1 + this.level / 40);
      if (e.x < 0 || e.x > cw - e.w) e.dir *= -1;
      if (this.collide(this.player, e)) this.loseLife();
    }

    for (const d of this.dots) {
      if (!d.collected && this.pointColl({ x: this.player.x + this.PLAYER_W / 2, y: this.player.y + this.PLAYER_H / 2 }, { x:
