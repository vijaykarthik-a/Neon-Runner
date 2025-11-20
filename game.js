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
            document.getElementById('bootScreen').style.opacity = '0';
            document.getElementById('bootScreen').style.transition = 'opacity 1s';
            setTimeout(() => {
                document.getElementById('bootScreen').style.display = 'none';
                this.createAmbientParticles();
            }, 1000);
        }, 6000);
    }
    
    createAmbientParticles() {
        const container = document.querySelector('.ambient-particles');
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
    
    createLevelSets() {
        this.levelSets = {
            easy: [
                // Levels 1-19 for Easy mode
                { platforms: [[0,20,32,1],[8,16,16,1],[4,12,8,1],[20,12,8,1],[12,8,8,1]], enemies: [], dots: 3, startX: 2, startY: 18, exitX: 28, exitY: 6 },
                { platforms: [[0,20,32,1],[6,16,6,1],[18,16,6,1],[10,12,12,1],[6,8,20,1]], enemies: [[14,15,0.5]], dots: 4, startX: 2, startY: 18, exitX: 22, exitY: 6 },
                { platforms: [[0,20,32,1],[4,16,8,1],[14,14,8,1],[24,12,6,1],[8,8,16,1]], enemies: [[6,15,0.5],[16,13,0.5]], dots: 4, startX: 2, startY: 18, exitX: 20, exitY: 6 },
                { platforms: [[0,20,32,1],[5,16,5,1],[12,14,8,1],[22,12,6,1],[8,8,6,1],[18,6,10,1]], enemies: [[7,15,0.5],[14,13,0.5]], dots: 5, startX: 2, startY: 18, exitX: 24, exitY: 4 },
                { platforms: [[0,20,32,1],[3,16,6,1],[15,14,6,1],[25,12,5,1],[10,10,12,1],[6,6,20,1]], enemies: [[5,15,0.5],[17,13,0.5],[27,11,0.5]], dots: 5, startX: 2, startY: 18, exitX: 22, exitY: 4 },
                { platforms: [[0,20,32,1],[6,16,4,1],[14,14,4,1],[22,12,4,1],[8,10,4,1],[16,8,4,1],[24,6,4,1]], enemies: [[8,15,0.5],[16,13,0.5],[24,11,0.5]], dots: 6, startX: 2, startY: 18, exitX: 26, exitY: 4 },
                { platforms: [[0,20,32,1],[4,16,6,1],[16,14,6,1],[26,12,4,1],[10,10,6,1],[20,8,8,1]], enemies: [[6,15,0.5],[18,13,0.5],[28,11,0.5],[12,9,0.5]], dots: 6, startX: 2, startY: 18, exitX: 24, exitY: 6 },
                { platforms: [[0,20,32,1],[8,16,8,1],[20,14,8,1],[6,12,6,1],[18,10,6,1],[12,8,8,1]], enemies: [[10,15,0.5],[22,13,0.5],[8,11,0.5],[20,9,0.5]], dots: 7, startX: 2, startY: 18, exitX: 16, exitY: 6 },
                { platforms: [[0,20,32,1],[5,16,4,1],[13,14,4,1],[21,12,4,1],[29,10,3,1],[9,8,4,1],[17,6,4,1]], enemies: [[7,15,0.5],[15,13,0.5],[23,11,0.5],[11,7,0.5]], dots: 7, startX: 2, startY: 18, exitX: 19, exitY: 4 },
                { platforms: [[0,20,32,1],[6,16,6,1],[18,14,6,1],[8,12,4,1],[20,10,4,1],[12,8,8,1],[4,6,24,1]], enemies: [[8,15,0.5],[20,13,0.5],[10,11,0.5],[22,9,0.5]], dots: 8, startX: 2, startY: 18, exitX: 24, exitY: 4 },
                { platforms: [[0,20,32,1],[4,16,4,1],[12,14,4,1],[20,12,4,1],[28,10,4,1],[8,8,4,1],[16,6,4,1],[24,4,4,1]], enemies: [[6,15,0.5],[14,13,0.5],[22,11,0.5],[30,9,0.5],[10,7,0.5]], dots: 8, startX: 2, startY: 18, exitX: 26, exitY: 2 },
                { platforms: [[0,20,32,1],[7,16,6,1],[19,14,6,1],[5,12,6,1],[17,10,6,1],[11,8,10,1],[6,6,20,1]], enemies: [[9,15,0.5],[21,13,0.5],[7,11,0.5],[19,9,0.5],[15,7,0.5]], dots: 9, startX: 2, startY: 18, exitX: 22, exitY: 4 },
                { platforms: [[0,20,32,1],[8,16,4,1],[16,14,4,1],[24,12,4,1],[6,10,4,1],[14,8,4,1],[22,6,4,1],[30,4,2,1]], enemies: [[10,15,0.5],[18,13,0.5],[26,11,0.5],[8,9,0.5],[16,7,0.5],[24,5,0.5]], dots: 9, startX: 2, startY: 18, exitX: 31, exitY: 2 },
                { platforms: [[0,20,32,1],[5,16,5,1],[15,14,5,1],[25,12,5,1],[10,10,5,1],[20,8,5,1],[8,6,16,1]], enemies: [[7,15,0.5],[17,13,0.5],[27,11,0.5],[12,9,0.5],[22,7,0.5],[14,5,0.5]], dots: 10, startX: 2, startY: 18, exitX: 20, exitY: 4 },
                { platforms: [[0,20,32,1],[6,16,4,1],[14,14,4,1],[22,12,4,1],[30,10,2,1],[10,8,4,1],[18,6,4,1],[26,4,4,1]], enemies: [[8,15,0.5],[16,13,0.5],[24,11,0.5],[12,7,0.5],[20,5,0.5],[28,3,0.5]], dots: 10, startX: 2, startY: 18, exitX: 28, exitY: 2 },
                { platforms: [[0,20,32,1],[4,16,6,1],[16,14,6,1],[26,12,4,1],[8,10,6,1],[20,8,6,1],[12,6,8,1]], enemies: [[6,15,0.5],[18,13,0.5],[28,11,0.5],[10,9,0.5],[22,7,0.5],[16,5,0.5]], dots: 11, startX: 2, startY: 18, exitX: 16, exitY: 4 },
                { platforms: [[0,20,32,1],[7,16,3,1],[14,14,3,1],[21,12,3,1],[28,10,3,1],[11,8,3,1],[18,6,3,1],[25,4,3,1]], enemies: [[8,15,0.5],[15,13,0.5],[22,11,0.5],[29,9,0.5],[12,7,0.5],[19,5,0.5],[26,3,0.5]], dots: 11, startX: 2, startY: 18, exitX: 26, exitY: 2 },
                { platforms: [[0,20,32,1],[5,16,4,1],[13,14,4,1],[21,12,4,1],[29,10,3,1],[9,8,4,1],[17,6,4,1],[25,4,4,1]], enemies: [[7,15,0.5],[15,13,0.5],[23,11,0.5],[11,7,0.5],[19,5,0.5],[27,3,0.5]], dots: 12, startX: 2, startY: 18, exitX: 27, exitY: 2 },
                { platforms: [[0,20,32,1],[6,16,6,1],[18,14,6,1],[8,12,4,1],[20,10,4,1],[12,8,8,1],[4,6,24,1],[14,4,4,1]], enemies: [[8,15,0.5],[20,13,0.5],[10,11,0.5],[22,9,0.5],[16,7,0.5],[16,3,0.5]], dots: 12, startX: 2, startY: 18, exitX: 16, exitY: 2 }
            ],
            medium: [
                // Levels 1-19 for Medium mode - more challenging
                { platforms: [[0,20,32,1],[6,16,8,1],[18,14,8,1],[10,12,4,1],[20,10,4,1],[14,8,4,1]], enemies: [[8,15,1],[20,13,1]], dots: 5, startX: 2, startY: 18, exitX: 16, exitY: 6 },
                { platforms: [[0,20,32,1],[4,16,6,1],[14,14,6,1],[24,12,6,1],[8,10,4,1],[18,8,4,1],[28,6,4,1]], enemies: [[6,15,1],[16,13,1],[26,11,1]], dots: 6, startX: 2, startY: 18, exitX: 30, exitY: 4 },
                { platforms: [[0,20,32,1],[5,16,4,1],[13,14,4,1],[21,12,4,1],[29,10,3,1],[9,8,4,1],[17,6,4,1],[25,4,4,1]], enemies: [[7,15,1],[15,13,1],[23,11,1],[11,7,1],[19,5,1]], dots: 7, startX: 2, startY: 18, exitX: 27, exitY: 2 },
                { platforms: [[0,20,32,1],[3,16,5,1],[12,14,5,1],[21,12,5,1],[30,10,2,1],[7,8,5,1],[16,6,5,1],[25,4,5,1]], enemies: [[5,15,1],[14,13,1],[23,11,1],[9,7,1],[18,5,1],[27,3,1]], dots: 8, startX: 2, startY: 18, exitX: 27, exitY: 2 },
                { platforms: [[0,20,32,1],[6,16,3,1],[12,14,3,1],[18,12,3,1],[24,10,3,1],[30,8,2,1],[9,6,3,1],[15,4,3,1],[21,2,3,1]], enemies: [[7,15,1],[13,13,1],[19,11,1],[25,9,1],[10,5,1],[16,3,1],[22,1,1]], dots: 9, startX: 2, startY: 18, exitX: 22, exitY: 0 },
                { platforms: [[0,20,32,1],[4,16,4,1],[12,14,4,1],[20,12,4,1],[28,10,4,1],[8,8,4,1],[16,6,4,1],[24,4,4,1]], enemies: [[6,15,1],[14,13,1],[22,11,1],[30,9,1],[10,7,1],[18,5,1],[26,3,1]], dots: 10, startX: 2, startY: 18, exitX: 26, exitY: 2 },
                { platforms: [[0,20,32,1],[5,16,3,1],[11,14,3,1],[17,12,3,1],[23,10,3,1],[29,8,3,1],[8,6,3,1],[14,4,3,1],[20,2,3,1]], enemies: [[6,15,1],[12,13,1],[18,11,1],[24,9,1],[30,7,1],[9,5,1],[15,3,1],[21,1,1]], dots: 11, startX: 2, startY: 18, exitX: 21, exitY: 0 },
                { platforms: [[0,20,32,1],[7,16,4,1],[15,14,4,1],[23,12,4,1],[31,10,1,1],[11,8,4,1],[19,6,4,1],[27,4,4,1]], enemies: [[9,15,1],[17,13,1],[25,11,1],[13,7,1],[21,5,1],[29,3,1]], dots: 12, startX: 2, startY: 18, exitX: 29, exitY: 2 },
                { platforms: [[0,20,32,1],[3,16,4,1],[10,14,4,1],[17,12,4,1],[24,10,4,1],[31,8,1,1],[7,6,4,1],[14,4,4,1],[21,2,4,1]], enemies: [[5,15,1],[12,13,1],[19,11,1],[26,9,1],[9,5,1],[16,3,1],[23,1,1]], dots: 13, startX: 2, startY: 18, exitX: 23, exitY: 0 },
                { platforms: [[0,20,32,1],[6,16,3,1],[12,14,3,1],[18,12,3,1],[24,10,3,1],[30,8,2,1],[9,6,3,1],[15,4,3,1],[21,2,3,1],[27,0,3,1]], enemies: [[7,15,1],[13,13,1],[19,11,1],[25,9,1],[10,5,1],[16,3,1],[22,1,1],[28,-1,1]], dots: 14, startX: 2, startY: 18, exitX: 28, exitY: -2 },
                { platforms: [[0,20,32,1],[4,16,3,1],[9,14,3,1],[14,12,3,1],[19,10,3,1],[24,8,3,1],[29,6,3,1],[7,4,3,1],[12,2,3,1],[17,0,3,1]], enemies: [[5,15,1],[10,13,1],[15,11,1],[20,9,1],[25,7,1],[30,5,1],[8,3,1],[13,1,1],[18,-1,1]], dots: 15, startX: 2, startY: 18, exitX: 18, exitY: -2 },
                { platforms: [[0,20,32,1],[5,16,2,1],[10,14,2,1],[15,12,2,1],[20,10,2,1],[25,8,2,1],[30,6,2,1],[8,4,2,1],[13,2,2,1],[18,0,2,1],[23,-2,2,1]], enemies: [[6,15,1],[11,13,1],[16,11,1],[21,9,1],[26,7,1],[31,5,1],[9,3,1],[14,1,1],[19,-1,1],[24,-3,1]], dots: 16, startX: 2, startY: 18, exitX: 24, exitY: -4 },
                { platforms: [[0,20,32,1],[3,16,3,1],[8,14,3,1],[13,12,3,1],[18,10,3,1],[23,8,3,1],[28,6,3,1],[6,4,3,1],[11,2,3,1],[16,0,3,1],[21,-2,3,1]], enemies: [[4,15,1],[9,13,1],[14,11,1],[19,9,1],[24,7,1],[29,5,1],[7,3,1],[12,1,1],[17,-1,1],[22,-3,1]], dots: 17, startX: 2, startY: 18, exitX: 22, exitY: -4 },
                { platforms: [[0,20,32,1],[6,16,2,1],[10,14,2,1],[14,12,2,1],[18,10,2,1],[22,8,2,1],[26,6,2,1],[30,4,2,1],[8,2,2,1],[12,0,2,1],[16,-2,2,1]], enemies: [[7,15,1],[11,13,1],[15,11,1],[19,9,1],[23,7,1],[27,5,1],[31,3,1],[9,1,1],[13,-1,1],[17,-3,1]], dots: 18, startX: 2, startY: 18, exitX: 17, exitY: -4 },
                { platforms: [[0,20,32,1],[4,16,2,1],[7,14,2,1],[10,12,2,1],[13,10,2,1],[16,8,2,1],[19,6,2,1],[22,4,2,1],[25,2,2,1],[28,0,2,1],[31,-2,1,1]], enemies: [[5,15,1],[8,13,1],[11,11,1],[14,9,1],[17,7,1],[20,5,1],[23,3,1],[26,1,1],[29,-1,1],[31,-3,1]], dots: 19, startX: 2, startY: 18, exitX: 31, exitY: -4 },
                { platforms: [[0,20,32,1],[2,16,2,1],[5,14,2,1],[8,12,2,1],[11,10,2,1],[14,8,2,1],[17,6,2,1],[20,4,2,1],[23,2,2,1],[26,0,2,1],[29,-2,2,1]], enemies: [[3,15,1],[6,13,1],[9,11,1],[12,9,1],[15,7,1],[18,5,1],[21,3,1],[24,1,1],[27,-1,1],[30,-3,1]], dots: 20, startX: 2, startY: 18, exitX: 30, exitY: -4 },
                { platforms: [[0,20,32,1],[3,16,3,1],[8,14,3,1],[13,12,3,1],[18,10,3,1],[23,8,3,1],[28,6,3,1],[6,4,3,1],[11,2,3,1],[16,0,3,1],[21,-2,3,1],[26,-4,3,1]], enemies: [[4,15,1],[9,13,1],[14,11,1],[19,9,1],[24,7,1],[29,5,1],[7,3,1],[12,1,1],[17,-1,1],[22,-3,1],[27,-5,1]], dots: 21, startX: 2, startY: 18, exitX: 27, exitY: -6 },
                { platforms: [[0,20,32,1],[5,16,2,1],[9,14,2,1],[13,12,2,1],[17,10,2,1],[21,8,2,1],[25,6,2,1],[29,4,2,1],[7,2,2,1],[11,0,2,1],[15,-2,2,1],[19,-4,2,1]], enemies: [[6,15,1],[10,13,1],[14,11,1],[18,9,1],[22,7,1],[26,5,1],[30,3,1],[8,1,1],[12,-1,1],[16,-3,1],[20,-5,1]], dots: 22, startX: 2, startY: 18, exitX: 20, exitY: -6 }
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
            "🎲 RANDOM TELEPORT ACTIVATED!",
            "🔥 LAVA FLOOR IS LAVA!",
            "❄️ ICE PHYSICS ENABLED!",
            "🌈 RAINBOW CONFUSION MODE!",
            "🎵 DANCE DANCE REVOLUTION!",
            "🚀 ROCKET BOOST MALFUNCTION!"
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
    
    // Menu Functions
    showMainMenu() {
        this.hideAllMenus();
        document.getElementById('mainMenu').classList.remove('hidden');
        this.gameState.playing = false;
    }
    
    showDifficultySelect() {
        this.hideAllMenus();
        document.getElementById('difficultySelect').classList.remove('hidden');
    }
    
    showLevelSelect() {
        this.hideAllMenus();
        document.getElementById('levelSelect').classList.remove('hidden');
        this.populateLevelGrid();
    }
    
    showInstructions() {
        // Create instructions modal
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
        grid.innerHTML = '';
        
        for (let i = 1; i <= 19; i++) {
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
        
        // Create game screen if it doesn't exist
        if (!document.getElementById('gameScreen')) {
            this.createGameScreen();
        }
        
        this.hideAllMenus();
        document.getElementById('gameScreen').classList.remove('hidden');
        
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
        
        document.getElementById('gameContainer').appendChild(gameScreen);
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
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
