/* game.js — Neon Runner (improved + 19 levels) */

(() => {
  // -- Globals & DOM
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const boot = document.getElementById('bootScreen');
  const menu = document.getElementById('menu');
  const levelSelectModal = document.getElementById('levelSelect');
  const instructionsModal = document.getElementById('instructions');
  const message = document.getElementById('message');
  const gameOverOverlay = document.getElementById('gameOver');
  const levelCompleteOverlay = document.getElementById('levelComplete');

  const levelLabel = document.getElementById('levelLabel');
  const scoreLabel = document.getElementById('scoreLabel');
  const livesLabel = document.getElementById('livesLabel');
  const dotsLabel = document.getElementById('dotsLabel');
  const totalDotsLabel = document.getElementById('totalDotsLabel');
  const finalScore = document.getElementById('finalScore');
  const levelScore = document.getElementById('levelScore');

  // UI buttons
  document.getElementById('startButton').onclick = () => startGame();
  document.getElementById('levelsButton').onclick = () => showLevelSelect();
  document.getElementById('instructionsButton').onclick = () => showInstructions();
  document.getElementById('retryBtn').onclick = () => { gameState.lives = 3; hideOverlay(gameOverOverlay); startLevel(gameState.level); };
  document.getElementById('menuBtn').onclick = () => { hideOverlay(gameOverOverlay); showMainMenu(); };
  document.getElementById('nextBtn').onclick = () => { hideOverlay(levelCompleteOverlay); nextLevel(); };
  document.getElementById('lvlSelectBtn').onclick = () => { hideOverlay(levelCompleteOverlay); showLevelSelect(); };
  document.getElementById('menuBtn2').onclick = () => { hideOverlay(levelCompleteOverlay); showMainMenu(); };

  // -- State
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let GAME_W = 1200, GAME_H = 700; // logical target (canvas will scale)
  let TILE = 36; // base tile, will be re-evaluated per level
  const PLAYER_W_FACTOR = 0.75;

  const gameState = {
    playing: false,
    level: 1,
    score: 0,
    lives: 3,
    difficulty: 'easy'
  };

  let player = null;
  let platforms = [];
  let enemies = [];
  let dots = [];
  let exitObj = null;
  let particles = [];
  let animFrame = 0;

  let keys = {};

  // -- Input events
  window.addEventListener('keydown', (e) => { keys[e.key] = true; if (e.key === ' ') e.preventDefault(); });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  // -- Canvas scaling (responsive + DPR)
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    DPR = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * DPR);
    canvas.height = Math.round(rect.height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  // set canvas to full window area
  function fitCanvasFull() {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    resizeCanvas();
  }
  window.addEventListener('resize', () => { fitCanvasFull(); });
  fitCanvasFull();

  // -- Boot screen fade
  setTimeout(() => { if (boot) boot.style.display = 'none'; }, 1400);

  // -- Level generation: 19 levels
  function makeLevels() {
    const levels = [];
    for (let L = 1; L <= 19; L++) {
      // grid base: width in tiles and platform patterns
      const widthTiles = 34;
      const base = [];
      base.push([0, 18, widthTiles, 1]); // ground
      // Add stepped platforms, more with L
      const stepCount = Math.min(8, 2 + Math.floor(L / 3));
      for (let i = 0; i < stepCount; i++) {
        const px = 3 + i * 3 + (L % 2);
        const py = 14 - Math.floor(i * 1.2) - (L % 3);
        const pw = 3 + ((i + L) % 3);
        base.push([px, py, pw, 1]);
      }
      // add occasional mid large platform
      if (L > 6) base.push([Math.max(6, L % 5 + 10), 10, 8, 1]);
      // enemy density scales
      const enemies = [];
      const numEnemies = Math.min(6, Math.floor(L / 3));
      for (let e = 0; e < numEnemies; e++) enemies.push([6 + e * 4 + (L % 3), 16 - (e % 3), 0.6 + L / 30]);

      const dots = Math.min(12, 3 + Math.floor(L / 2));
      const startX = 2, startY = 16;
      const exitX = widthTiles - 4 - (L % 5), exitY = 14 - Math.min(6, Math.floor(L / 4));
      const trolls = L > 12 ? ['speed', 'reverse'] : (L > 8 ? ['speed'] : []);
      levels.push({ platforms: base, enemies, dots, startX, startY, exitX, exitY, trolls });
    }
    return levels;
  }
  const LEVELS = makeLevels();

  // -- Utility: clamp
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // -- Load a level: tile scaling, platform conversion, dot placement near platforms
  function loadLevel(n) {
    const L = LEVELS[n - 1] || LEVELS[LEVELS.length - 1];
    // recalc tile size so map fits canvas height
    const logicalRows = 20;
    const ch = canvas.height / DPR;
    TILE = Math.max(22, Math.floor(ch / logicalRows));
    const playerW = Math.floor(TILE * PLAYER_W_FACTOR);
    const playerH = Math.floor(TILE * 1.0);

    // convert platforms to pixel coords
    platforms = L.platforms.map(p => ({ x: p[0] * TILE, y: p[1] * TILE, w: p[2] * TILE, h: p[3] * TILE, visible: true }));

    // player spawn
    player = { x: L.startX * TILE + 2, y: L.startY * TILE - playerH, w: playerW, h: playerH, vx: 0, vy: 0, grounded: false, facingRight: true, runCycle: 0 };

    // enemies
    enemies = L.enemies.map(e => ({ x: e[0] * TILE, y: e[1] * TILE, w: playerW, h: playerH, vx: e[2], dir: 1 }));

    // exit
    exitObj = { x: L.exitX * TILE, y: L.exitY * TILE, w: TILE, h: TILE };

    // dots: placed above platform surfaces (safe)
    dots = [];
    const surfaces = platforms.filter(p => p.h <= TILE * 2);
    for (let i = 0; i < L.dots; i++) {
      if (surfaces.length) {
        const s = surfaces[i % surfaces.length];
        const rx = s.x + 8 + Math.random() * Math.max(8, s.w - 16);
        const ry = s.y - 8 - Math.random() * Math.min(40, TILE * 1.2);
        dots.push({ x: rx, y: ry, r: Math.floor(TILE * 0.22), collected: false });
      } else {
        dots.push({ x: 40 + i * 48, y: (canvas.height / DPR) / 2, r: Math.floor(TILE * 0.22), collected: false });
      }
    }

    // reset particles
    particles = [];

    // HUD
    levelLabel.textContent = n;
    scoreLabel.textContent = gameState.score;
    livesLabel.textContent = gameState.lives;
    dotsLabel.textContent = '0';
    totalDotsLabel.textContent = dots.length;

    // possible delayed trolls (less intrusive)
    if (L.trolls && L.trolls.length) {
      setTimeout(() => {
        const t = L.trolls[Math.floor(Math.random() * L.trolls.length)];
        if (t === 'speed') {
          speedMultiplier = 1.8;
          showToast('⚡ Speed surge!');
          setTimeout(() => speedMultiplier = 1, 3000);
        } else if (t === 'reverse') {
          controlsReversed = true;
          showToast('🔄 Controls reversed!');
          setTimeout(() => controlsReversed = false, 3500);
        }
      }, 2000 + Math.random() * 2000);
    }
  }

  // -- Gameplay params
  let gravity = 0.8;
  let speedMultiplier = 1;
  let controlsReversed = false;

  // -- Particles helpers
  function addParticle(x,y,vx,vy,col,life){ particles.push({x,y,vx,vy,col,life,max:life}); }
  function updateParticles(){ for(let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.life--; if(p.life<=0) particles.splice(i,1); } }
  function drawParticles(){
    for(const p of particles){ ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, 2,2); } ctx.globalAlpha =1;
  }

  // -- Collision helpers
  function rectColl(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function pointInRect(px,py,b){ return px > b.x && px < b.x + b.w && py > b.y && py < b.y + b.h; }

  // -- Rendering
  function render() {
    const cw = canvas.width / DPR, ch = canvas.height / DPR;
    // background
    const g = ctx.createLinearGradient(0,0,0,ch);
    g.addColorStop(0, '#0a0a0a');
    g.addColorStop(1, '#000');
    ctx.fillStyle = g; ctx.fillRect(0,0,cw,ch);

    // platforms
    ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(255,0,68,0.6)';
    platforms.forEach(p => {
      if (p.visible) {
        ctx.fillStyle = 'rgba(255,0,68,0.16)'; ctx.fillRect(p.x,p.y,p.w,p.h);
        // highlight
        ctx.fillStyle = 'rgba(255,120,120,0.06)'; ctx.fillRect(p.x+2, p.y+2, p.w-4, 3);
      } else {
        ctx.strokeStyle = 'rgba(255,0,68,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([6,6]); ctx.strokeRect(p.x,p.y,p.w,p.h); ctx.setLineDash([]);
      }
    });
    ctx.shadowBlur = 0;

    // dots
    dots.forEach(d => {
      if (!d.collected) {
        ctx.beginPath();
        ctx.fillStyle = '#ff8866'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff4422';
        ctx.arc(d.x, d.y, d.r, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        // core
        ctx.fillStyle = '#fff0e0'; ctx.beginPath(); ctx.arc(d.x - 2, d.y - 2, d.r*0.5, 0, Math.PI*2); ctx.fill();
      }
    });

    // exit (green when available)
    const allCollected = dots.length && dots.every(d => d.collected);
    if (allCollected) {
      ctx.fillStyle = '#00ff88'; ctx.shadowBlur = 8; ctx.shadowColor = '#00ff88'; ctx.fillRect(exitObj.x, exitObj.y, exitObj.w, exitObj.h);
    } else {
      ctx.fillStyle = '#666'; ctx.fillRect(exitObj.x, exitObj.y, exitObj.w, exitObj.h);
    }
    ctx.shadowBlur = 0;

    // enemies
    enemies.forEach(e => {
      ctx.save();
      const bounce = Math.sin(animFrame * 0.06) * 3;
      ctx.shadowBlur = 12; ctx.shadowColor = '#ff8a00';
      ctx.fillStyle = '#ff5533'; ctx.fillRect(e.x, e.y + bounce, e.w, e.h);
      ctx.restore();
    });

    // player (simple pixel runner)
    ctx.save();
    const bob = Math.sin(player.runCycle) * 3;
    ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x, player.y + bob, player.w, player.h);
    // legs
    ctx.fillStyle = '#ff0044';
    const legOffset = Math.sin(player.runCycle*1.6) * 4;
    ctx.fillRect(player.x + 4, player.y + player.h - 8 + Math.abs(legOffset), 6, 6);
    ctx.fillRect(player.x + player.w - 10, player.y + player.h - 8 - Math.abs(legOffset), 6, 6);
    ctx.restore();

    // particles
    drawParticles();
  }

  // -- Update physics & gameplay
  function update() {
    animFrame++;
    player.runCycle += Math.abs(player.vx) * 0.08;

    // input
    let left = keys['ArrowLeft'] || keys['a'];
    let right = keys['ArrowRight'] || keys['d'];
    if (controlsReversed) { [left, right] = [right, left]; }

    const moveSpeed = 4 * speedMultiplier;
    if (left) { player.vx = -moveSpeed; player.facingRight = false; }
    else if (right) { player.vx = moveSpeed; player.facingRight = true; }
    else player.vx *= 0.85;

    if ((keys[' '] || keys['ArrowUp'] || keys['w']) && player.grounded) {
      player.vy = -Math.max(10, TILE * 0.28);
      player.grounded = false;
      // small jump particles
      for (let i=0;i<4;i++) addParticle(player.x + player.w/2, player.y + player.h, (Math.random()-0.5)*2, -Math.random()*2 - 1, 'rgba(255,120,80,1)', 20);
    }

    // gravity & motion
    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;

    // platform collision
    player.grounded = false;
    for (const p of platforms) {
      if (!p.visible) continue;
      if (player.x + player.w > p.x && player.x < p.x + p.w && player.y + player.h > p.y && player.y < p.y + p.h) {
        if (player.vy > 0 && (player.y + player.h) - player.vy <= p.y + 8) {
          // land
          player.y = p.y - player.h;
          player.vy = 0;
          player.grounded = true;
        } else {
          // side collision
          if (player.vx > 0) player.x = p.x - player.w;
          else if (player.vx < 0) player.x = p.x + p.w;
          player.vx = 0;
        }
      }
    }

    // world bounds
    const cw = canvas.width / DPR, ch = canvas.height / DPR;
    player.x = clamp(player.x, 0, Math.max(0, cw - player.w));
    if (player.y > ch + 100) { // fell out
      loseLifeOrRespawn();
    }

    // enemies
    for (const e of enemies) {
      e.x += e.vx * (gameState.difficulty === 'easy' ? 0.8 : 1);
      if (e.x < 0 || e.x > cw - e.w) e.vx *= -1;
      // collision
      if (rectColl(player, e)) {
        // hit: respawn or lose life
        for (let i=0;i<10;i++) addParticle(player.x + player.w/2, player.y + player.h/2, (Math.random()-0.5)*6, (Math.random()-0.5)*6, 'rgba(255,40,0,1)', 40);
        loseLifeOrRespawn();
        break;
      }
    }

    // dots collect
    for (const d of dots) {
      if (!d.collected && Math.hypot((d.x - (player.x + player.w/2)), (d.y - (player.y + player.h/2))) < d.r + Math.max(player.w, player.h)/3) {
        d.collected = true;
        gameState.score += (gameState.difficulty === 'easy' ? 10 : gameState.difficulty === 'medium' ? 15 : 25);
        scoreLabel.textContent = gameState.score;
        const collected = dots.filter(x => x.collected).length;
        dotsLabel.textContent = collected;
        // collect particles
        for (let i=0;i<8;i++) addParticle(d.x, d.y, (Math.random()-0.5)*6, (Math.random()-0.5)*6, 'rgba(255,240,120,1)', 30);
      }
    }

    // exit check (requires all dots)
    const allCollected = dots.length && dots.every(d => d.collected);
    if (allCollected && rectColl(player, exitObj)) {
      levelComplete();
    }

    updateParticles();
  }

  function loseLifeOrRespawn() {
    gameState.lives--;
    livesLabel.textContent = gameState.lives;
    if (gameState.lives <= 0) {
      // game over
      finalScore.textContent = gameState.score;
      showOverlay(gameOverOverlay);
      gameState.playing = false;
    } else {
      // respawn current level
      loadLevel(gameState.level);
    }
  }

  // -- Game flow helpers
  function startGame() {
    gameState.score = 0; gameState.lives = 3; gameState.level = 1; gameState.difficulty = 'easy';
    menu.style.display = 'none';
    gameState.playing = true;
    startLevel(1);
    runLoop();
  }

  function startLevel(n) {
    gameState.level = n;
    loadLevel(n);
    gameState.playing = true;
  }

  function nextLevel() {
    gameState.level = Math.min(LEVELS.length, gameState.level + 1);
    startLevel(gameState.level);
  }

  function showMainMenu() {
    menu.style.display = 'flex';
    gameState.playing = false;
  }

  function showOverlay(el) { el.classList.remove('hidden'); }
  function hideOverlay(el) { el.classList.add('hidden'); }

  function showToast(txt, tms = 1800) {
    message.textContent = txt; message.classList.remove('hidden');
    setTimeout(()=> message.classList.add('hidden'), tms);
  }

  // Level select UI
  function showLevelSelect(){
    levelSelectModal.innerHTML = '';
    levelSelectModal.classList.remove('hidden');
    const box = document.createElement('div');
    box.className = 'card';
    box.innerHTML = '<h3>Select Level</h3>';
    const grid = document.createElement('div');
    grid.style.display='flex'; grid.style.flexWrap='wrap'; grid.style.gap='8px'; grid.style.justifyContent='center';
    LEVELS.forEach((_,i) => {
      const b = document.createElement('button'); b.textContent = 'L '+(i+1);
      b.onclick = () => { levelSelectModal.classList.add('hidden'); startLevel(i+1); };
      grid.appendChild(b);
    });
    box.appendChild(grid);
    const close = document.createElement('button'); close.textContent = 'Close'; close.onclick = ()=> levelSelectModal.classList.add('hidden');
    box.appendChild(close);
    levelSelectModal.appendChild(box);
  }

  function showInstructions() {
    instructionsModal.innerHTML = '';
    instructionsModal.classList.remove('hidden');
    const box = document.createElement('div'); box.className='card';
    box.innerHTML = `<h3>Instructions</h3>
      <p>← → or A D: move • Space / W / ↑: jump</p>
      <p>Collect all dots then reach the exit. Harder levels add enemies & surprises.</p>`;
    const close = document.createElement('button'); close.textContent = 'Close'; close.onclick = ()=> instructionsModal.classList.add('hidden');
    box.appendChild(close); instructionsModal.appendChild(box);
  }

  function levelComplete() {
    gameState.playing = false;
    gameState.score += 100;
    levelScore.textContent = gameState.score;
    showOverlay(levelCompleteOverlay);
  }

  // -- Main loop
  function runLoop() {
    if (!gameState.playing) return;
    update();
    render();
    requestAnimationFrame(runLoop);
  }

  // initial main menu show
  showMainMenu();

  // expose small API for debugging (optional)
  window.NEON = { startGame, startLevel, LEVELS };

})();
