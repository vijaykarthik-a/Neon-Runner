// Ultimate Neon Runner - Advanced JavaScript
class NeonRunner {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = {
            currentLevel: 1,
            score: 0,
            lives: 3,
            playing: false,
            difficulty: 'easy',
            unlockedLevels: 1,
            completedLevels: new Set()
        };
        
        this.TILE_SIZE = 30;
        this.PLAYER_SIZE = 24;
        this.DOT_SIZE = 10;
        
        this.player = { x: 0, y: 0, vx: 0, vy: 0, grounded: false, facingRight: true };
        this.dots = [];
        this.enemies = [];
        this.platforms = [];
        this.exit = { x: 0, y: 0 };
        this.keys = {};
        this.animFrame = 0;
        this.particles = [];
        
        // Troll effects
        this.controlsReversed = false;
        this.speedMultiplier = 1;
        this.invisiblePlatforms = [];
        this.fakeExits = [];
        
        this.init();
    }
    
    init() {
        this.setupBootSequence();
        this.setupEventListeners();
        this.createLevelSets();
        this.createTrollMessages();
    }
    
    setupBootSequence() {
        setTimeout(() => {
            const bootScreen = document.getElementById('bootScreen');
            if (bootScreen) {
                bootScreen.style.opacity = '0';
                bootScreen.style.transition = 'opacity 1s';
                setTimeout(() => {
                    bootScreen.style.display = 'none';
                    this.createAmbientParticles();
                }, 1000);
            }
        }, 6000);
    }
    
    createAmbientParticles() {
        const container = document.querySelector('.ambient-particles');
        if (container) {
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: absolute;
                    width: 2px;
                    height: 2px;
                    background: #ff0000;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #ff0000;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    animation: particleFloat ${15 + Math.random() * 10}s linear infinite;
                    animation-delay: ${Math.random() * 15}s;
                `;
                container.appendChild(particle);
            }
        }
    }
    
    createLevelSets() {
        this.levelSets = {
            easy: [
                { platforms: [[0,20,32,1],[8,16,16,1],[4,12,8,1],[20,12,8,1],[12,8,8,1]], enemies: [], dots: 3, startX: 2, startY: 18, exitX: 28, exitY: 6 },
                { platforms: [[0,20,32,1],[6,16,6,1],[18,16,6,1],[10,12,12,1],[6,8,20,1]], enemies: [[14,15,0.5]], dots: 4, startX: 2, startY: 18, exitX: 22, exitY: 6 },
                { platforms: [[0,20,32,1],[4,16,8,1],[14,14,8,1],[24,12,6,1],[8,8,16,1]], enemies: [[6,15,0.5],[16,13,0.5]], dots: 4, startX: 2, startY: 18, exitX: 20, exitY: 6 },
                { platforms: [[0,20,32,1],[5,16,5,1],[12,14,8,1],[22,12,6,1],[8,8,6,1],[18,6,10,1]], enemies: [[7,15,0.5],[14,13,0.5]], dots: 5, startX: 2, startY: 18, exitX: 24, exitY: 4 },
                { platforms: [[0,20,32,1],[3,16,6,1],[15,14,6,1],[25,12,5,1],[10,10,12,1],[6,6,20,1]], enemies: [[5,15,0.5],[17,13,0.5],[27,11,0.5]], dots: 5, startX: 2, startY: 18, exitX: 22, exitY: 4 }
            ],
            medium: [
                { platforms: [[0,20,32,1],[6,16,8,1],[18,14,8,1],[10,12,4,1],[20,10,4,1],[14,8,4,1]], enemies: [[8,15,1],[20,13,1]], dots: 5, startX: 2, startY: 18, exitX: 16, exitY: 6 },
                { platforms: [[0,20,32,1],[4,16,6,1],[14,14,6,1],[24,12,6,1],[8,10,4,1],[18,8,4,1],[28,6,4,1]], enemies: [[6,15,1],[16,13,1],[26,11,1]], dots: 6, startX: 2, startY: 18, exitX: 30, exitY: 4 },
                { platforms: [[0,20,32,1],[5,16,4,1],[13,14,4,1],[21,12,4,1],[29,10,3,1],[9,8,4,1],[17,6,4,1],[25,4,4,1]], enemies: [[7,15,1],[15,13,1],[23,11,1],[11,7,1],[19,5,1]], dots: 7, startX: 2, startY: 18, exitX: 27, exitY: 2 },
                { platforms: [[0,20,32,1],[3,16,5,1],[12,14,5,1],[21,12,5,1],[30,10,2,1],[7,8,5,1],[16,6,5,1],[25,4,5,1]], enemies: [[5,15,1],[14,13,1],[23,11,1],[9,7,1],[18,5,1],[27,3,1]], dots: 8, startX: 2, startY: 18, exitX: 27, exitY: 2 },
                { platforms: [[0,20,32,1],[6,16,3,1],[12,14,3,1],[18,12,3,1],[24,10,3,1],[30,8,2,1],[9,6,3,1],[15,4,3,1],[21,2,3,1]], enemies: [[7,15,1],[13,13,1],[19,11,1],[25,9,1],[10,5,1],[16,3,1],[22,1,1]], dots: 9, startX: 2, startY: 18, exitX: 22, exitY: 0 }
            ],
            hard: [
                { platforms: [[0,20,32,1],[8,16,16,1],[4,12,8,1],[20,12,8,1],[12,8,8,1]], enemies: [[10,15,1.5],[22,11,1.5]], dots: 5, startX: 2, startY: 18, exitX: 28, exitY: 6, trolls: ['reverse'] },
                { platforms: [[0,20,32,1],[6,16,6,1],[18,16,6,1],[10,12,12,1],[6,8,20,1]], enemies: [[14,15,1.5],[8,7,1.5]], dots: 6, startX: 2, startY: 18, exitX: 22, exitY: 6, trolls: ['speed'] },
                { platforms: [[0,20,32,1],[4,16,8,1],[14,14,8,1],[24,12,6,1],[8,8,16,1]], enemies: [[6,15,1.5],[16,13,1.5],[26,11,1.5]], dots: 6, startX: 2, startY: 18, exitX: 20, exitY: 6, trolls: ['invisible'] },
                { platforms: [[0,20,32,1],[5,16,5,1],[12,14,8,1],[22,12,6,1],[8,8,6,1],[18,6,10,1]], enemies: [[7,15,1.5],[14,13,1.5],[24,11,1.5]], dots: 7, startX: 2, startY: 18, exitX: 24, exitY: 4, trolls: ['fake_exit'] },
                { platforms: [[0,20,32,1],[3,16,6,1],[15,14,6,1],[25,12,5,1],[10,10,12,1],[6,6,20,1]], enemies: [[5,15,1.5],[17,13,1.5],[27,11,1.5],[16,9,1.5]], dots: 7, startX: 2, startY: 18, exitX: 22, exitY: 4, trolls: ['reverse', 'speed'] }
            ]
        };
    }
    
    createTrollMessages() {
        this.trollMessages = [
            "😈 SURPRISE! INVISIBLE PLATFORM!",
            "🎭 PLOT TWIST: FAKE EXIT!",
            "👻 GHOST ENEMY APPEARED!",
            "🔄 CONTROLS REVERSED!",
            "⚡ SPEED BOOST... OR IS IT?",
            "🎪 WELCOME TO TROLL LAND!",
            "🤡 DID YOU EXPECT FAIR PLAY?",
            "🎯 GOOD LUCK WITH THAT!",
            "🌪️ GRAVITY FLIP INCOMING!",
            "🎲 RANDOM TELEPORT ACTIVATED!"
        ];
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    showMainMenu() {
        this.hideAllMenus();
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) mainMenu.classList.remove('hidden');
        this.gameState.playing = false;
    }
    
    showDifficultySelect() {
        this.hideAllMenus();
        const difficultySelect = document.getElementById('difficultySelect');
        if (difficultySelect) difficultySelect.classList.remove('hidden');
    }
    
    showLevelSelect() {
        this.hideAllMenus();
        const levelSelect = document.getElementById('levelSelect');
        if (levelSelect) levelSelect.classList.remove('hidden');
        this.populateLevelGrid();
    }
    
    showInstructions() {
        const modal = document.createElement('div');
        modal.className = 'instructions-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>INSTRUCTIONS</h2>
                <div class="instructions-grid">
                    <div class="instruction-item">
                        <div class="key-display">←→</div>
                        <div>MOVE LEFT/RIGHT</div>
                    </div>
                    <div class="instruction-item">
                        <div class="key-display">SPACE</div>
                        <div>JUMP</div>
                    </div>
                    <div class="instruction-item">
                        <div class="key-display">🔴</div>
                        <div>COLLECT ALL DOTS</div>
                    </div>
                    <div class="instruction-item">
                        <div class="key-display">⚠️</div>
                        <div>AVOID ENEMIES</div>
                    </div>
                    <div class="instruction-item">
                        <div class="key-display">🚪</div>
                        <div>REACH THE EXIT</div>
                    </div>
                </div>
                <div class="warning-text">⚠️ HARD MODE HAS SURPRISES!</div>
                <button onclick="this.parentElement.parentElement.remove()" class="close-btn">CLOSE</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    goBack() {
        window.history.back();
    }
    
    hideAllMenus() {
        const menus = ['mainMenu', 'difficultySelect', 'levelSelect', 'gameScreen', 'gameOver', 'levelComplete'];
        menus.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });
    }
    
    populateLevelGrid() {
        const grid = document.getElementById('levelGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let i = 1; i <= 5; i++) {
            const btn = document.createElement('div');
            btn.className = 'level-btn';
            btn.textContent = i;
            
            if (i <= this.gameState.unlockedLevels) {
                btn.onclick = () => {
                    this.gameState.currentLevel = i;
                    this.startGame(this.gameState.difficulty);
                };
                
                if (this.gameState.completedLevels.has(i)) {
                    btn.classList.add('completed');
                }
            } else {
                btn.classList.add('locked');
            }
            
            grid.appendChild(btn);
        }
    }
    
    startGame(difficulty) {
        this.gameState.difficulty = difficulty;
        this.gameState.playing = true;
        
        if (!document.getElementById('gameScreen')) {
            this.createGameScreen();
        }
        
        this.hideAllMenus();
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) gameScreen.classList.remove('hidden');
        
        this.loadLevel(this.gameState.currentLevel);
        this.gameLoop();
    }
    
    createGameScreen() {
        const gameScreen = document.createElement('div');
        gameScreen.id = 'gameScreen';
        gameScreen.className = 'game-screen';
        gameScreen.innerHTML = `
            <div class="hud">
                <div class="hud-item">LEVEL: <span id="levelNum">1</span></div>
                <div class="hud-item">SCORE: <span id="score">0</span></div>
                <div class="hud-item">LIVES: <span id="lives">3</span></div>
                <div class="hud-item">DOTS: <span id="dots">0</span>/<span id="totalDots">0</span></div>
                <div class="hud-item">MODE: <span id="difficultyMode">EASY</span></div>
            </div>
            <canvas id="gameCanvas" width="1100" height="700" class="game-canvas"></canvas>
            <div id="trollMessage" class="troll-message"></div>
            <button class="pause-btn" onclick="game.showMainMenu()">⏸️ MENU</button>
        `;
        
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) gameContainer.appendChild(gameScreen);
        
        this.canvas = document.getElementById('gameCanvas');
        if (this.canvas) this.ctx = this.canvas.getContext('2d');
    }
    
    loadLevel(levelNum) {
        const levelData = this.levelSets[this.gameState.difficulty][levelNum - 1];
        if (!levelData) {
            console.error('Level not found:', levelNum);
            return;
        }
        
        this.platforms = [];
        this.dots = [];
        this.enemies = [];
        this.particles = [];
        this.fakeExits = [];
        this.invisiblePlatforms = [];
        
        this.controlsReversed = false;
        this.speedMultiplier = 1;
        
        levelData.platforms.forEach(([x, y, w, h]) => {
            this.platforms.push({ x: x * this.TILE_SIZE, y: y * this.TILE_SIZE, w: w * this.TILE_SIZE, h: h * this.TILE_SIZE });
        });
        
        levelData.enemies.forEach(([x, y, speed]) => {
            this.enemies.push({ 
                x: x * this.TILE_SIZE, 
                y: y * this.TILE_SIZE, 
                vx: speed, 
                w: this.PLAYER_SIZE, 
                h: this.PLAYER_SIZE,
                direction: 1
            });
        });
        
        for (let i = 0; i < levelData.dots; i++) {
            let x, y, attempts = 0;
            do {
                x = Math.random() * (this.canvas.width - this.DOT_SIZE);
                y = Math.random() * (this.canvas.height - this.DOT_SIZE);
                attempts++;
            } while (this.isColliding({ x, y, w: this.DOT_SIZE, h: this.DOT_SIZE }) && attempts < 100);
            
            this.dots.push({ x, y, collected: false });
        }
        
        this.player.x = levelData.startX * this.TILE_SIZE;
        this.player.y = levelData.startY * this.TILE_SIZE;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.grounded = false;
        
        this.exit.x = levelData.exitX * this.TILE_SIZE;
        this.exit.y = levelData.exitY * this.TILE_SIZE;
        
        if (this.gameState.difficulty === 'hard' && levelData.trolls) {
            this.applyTrollEffects(levelData.trolls);
        }
        
        const levelNumEl = document.getElementById('levelNum');
        const difficultyModeEl = document.getElementById('difficultyMode');
        const totalDotsEl = document.getElementById('totalDots');
        
        if (levelNumEl) levelNumEl.textContent = levelNum;
        if (difficultyModeEl) difficultyModeEl.textContent = this.gameState.difficulty.toUpperCase();
        if (totalDotsEl) totalDotsEl.textContent = levelData.dots;
        
        this.updateHUD();
    }
    
    applyTrollEffects(trolls) {
        trolls.forEach(troll => {
            switch(troll) {
                case 'reverse':
                    setTimeout(() => {
                        this.controlsReversed = true;
                        this.showTrollMessage("🔄 CONTROLS REVERSED!");
                        setTimeout(() => { this.controlsReversed = false; }, 5000);
                    }, 3000);
                    break;
                    
                case 'speed':
                    setTimeout(() => {
                        this.speedMultiplier = 2;
                        this.showTrollMessage("⚡ SPEED BOOST!");
                        setTimeout(() => { this.speedMultiplier = 1; }, 4000);
                    }, 2000);
                    break;
                    
                case 'invisible':
                    setTimeout(() => {
                        const randomPlatform = this.platforms[Math.floor(Math.random() * this.platforms.length)];
                        this.invisiblePlatforms.push(randomPlatform);
                        this.showTrollMessage("👻 INVISIBLE PLATFORM!");
                        setTimeout(() => { 
                            this.invisiblePlatforms = this.invisiblePlatforms.filter(p => p !== randomPlatform); 
                        }, 6000);
                    }, 4000);
                    break;
                    
                case 'fake_exit':
                    const fakeExit = {
                        x: this.exit.x + (Math.random() - 0.5) * 200,
                        y: this.exit.y + (Math.random() - 0.5) * 100
                    };
                    this.fakeExits.push(fakeExit);
                    setTimeout(() => {
                        this.showTrollMessage("🎭 FAKE EXIT DETECTED!");
                    }, 1000);
                    break;
            }
        });
    }
    
    showTrollMessage(message) {
        const trollDiv = document.getElementById('trollMessage');
        if (trollDiv) {
            trollDiv.textContent = message;
            trollDiv.style.display = 'block';
            setTimeout(() => {
                trollDiv.style.display = 'none';
            }, 3000);
        }
    }
    
    gameLoop() {
        if (!this.gameState.playing) return;
        
        this.update();
        this.render();
        this.animFrame++;
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        const moveSpeed = 5 * this.speedMultiplier;
        const jumpPower = 12;
        
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.player.vx = this.controlsReversed ? moveSpeed : -moveSpeed;
            this.player.facingRight = this.controlsReversed;
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            this.player.vx = this.controlsReversed ? -moveSpeed : moveSpeed;
            this.player.facingRight = !this.controlsReversed;
        } else {
            this.player.vx *= 0.8;
        }
        
        if ((this.keys[' '] || this.keys['ArrowUp'] || this.keys['w']) && this.player.grounded) {
            this.player.vy = -jumpPower;
            this.player.grounded = false;
        }
        
        this.player.vy += 0.8;
        
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        this.player.grounded = false;
        this.platforms.forEach(platform => {
            if (this.checkCollision(this.player, platform)) {
                if (this.player.vy > 0 && this.player.y < platform.y) {
                    this.player.y = platform.y - this.PLAYER_SIZE;
                    this.player.vy = 0;
                    this.player.grounded = true;
                } else if (this.player.vy < 0 && this.player.y > platform.y) {
                    this.player.y = platform.y + platform.h;
                    this.player.vy = 0;
                } else if (this.player.vx > 0) {
                    this.player.x = platform.x - this.PLAYER_SIZE;
                } else if (this.player.vx < 0) {
                    this.player.x = platform.x + platform.w;
                }
            }
        });
        
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width - this.PLAYER_SIZE) {
            this.player.x = this.canvas.width - this.PLAYER_SIZE;
        }
        if (this.player.y > this.canvas.height) {
            this.loseLife();
        }
        
        this.enemies.forEach(enemy => {
            enemy.x += enemy.vx * enemy.direction;
            
            let onPlatform = false;
            this.platforms.forEach(platform => {
                if (enemy.y + enemy.h >= platform.y && enemy.y + enemy.h <= platform.y + platform.h + 5 &&
                    enemy.x + enemy.w > platform.x && enemy.x < platform.x + platform.w) {
                    onPlatform = true;
                }
            });
            
            if (!onPlatform || enemy.x <= 0 || enemy.x >= this.canvas.width - enemy.w) {
                enemy.direction *= -1;
            }
            
            if (this.checkCollision(this.player, enemy)) {
                this.loseLife();
            }
        });
        
        this.dots.forEach(dot => {
            if (!dot.collected && this.checkCollision(this.player, { x: dot.x, y: dot.y, w: this.DOT_SIZE, h: this.DOT_SIZE })) {
                dot.collected = true;
                this.gameState.score += 10;
                this.updateHUD();
            }
        });
        
        const collectedDots = this.dots.filter(dot => dot.collected).length;
        if (collectedDots === this.dots.length && 
            this.checkCollision(this.player, { x: this.exit.x, y: this.exit.y, w: this.TILE_SIZE, h: this.TILE_SIZE })) {
            this.levelComplete();
        }
        
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            return particle.life > 0;
        });
    }
    
    render() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 10;
        this.platforms.forEach(platform => {
            if (!this.invisiblePlatforms.includes(platform)) {
                this.ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
            }
        });
        
        this.ctx.fillStyle = '#ff4444';
        this.dots.forEach(dot => {
            if (!dot.collected) {
                this.ctx.beginPath();
                this.ctx.arc(dot.x + this.DOT_SIZE/2, dot.y + this.DOT_SIZE/2, this.DOT_SIZE/2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.fillStyle = '#ff6666';
        this.enemies.forEach(enemy => {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
        });
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.shadowColor = '#00ff00';
        this.ctx.fillRect(this.exit.x, this.exit.y, this.TILE_SIZE, this.TILE_SIZE);
        
        this.fakeExits.forEach(fakeExit => {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.shadowColor = '#ffff00';
            this.ctx.fillRect(fakeExit.x, fakeExit.y, this.TILE_SIZE, this.TILE_SIZE);
        });
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ffffff';
        this.ctx.fillRect(this.player.x, this.player.y, this.PLAYER_SIZE, this.PLAYER_SIZE);
        
        this.ctx.fillStyle = '#ff0000';
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillRect(particle.x, particle.y, 2, 2);
        });
        this.ctx.globalAlpha = 1;
        
        this.ctx.shadowBlur = 0;
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.w &&
               rect1.x + this.PLAYER_SIZE > rect2.x &&
               rect1.y < rect2.y + rect2.h &&
               rect1.y + this.PLAYER_SIZE > rect2.y;
    }
    
    isColliding(rect) {
        return this.platforms.some(platform => 
            rect.x < platform.x + platform.w &&
            rect.x + rect.w > platform.x &&
            rect.y < platform.y + platform.h &&
            rect.y + rect.h > platform.y
        );
    }
    
    updateHUD() {
        const scoreEl = document.getElementById('score');
        const livesEl = document.getElementById('lives');
        const dotsEl = document.getElementById('dots');
        
        if (scoreEl) scoreEl.textContent = this.gameState.score;
        if (livesEl) livesEl.textContent = this.gameState.lives;
        if (dotsEl) {
            const collectedDots = this.dots.filter(dot => dot.collected).length;
            dotsEl.textContent = collectedDots;
        }
    }
    
    loseLife() {
        this.gameState.lives--;
        this.updateHUD();
        
        if (this.gameState.lives <= 0) {
            this.gameOver();
        } else {
            this.showRetryPopup();
        }
    }
    
    showRetryPopup() {
        this.gameState.playing = false;
        
        const modal = document.createElement('div');
        modal.className = 'retry-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>OOPS!</h2>
                <p>You lost a life! Lives remaining: ${this.gameState.lives}</p>
                <div class="modal-buttons">
                    <button onclick="game.retryLevel(); this.parentElement.parentElement.parentElement.remove();" class="retry-btn">RETRY LEVEL</button>
                    <button onclick="game.showMainMenu(); this.parentElement.parentElement.parentElement.remove();" class="menu-btn">MAIN MENU</button>
                </div>
            </div>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                this.showMainMenu();
            }
        });
        
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                this.showMainMenu();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        document.body.appendChild(modal);
    }
    
    retryLevel() {
        this.gameState.playing = true;
        this.loadLevel(this.gameState.currentLevel);
        this.gameLoop();
    }
    
    levelComplete() {
        this.gameState.playing = false;
        this.gameState.completedLevels.add(this.gameState.currentLevel);
        this.gameState.score += 100;
        
        if (this.gameState.currentLevel >= this.gameState.unlockedLevels) {
            this.gameState.unlockedLevels = Math.min(5, this.gameState.currentLevel + 1);
        }
        
        const modal = document.createElement('div');
        modal.className = 'level-complete-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>LEVEL COMPLETE!</h2>
                <p>Score: ${this.gameState.score}</p>
                <div class="modal-buttons">
                    ${this.gameState.currentLevel < 5 ? 
                        `<button onclick="game.nextLevel(); this.parentElement.parentElement.parentElement.remove();" class="next-btn">NEXT LEVEL</button>` : 
                        `<p>🎉 ALL LEVELS COMPLETED! 🎉</p>`
                    }
                    <button onclick="game.showLevelSelect(); this.parentElement.parentElement.parentElement.remove();" class="select-btn">LEVEL SELECT</button>
                    <button onclick="game.showMainMenu(); this.parentElement.parentElement.parentElement.remove();" class="menu-btn">MAIN MENU</button>
                </div>
            </div>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                this.showMainMenu();
            }
        });
        
        document.body.appendChild(modal);
    }
    
    nextLevel() {
        if (this.gameState.currentLevel < 5) {
            this.gameState.currentLevel++;
            this.startGame(this.gameState.difficulty);
        }
    }
    
    gameOver() {
        this.gameState.playing = false;
        
        const modal = document.createElement('div');
        modal.className = 'game-over-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>GAME OVER</h2>
                <p>Final Score: ${this.gameState.score}</p>
                <p>Level Reached: ${this.gameState.currentLevel}</p>
                <div class="modal-buttons">
                    <button onclick="game.restartGame(); this.parentElement.parentElement.parentElement.remove();" class="restart-btn">RESTART</button>
                    <button onclick="game.showMainMenu(); this.parentElement.parentElement.parentElement.remove();" class="menu-btn">MAIN MENU</button>
                </div>
            </div>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                this.showMainMenu();
            }
        });
        
        document.body.appendChild(modal);
    }
    
    restartGame() {
        this.gameState.currentLevel = 1;
        this.gameState.score = 0;
        this.gameState.lives = 3;
        this.startGame(this.gameState.difficulty);
    }
}

// Initialize the game
const game = new NeonRunner();

// Global functions for HTML onclick events
function showMainMenu() { game.showMainMenu(); }
function showDifficultySelect() { game.showDifficultySelect(); }
function showLevelSelect() { game.showLevelSelect(); }
function showInstructions() { game.showInstructions(); }
function goBack() { game.goBack(); }
function startGame(difficulty) { game.startGame(difficulty); }
