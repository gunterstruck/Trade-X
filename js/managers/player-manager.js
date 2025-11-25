/**
 * Trade-X Player Manager
 * Manages players, their inventories, racks, engines, and turn logic
 */

/**
 * Player Class
 * Represents a single player in the game
 */
class Player {
    constructor(id, name, color, avatarIcon) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.avatarIcon = avatarIcon;
        this.position = 1; // Starting position on board
        this.hand = {}; // Cards in hand (hidden from others)
        this.rack = []; // 5 slots for visible card combinations (max 5 cards)
        this.engines = []; // Built engines (completed buildings)
        this.points = 0; // Victory points
    }

    /**
     * Add cards to hand
     */
    addToHand(resourceKey, amount) {
        if (!this.hand[resourceKey]) {
            this.hand[resourceKey] = 0;
        }
        this.hand[resourceKey] += amount;
    }

    /**
     * Remove cards from hand
     */
    removeFromHand(resourceKey, amount) {
        if (!this.hand[resourceKey] || this.hand[resourceKey] < amount) {
            return false;
        }
        this.hand[resourceKey] -= amount;
        if (this.hand[resourceKey] === 0) {
            delete this.hand[resourceKey];
        }
        return true;
    }

    /**
     * Move card from hand to rack
     */
    moveToRack(resourceKey) {
        if (this.rack.length >= 5) {
            return { success: false, message: 'Rack ist voll (max 5 Karten)!' };
        }
        if (!this.hand[resourceKey] || this.hand[resourceKey] < 1) {
            return { success: false, message: 'Nicht genug Karten auf der Hand!' };
        }

        this.removeFromHand(resourceKey, 1);
        this.rack.push(resourceKey);
        return { success: true };
    }

    /**
     * Move card from rack back to hand
     */
    moveFromRack(index) {
        if (index < 0 || index >= this.rack.length) {
            return { success: false, message: 'Ungültiger Rack-Index!' };
        }

        const resourceKey = this.rack[index];
        this.rack.splice(index, 1);
        this.addToHand(resourceKey, 1);
        return { success: true };
    }

    /**
     * Clear rack (after building)
     */
    clearRack() {
        this.rack = [];
    }

    /**
     * Get total card count in hand
     */
    getHandCount() {
        return Object.values(this.hand).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Add an engine (completed building)
     */
    addEngine(engine) {
        this.engines.push(engine);
        this.points += engine.points;
    }
}

/**
 * Player Manager
 * Manages all players, turn order, and player-related game logic
 */
const PlayerManager = {
    players: [],
    activePlayerIndex: 0,
    gameStarted: false,

    // Draggable hand cards properties
    isDraggingHandCards: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    handCardsElement: null,
    handCardsTitlebar: null,

    // Draggable player corners
    isDraggingPlayerCorner: false,
    draggingCornerElement: null,
    cornerDragOffsetX: 0,
    cornerDragOffsetY: 0,

    /**
     * Initialize player manager
     */
    init() {
        console.log('👥 PlayerManager initialisiert');
        this.setupPlayers();
        this.initDraggableHandCards();
        this.initDraggablePlayerCorners();
    },

    /**
     * Setup players for the game
     */
    setupPlayers(playerCount = 4) {
        this.players = [];
        this.activePlayerIndex = 0;
        this.gameStarted = false;

        const playerConfigs = [
            { id: 1, name: 'Spieler 1', color: '#3b82f6', avatarIcon: '🔵' },
            { id: 2, name: 'Spieler 2', color: '#ef4444', avatarIcon: '🔴' },
            { id: 3, name: 'Spieler 3', color: '#22c55e', avatarIcon: '🟢' },
            { id: 4, name: 'Spieler 4', color: '#eab308', avatarIcon: '🟡' }
        ];

        for (let i = 0; i < playerCount; i++) {
            const config = playerConfigs[i];
            const player = new Player(config.id, config.name, config.color, config.avatarIcon);
            this.players.push(player);
        }

        console.log(`✅ ${playerCount} Spieler erstellt`);
    },

    /**
     * Give starting resources to all players
     * Each player gets 2 cards of each resource
     */
    giveStartingResources() {
        const resources = Object.keys(StateManager.gameState.resources);

        this.players.forEach(player => {
            player.hand = {};
            resources.forEach(resourceKey => {
                player.addToHand(resourceKey, 2);
            });
            console.log(`🎁 ${player.name} erhält Startkapital`);
        });
    },

    /**
     * Start the game
     */
    startGame() {
        if (this.gameStarted) return;

        this.giveStartingResources();
        this.activePlayerIndex = 0;
        this.gameStarted = true;

        console.log('🎮 Spiel gestartet!');
        this.updateUI();
    },

    /**
     * Get active player
     */
    getActivePlayer() {
        return this.players[this.activePlayerIndex];
    },

    /**
     * Get player by ID
     */
    getPlayer(id) {
        return this.players.find(p => p.id === id);
    },

    /**
     * End current player's turn and move to next player
     */
    endTurn() {
        console.log(`🔄 ${this.getActivePlayer().name} beendet Zug`);

        this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;

        console.log(`▶️  ${this.getActivePlayer().name} ist am Zug`);

        // Start new turn
        this.startTurn();

        SoundManager.playSound('click');
        this.updateUI();
    },

    /**
     * Start a player's turn
     * 1. Distribute engine income
     * 2. Update UI
     */
    startTurn() {
        const player = this.getActivePlayer();
        console.log(`🎮 ${player.name} beginnt Zug ${StateManager.gameState.currentTurn}`);

        // Distribute engine income to all players
        this.distributeEngineIncome();

        // Increment turn counter
        if (this.activePlayerIndex === 0) {
            StateManager.gameState.currentTurn++;
        }

        // Update UI
        this.updateUI();
    },

    /**
     * Distribute engine income to all players
     * Called at start of each turn
     */
    distributeEngineIncome() {
        this.players.forEach(player => {
            player.engines.forEach(engine => {
                if (engine.income) {
                    Object.entries(engine.income).forEach(([resourceKey, amount]) => {
                        player.addToHand(resourceKey, amount);
                        console.log(`💰 ${player.name} erhält ${amount}x ${resourceKey} von ${engine.name}`);
                    });
                }
            });
        });
    },

    /**
     * Check if player can build with current rack
     * Returns the best combination found
     */
    checkBuildable(player) {
        if (player.rack.length < 3) {
            return { canBuild: false, message: 'Mindestens 3 Karten erforderlich!' };
        }

        const combination = this.detectPokerCombination(player.rack);

        if (!combination) {
            return { canBuild: false, message: 'Keine gültige Kombination!' };
        }

        return { canBuild: true, combination };
    },

    /**
     * Detect poker-like combinations in rack
     * Returns engine configuration if valid
     */
    detectPokerCombination(rack) {
        if (rack.length < 3) return null;

        const counts = {};
        rack.forEach(card => {
            counts[card] = (counts[card] || 0) + 1;
        });

        const values = Object.values(counts).sort((a, b) => b - a);
        const uniqueTypes = Object.keys(counts).length;

        // 5 of a Kind - Großer Palast
        if (rack.length === 5 && values[0] === 5) {
            return {
                name: 'Großer Palast',
                type: 'five_of_a_kind',
                points: 15,
                income: { [rack[0]]: 3 },
                icon: '🏰'
            };
        }

        // 4 of a Kind - Festung
        if (rack.length >= 4 && values[0] === 4) {
            return {
                name: 'Festung',
                type: 'four_of_a_kind',
                points: 10,
                income: { [Object.keys(counts).find(k => counts[k] === 4)]: 2 },
                icon: '🏛️'
            };
        }

        // Full House - Handelshaus
        if (rack.length === 5 && values[0] === 3 && values[1] === 2) {
            return {
                name: 'Handelshaus',
                type: 'full_house',
                points: 8,
                income: { [Object.keys(counts)[0]]: 1, [Object.keys(counts)[1]]: 1 },
                icon: '🏪'
            };
        }

        // Straight (5 different) - Marktplatz
        if (rack.length === 5 && uniqueTypes === 5) {
            const allResources = {};
            rack.forEach(card => allResources[card] = 1);
            return {
                name: 'Marktplatz',
                type: 'straight',
                points: 12,
                income: allResources,
                icon: '🏬'
            };
        }

        // 3 of a Kind - Werkstatt
        if (rack.length >= 3 && values[0] === 3) {
            return {
                name: 'Werkstatt',
                type: 'three_of_a_kind',
                points: 5,
                income: { [Object.keys(counts).find(k => counts[k] === 3)]: 1 },
                icon: '🏭'
            };
        }

        return null;
    },

    /**
     * Build engine from current rack
     */
    buildEngine(player) {
        const check = this.checkBuildable(player);

        if (!check.canBuild) {
            return { success: false, message: check.message };
        }

        const engine = check.combination;
        player.addEngine(engine);
        player.clearRack();

        SoundManager.playSound('levelup');
        console.log(`🏗️ ${player.name} baut ${engine.name} (${engine.points} Punkte)`);

        this.updateUI();

        return { success: true, engine };
    },

    /**
     * Update all player-related UI
     */
    updateUI() {
        this.renderPlayerCorners();
        this.renderActivePlayerHUD();
        this.updatePlayerHighlight();
    },

    /**
     * Render player corners (4 corners of the screen)
     */
    renderPlayerCorners() {
        this.players.forEach((player, index) => {
            const cornerEl = document.getElementById(`player-corner-${index + 1}`);
            if (!cornerEl) return;

            const isActive = index === this.activePlayerIndex;
            cornerEl.classList.toggle('active-player', isActive);

            const handCount = player.getHandCount();

            let rackHTML = '';
            for (let i = 0; i < 5; i++) {
                const card = player.rack[i];
                if (card) {
                    const resource = StateManager.gameState.resources[card];
                    rackHTML += `<div class="rack-slot filled" data-player="${player.id}" data-slot="${i}">
                        <span class="text-2xl">${resource.icon}</span>
                    </div>`;
                } else {
                    rackHTML += `<div class="rack-slot empty"></div>`;
                }
            }

            let enginesHTML = '';
            player.engines.forEach(engine => {
                enginesHTML += `<div class="engine-icon" title="${engine.name} (+${engine.points} Punkte)">
                    <span class="text-2xl">${engine.icon}</span>
                </div>`;
            });

            cornerEl.innerHTML = `
                <div class="player-corner-header">
                    <span class="player-avatar">${player.avatarIcon}</span>
                    <span class="player-name">${player.name}</span>
                </div>
                <div class="player-stats">
                    <span class="stat">🃏 ${handCount}</span>
                    <span class="stat">⭐ ${player.points}</span>
                </div>
                <div class="player-rack-label">Rack:</div>
                <div class="player-rack">
                    ${rackHTML}
                </div>
                <div class="player-engines-label">Engines:</div>
                <div class="player-engines">
                    ${enginesHTML || '<div class="text-xs text-gray-500">Keine</div>'}
                </div>
            `;
        });
    },

    /**
     * Render active player HUD (bottom interface)
     */
    renderActivePlayerHUD() {
        const player = this.getActivePlayer();
        if (!player) return;

        const hudEl = document.getElementById('active-player-hud');
        if (!hudEl) return;

        let handHTML = '';
        Object.entries(player.hand).forEach(([resourceKey, count]) => {
            const resource = StateManager.gameState.resources[resourceKey];
            for (let i = 0; i < count; i++) {
                handHTML += `<button class="hand-card" data-resource="${resourceKey}" onclick="PlayerManager.onHandCardClick('${resourceKey}')">
                    <span class="text-3xl">${resource.icon}</span>
                    <span class="text-xs">${resource.name}</span>
                </button>`;
            }
        });

        const checkBuild = this.checkBuildable(player);
        const canBuild = checkBuild.canBuild;
        const buildMessage = canBuild ? `Baue ${checkBuild.combination.name}` : checkBuild.message;

        hudEl.innerHTML = `
            <div class="hud-section">
                <div class="hand-cards-grid">
                    ${handHTML || '<div class="text-gray-500 text-sm">Keine Karten</div>'}
                </div>
            </div>
            <div class="hud-actions">
                <button id="build-btn" class="action-btn ${canBuild ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}"
                    ${!canBuild ? 'disabled' : ''}
                    onclick="PlayerManager.onBuildClick()">
                    🏗️ ${buildMessage}
                </button>
                <button id="end-turn-btn" class="action-btn bg-blue-600 hover:bg-blue-700" onclick="PlayerManager.onEndTurnClick()">
                    ⏭️ Zug beenden
                </button>
            </div>
        `;
    },

    /**
     * Update player token highlight on board
     */
    updatePlayerHighlight() {
        // Remove all highlights
        document.querySelectorAll('.player-token').forEach(token => {
            token.classList.remove('active-token');
        });

        // Add highlight to active player
        const activeToken = document.querySelector(`.player-token[data-player="${this.activePlayerIndex + 1}"]`);
        if (activeToken) {
            activeToken.classList.add('active-token');
        }

        // Also highlight player corner
        document.querySelectorAll('.player-corner').forEach((corner, index) => {
            corner.classList.toggle('active-player', index === this.activePlayerIndex);
        });
    },

    /**
     * Event Handlers
     */
    onHandCardClick(resourceKey) {
        const player = this.getActivePlayer();
        const result = player.moveToRack(resourceKey);

        if (!result.success) {
            UIManager.showModalMessage('Rack voll', result.message, true);
        } else {
            SoundManager.playSound('click');
            this.updateUI();
        }
    },

    onBuildClick() {
        const player = this.getActivePlayer();
        const result = this.buildEngine(player);

        if (!result.success) {
            UIManager.showModalMessage('Bauen nicht möglich', result.message, true);
        } else {
            UIManager.showModalMessage(
                `${result.engine.icon} ${result.engine.name} gebaut!`,
                `+${result.engine.points} Punkte! Einkommen: ${JSON.stringify(result.engine.income)}`,
                false
            );
        }
    },

    onEndTurnClick() {
        // Check if player has done required actions
        // For now, just end turn
        this.endTurn();
    },

    /**
     * Initialize draggable hand cards functionality
     */
    initDraggableHandCards() {
        this.handCardsElement = document.getElementById('board-player-hud');
        this.handCardsTitlebar = document.getElementById('hand-cards-titlebar');

        if (!this.handCardsElement || !this.handCardsTitlebar) {
            console.warn('Hand cards draggable elements not found');
            return;
        }

        // Mouse events
        this.handCardsTitlebar.addEventListener('mousedown', this.onHandCardsDragStart.bind(this));
        document.addEventListener('mousemove', this.onHandCardsDrag.bind(this));
        document.addEventListener('mouseup', this.onHandCardsDragEnd.bind(this));

        // Touch events for mobile
        this.handCardsTitlebar.addEventListener('touchstart', this.onHandCardsTouchStart.bind(this));
        document.addEventListener('touchmove', this.onHandCardsTouchMove.bind(this));
        document.addEventListener('touchend', this.onHandCardsTouchEnd.bind(this));

        // Prevent text selection
        this.handCardsTitlebar.addEventListener('selectstart', (e) => e.preventDefault());

        // Load saved position
        this.loadHandCardsPosition();

        console.log('✅ Hand cards draggable initialized');
    },

    /**
     * Mouse drag start for hand cards
     */
    onHandCardsDragStart(e) {
        // Don't drag if clicking on a card
        if (e.target.closest('.hand-card') || e.target.closest('.action-btn')) {
            return;
        }

        this.isDraggingHandCards = true;
        const rect = this.handCardsElement.getBoundingClientRect();
        this.dragOffsetX = e.clientX - rect.left;
        this.dragOffsetY = e.clientY - rect.top;

        this.handCardsTitlebar.style.cursor = 'grabbing';
        this.handCardsElement.style.transition = 'none';
    },

    /**
     * Mouse drag move for hand cards
     */
    onHandCardsDrag(e) {
        if (!this.isDraggingHandCards) return;

        e.preventDefault();
        const x = e.clientX - this.dragOffsetX;
        const y = e.clientY - this.dragOffsetY;

        this.setHandCardsPosition(x, y);
    },

    /**
     * Mouse drag end for hand cards
     */
    onHandCardsDragEnd() {
        if (!this.isDraggingHandCards) return;

        this.isDraggingHandCards = false;
        this.handCardsTitlebar.style.cursor = 'grab';
        this.handCardsElement.style.transition = '';

        this.saveHandCardsPosition();
        this.ensureHandCardsInViewport();
    },

    /**
     * Touch drag start for hand cards
     */
    onHandCardsTouchStart(e) {
        // Don't drag if touching a card
        if (e.target.closest('.hand-card') || e.target.closest('.action-btn')) {
            return;
        }

        this.isDraggingHandCards = true;
        const touch = e.touches[0];
        const rect = this.handCardsElement.getBoundingClientRect();
        this.dragOffsetX = touch.clientX - rect.left;
        this.dragOffsetY = touch.clientY - rect.top;

        this.handCardsElement.style.transition = 'none';
    },

    /**
     * Touch drag move for hand cards
     */
    onHandCardsTouchMove(e) {
        if (!this.isDraggingHandCards) return;

        e.preventDefault();
        const touch = e.touches[0];
        const x = touch.clientX - this.dragOffsetX;
        const y = touch.clientY - this.dragOffsetY;

        this.setHandCardsPosition(x, y);
    },

    /**
     * Touch drag end for hand cards
     */
    onHandCardsTouchEnd() {
        if (!this.isDraggingHandCards) return;

        this.isDraggingHandCards = false;
        this.handCardsElement.style.transition = '';

        this.saveHandCardsPosition();
        this.ensureHandCardsInViewport();
    },

    /**
     * Set hand cards window position
     */
    setHandCardsPosition(x, y) {
        this.handCardsElement.style.left = `${x}px`;
        this.handCardsElement.style.top = `${y}px`;
        this.handCardsElement.style.bottom = 'auto';
        this.handCardsElement.style.right = 'auto';
    },

    /**
     * Ensure hand cards window stays within viewport
     */
    ensureHandCardsInViewport() {
        const rect = this.handCardsElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = rect.left;
        let y = rect.top;
        let adjusted = false;

        // Check right edge
        if (rect.right > viewportWidth) {
            x = viewportWidth - rect.width - 10;
            adjusted = true;
        }

        // Check left edge
        if (x < 10) {
            x = 10;
            adjusted = true;
        }

        // Check bottom edge (account for bottom nav bar)
        if (rect.bottom > viewportHeight - 72) {
            y = viewportHeight - rect.height - 82;
            adjusted = true;
        }

        // Check top edge
        if (y < 50) {
            y = 50;
            adjusted = true;
        }

        if (adjusted) {
            this.setHandCardsPosition(x, y);
        }
    },

    /**
     * Save hand cards position to localStorage
     */
    saveHandCardsPosition() {
        const rect = this.handCardsElement.getBoundingClientRect();
        const position = {
            x: rect.left,
            y: rect.top
        };

        try {
            localStorage.setItem('tradeXHandCardsPosition', JSON.stringify(position));
        } catch (error) {
            console.warn('Failed to save hand cards position:', error);
        }
    },

    /**
     * Load hand cards position from localStorage
     */
    loadHandCardsPosition() {
        try {
            const saved = localStorage.getItem('tradeXHandCardsPosition');
            if (saved) {
                const position = JSON.parse(saved);
                this.setHandCardsPosition(position.x, position.y);
                this.ensureHandCardsInViewport();
            }
        } catch (error) {
            console.warn('Failed to load hand cards position:', error);
        }
    },

    /**
     * Initialize draggable player corners functionality
     */
    initDraggablePlayerCorners() {
        // Add drag functionality to all player corners
        for (let i = 1; i <= 4; i++) {
            const cornerElement = document.getElementById(`player-corner-${i}`);
            if (cornerElement) {
                // Mouse events
                cornerElement.addEventListener('mousedown', this.onPlayerCornerDragStart.bind(this));

                // Touch events
                cornerElement.addEventListener('touchstart', this.onPlayerCornerTouchStart.bind(this));

                // Prevent text selection
                cornerElement.addEventListener('selectstart', (e) => e.preventDefault());
            }
        }

        // Global mouse/touch move and end events
        document.addEventListener('mousemove', this.onPlayerCornerDrag.bind(this));
        document.addEventListener('mouseup', this.onPlayerCornerDragEnd.bind(this));
        document.addEventListener('touchmove', this.onPlayerCornerTouchMove.bind(this));
        document.addEventListener('touchend', this.onPlayerCornerTouchEnd.bind(this));

        // Load saved positions
        this.loadPlayerCornersPositions();

        console.log('✅ Player corners draggable initialized');
    },

    /**
     * Mouse drag start for player corner
     */
    onPlayerCornerDragStart(e) {
        // Don't drag if clicking on interactive elements
        if (e.target.closest('.rack-slot.filled') || e.target.closest('.engine-icon')) {
            return;
        }

        this.isDraggingPlayerCorner = true;
        this.draggingCornerElement = e.currentTarget;

        const rect = this.draggingCornerElement.getBoundingClientRect();
        this.cornerDragOffsetX = e.clientX - rect.left;
        this.cornerDragOffsetY = e.clientY - rect.top;

        this.draggingCornerElement.style.transition = 'none';
    },

    /**
     * Mouse drag move for player corner
     */
    onPlayerCornerDrag(e) {
        if (!this.isDraggingPlayerCorner || !this.draggingCornerElement) return;

        e.preventDefault();
        const x = e.clientX - this.cornerDragOffsetX;
        const y = e.clientY - this.cornerDragOffsetY;

        this.setPlayerCornerPosition(this.draggingCornerElement, x, y);
    },

    /**
     * Mouse drag end for player corner
     */
    onPlayerCornerDragEnd() {
        if (!this.isDraggingPlayerCorner || !this.draggingCornerElement) return;

        this.isDraggingPlayerCorner = false;
        this.draggingCornerElement.style.transition = '';

        this.savePlayerCornerPosition(this.draggingCornerElement);
        this.ensurePlayerCornerInViewport(this.draggingCornerElement);

        this.draggingCornerElement = null;
    },

    /**
     * Touch drag start for player corner
     */
    onPlayerCornerTouchStart(e) {
        // Don't drag if touching interactive elements
        if (e.target.closest('.rack-slot.filled') || e.target.closest('.engine-icon')) {
            return;
        }

        this.isDraggingPlayerCorner = true;
        this.draggingCornerElement = e.currentTarget;

        const touch = e.touches[0];
        const rect = this.draggingCornerElement.getBoundingClientRect();
        this.cornerDragOffsetX = touch.clientX - rect.left;
        this.cornerDragOffsetY = touch.clientY - rect.top;

        this.draggingCornerElement.style.transition = 'none';
    },

    /**
     * Touch drag move for player corner
     */
    onPlayerCornerTouchMove(e) {
        if (!this.isDraggingPlayerCorner || !this.draggingCornerElement) return;

        e.preventDefault();
        const touch = e.touches[0];
        const x = touch.clientX - this.cornerDragOffsetX;
        const y = touch.clientY - this.cornerDragOffsetY;

        this.setPlayerCornerPosition(this.draggingCornerElement, x, y);
    },

    /**
     * Touch drag end for player corner
     */
    onPlayerCornerTouchEnd() {
        if (!this.isDraggingPlayerCorner || !this.draggingCornerElement) return;

        this.isDraggingPlayerCorner = false;
        this.draggingCornerElement.style.transition = '';

        this.savePlayerCornerPosition(this.draggingCornerElement);
        this.ensurePlayerCornerInViewport(this.draggingCornerElement);

        this.draggingCornerElement = null;
    },

    /**
     * Set player corner position
     */
    setPlayerCornerPosition(element, x, y) {
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.right = 'auto';
        element.style.bottom = 'auto';
    },

    /**
     * Ensure player corner stays within viewport
     */
    ensurePlayerCornerInViewport(element) {
        const rect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = rect.left;
        let y = rect.top;
        let adjusted = false;

        // Check right edge
        if (rect.right > viewportWidth) {
            x = viewportWidth - rect.width - 10;
            adjusted = true;
        }

        // Check left edge
        if (x < 10) {
            x = 10;
            adjusted = true;
        }

        // Check bottom edge (account for bottom nav bar)
        if (rect.bottom > viewportHeight - 72) {
            y = viewportHeight - rect.height - 82;
            adjusted = true;
        }

        // Check top edge (account for top notice bar)
        if (y < 50) {
            y = 50;
            adjusted = true;
        }

        if (adjusted) {
            this.setPlayerCornerPosition(element, x, y);
        }
    },

    /**
     * Save player corner position to localStorage
     */
    savePlayerCornerPosition(element) {
        const cornerId = element.id;
        const rect = element.getBoundingClientRect();
        const position = {
            x: rect.left,
            y: rect.top
        };

        try {
            localStorage.setItem(`tradeX_${cornerId}_position`, JSON.stringify(position));
        } catch (error) {
            console.warn('Failed to save player corner position:', error);
        }
    },

    /**
     * Load all player corners positions from localStorage
     */
    loadPlayerCornersPositions() {
        for (let i = 1; i <= 4; i++) {
            const cornerElement = document.getElementById(`player-corner-${i}`);
            if (cornerElement) {
                try {
                    const saved = localStorage.getItem(`tradeX_player-corner-${i}_position`);
                    if (saved) {
                        const position = JSON.parse(saved);
                        this.setPlayerCornerPosition(cornerElement, position.x, position.y);
                        this.ensurePlayerCornerInViewport(cornerElement);
                    }
                } catch (error) {
                    console.warn(`Failed to load position for player-corner-${i}:`, error);
                }
            }
        }
    }
};
