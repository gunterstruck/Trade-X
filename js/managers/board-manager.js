/**
 * Trade-X Board Manager
 * Manages the game board, dice rolling, player movement, and field interactions
 */

const BoardManager = {
    // Board State
    totalFields: 40,
    currentPosition: 1,
    playerToken: null, // Legacy single token (kept for compatibility)
    playerTokens: [], // Array of tokens for multiplayer
    isRolling: false,
    isMoving: false,

    // Field Configuration
    fields: [],
    fieldTypes: {
        START: 'start',
        MARKET: 'market',
        EVENT: 'event',
        NORMAL: 'normal'
    },

    // Field Type Distribution
    // Every 10th field is a market field (4 total)
    // Every 5th field (not overlapping with market) is an event field
    // Field 1 is START

    /**
     * Initialize the board
     */
    init() {
        console.log('🎲 BoardManager initialisiert');
        this.generateFields();
        this.renderBoard();

        // Check if multiplayer mode
        const isMultiplayer = StateManager.gameState?.isMultiplayer;

        if (isMultiplayer && typeof PlayerManager !== 'undefined') {
            // Wait for PlayerManager to be ready
            setTimeout(() => {
                this.createMultiplayerTokens();
            }, 100);
        } else {
            this.createPlayerToken();
        }

        this.setupEventListeners();
        this.updateUI();
    },

    /**
     * Generate field configuration
     */
    generateFields() {
        this.fields = [];

        for (let i = 1; i <= this.totalFields; i++) {
            let type = this.fieldTypes.NORMAL;
            let icon = '📍';
            let name = `Feld ${i}`;

            // Determine field type
            if (i === 1) {
                type = this.fieldTypes.START;
                icon = '🏁';
                name = 'Start';
            } else if (i % 10 === 0) {
                type = this.fieldTypes.MARKET;
                icon = '💰';
                name = 'Marktplatz';
            } else if (i % 5 === 0) {
                type = this.fieldTypes.EVENT;
                icon = '⚡';
                name = 'Event';
            }

            this.fields.push({
                number: i,
                type: type,
                icon: icon,
                name: name
            });
        }
    },

    /**
     * Render the board fields in a circle
     */
    renderBoard() {
        const board = document.getElementById('game-board');
        if (!board) return;

        board.innerHTML = '';

        const radius = 45; // Percentage of board size
        const centerX = 50;
        const centerY = 50;

        this.fields.forEach((field, index) => {
            // Calculate position on circle
            // Start at top (270 degrees) and go clockwise
            const angle = (270 + (index * (360 / this.totalFields))) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            // Create field element
            const fieldEl = document.createElement('div');
            fieldEl.className = `board-field ${field.type}-field`;
            fieldEl.dataset.fieldNumber = field.number;
            fieldEl.style.left = `${x}%`;
            fieldEl.style.top = `${y}%`;
            fieldEl.style.transform = 'translate(-50%, -50%)';

            fieldEl.innerHTML = `
                <div class="field-icon">${field.icon}</div>
                <div class="field-number">${field.number}</div>
            `;

            // Add click event
            fieldEl.addEventListener('click', () => this.onFieldClick(field));

            board.appendChild(fieldEl);
        });
    },

    /**
     * Create player token (legacy single player)
     */
    createPlayerToken() {
        const board = document.getElementById('game-board');
        if (!board) return;

        this.playerToken = document.createElement('div');
        this.playerToken.className = 'player-token';
        this.playerToken.innerHTML = '👤';

        board.appendChild(this.playerToken);

        // Position at start
        this.updatePlayerPosition(false);
    },

    /**
     * Create multiplayer tokens (one per player)
     */
    createMultiplayerTokens() {
        const board = document.getElementById('game-board');
        if (!board || typeof PlayerManager === 'undefined') return;

        // Clear existing tokens
        this.playerTokens.forEach(token => token.remove());
        this.playerTokens = [];

        // Create token for each player
        PlayerManager.players.forEach((player, index) => {
            const token = document.createElement('div');
            token.className = 'player-token';
            token.dataset.player = player.id;
            token.innerHTML = player.avatarIcon;

            board.appendChild(token);
            this.playerTokens.push(token);

            // Position at player's current position
            this.updateMultiplayerTokenPosition(player.id, player.position, false);
        });

        console.log(`✅ ${this.playerTokens.length} Spieler-Tokens erstellt`);
    },

    /**
     * Update player token position (legacy single player)
     */
    updatePlayerPosition(animate = true) {
        if (!this.playerToken) return;

        const fieldEl = document.querySelector(`[data-field-number="${this.currentPosition}"]`);
        if (!fieldEl) return;

        const rect = fieldEl.getBoundingClientRect();
        const boardRect = document.getElementById('game-board').getBoundingClientRect();

        const x = ((rect.left + rect.width / 2) - boardRect.left) / boardRect.width * 100;
        const y = ((rect.top + rect.height / 2) - boardRect.top) / boardRect.height * 100;

        this.playerToken.style.left = `${x}%`;
        this.playerToken.style.top = `${y}%`;

        if (animate) {
            this.playerToken.classList.add('player-moving');
            setTimeout(() => {
                this.playerToken.classList.remove('player-moving');
            }, 400);
        }

        // Highlight current field
        document.querySelectorAll('.board-field').forEach(f => f.classList.remove('current-position'));
        fieldEl.classList.add('current-position');
    },

    /**
     * Update multiplayer token position
     * @param {number} playerId - Player ID
     * @param {number} position - Field number (1-40)
     * @param {boolean} animate - Whether to animate the movement
     */
    updateMultiplayerTokenPosition(playerId, position, animate = true) {
        const token = this.playerTokens.find(t => parseInt(t.dataset.player) === playerId);
        if (!token) return;

        const fieldEl = document.querySelector(`[data-field-number="${position}"]`);
        if (!fieldEl) return;

        const rect = fieldEl.getBoundingClientRect();
        const boardRect = document.getElementById('game-board').getBoundingClientRect();

        const x = ((rect.left + rect.width / 2) - boardRect.left) / boardRect.width * 100;
        const y = ((rect.top + rect.height / 2) - boardRect.top) / boardRect.height * 100;

        // Check if multiple tokens are on same field (for stacking)
        const tokensOnField = this.getTokensOnField(position);
        const stackIndex = tokensOnField.indexOf(playerId);

        token.style.left = `${x}%`;
        token.style.top = `${y}%`;
        token.dataset.stack = stackIndex + 1;

        if (animate) {
            token.classList.add('player-moving');
            setTimeout(() => {
                token.classList.remove('player-moving');
            }, 400);
        }
    },

    /**
     * Get all player IDs on a specific field
     */
    getTokensOnField(position) {
        if (typeof PlayerManager === 'undefined') return [];
        return PlayerManager.players
            .filter(p => p.position === position)
            .map(p => p.id);
    },

    /**
     * Update all multiplayer token positions
     */
    updateAllTokenPositions() {
        if (typeof PlayerManager === 'undefined') return;
        PlayerManager.players.forEach(player => {
            this.updateMultiplayerTokenPosition(player.id, player.position, false);
        });
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const rollBtn = document.getElementById('roll-dice-btn');
        if (rollBtn) {
            rollBtn.addEventListener('click', () => this.rollDice());
        }

        // Enable action button in bottom nav
        const actionBtn = document.getElementById('nav-btn-action');
        if (actionBtn) {
            actionBtn.disabled = false;
            actionBtn.title = 'Würfeln';
            actionBtn.addEventListener('click', () => {
                if (ViewManager.currentView !== 'board') {
                    ViewManager.switchView('board');
                }
                this.rollDice();
            });
        }
    },

    /**
     * Roll the dice (multiplayer aware)
     */
    async rollDice() {
        if (this.isRolling || this.isMoving) return;

        // Get active player from PlayerManager
        const activePlayer = typeof PlayerManager !== 'undefined' ? PlayerManager.getActivePlayer() : null;
        const isMultiplayer = StateManager.gameState?.isMultiplayer && activePlayer;

        this.isRolling = true;
        const rollBtn = document.getElementById('roll-dice-btn');
        if (rollBtn) rollBtn.disabled = true;

        SoundManager.playSound('click');

        // Animate dice
        const diceFace = document.getElementById('dice-face');
        diceFace.classList.add('dice-rolling');

        // Random animation duration
        await this.sleep(500);

        // Generate random number 1-6
        const roll = Math.floor(Math.random() * 6) + 1;

        // Update dice display
        this.updateDiceDisplay(roll);
        diceFace.classList.remove('dice-rolling');

        // Show last roll info
        document.getElementById('last-roll-info').classList.remove('hidden');
        document.getElementById('last-roll-value').textContent = roll;

        // Wait a moment before moving
        await this.sleep(300);

        // Move player
        if (isMultiplayer) {
            await this.moveMultiplayerPlayer(activePlayer, roll);
        } else {
            await this.movePlayer(roll);
        }

        this.isRolling = false;
        if (rollBtn) rollBtn.disabled = false;
    },

    /**
     * Update dice visual display
     */
    updateDiceDisplay(value) {
        const diceFace = document.getElementById('dice-face');
        const dotsContainer = diceFace.querySelector('.dice-dots');

        dotsContainer.dataset.value = value;
        dotsContainer.innerHTML = '';

        for (let i = 0; i < value; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            dotsContainer.appendChild(dot);
        }

        SoundManager.playSound('success');
    },

    /**
     * Move player by steps (legacy single player)
     */
    async movePlayer(steps) {
        this.isMoving = true;

        for (let i = 0; i < steps; i++) {
            this.currentPosition++;

            // Wrap around at 40
            if (this.currentPosition > this.totalFields) {
                this.currentPosition = 1;
                SoundManager.playSound('levelup');
            } else {
                SoundManager.playSound('click');
            }

            this.updatePlayerPosition(true);
            this.updateUI();

            await this.sleep(400);
        }

        this.isMoving = false;

        // Check field action
        await this.handleFieldAction();
    },

    /**
     * Move multiplayer player by steps
     */
    async moveMultiplayerPlayer(player, steps) {
        this.isMoving = true;

        for (let i = 0; i < steps; i++) {
            player.position++;

            // Wrap around at 40
            if (player.position > this.totalFields) {
                player.position = 1;
                SoundManager.playSound('levelup');

                // Give start bonus (pass GO)
                console.log(`🎉 ${player.name} passiert START!`);
                // TODO: Implement start bonus
            } else {
                SoundManager.playSound('click');
            }

            this.updateMultiplayerTokenPosition(player.id, player.position, true);
            this.updateUI();

            await this.sleep(400);
        }

        this.isMoving = false;

        // Check field action
        await this.handleFieldAction(player);

        // Update player corner highlight
        if (typeof PlayerManager !== 'undefined') {
            PlayerManager.updatePlayerHighlight();
        }
    },

    /**
     * Handle field action after landing
     */
    async handleFieldAction(player = null) {
        const position = player ? player.position : this.currentPosition;
        const field = this.fields[position - 1];

        // Update field info panel
        this.updateFieldInfo(field);

        // Handle different field types
        if (field.type === this.fieldTypes.MARKET) {
            await this.sleep(800);
            SoundManager.playSound('success');

            // In multiplayer, give resources instead of switching view
            if (player) {
                this.giveMarketResources(player);

                if (UIManager && UIManager.showEventBanner) {
                    UIManager.showEventBanner({
                        name: '💰 Marktplatz erreicht!',
                        banner: 'success',
                        description: `${player.name} erhält Ressourcen!`
                    });
                }
            } else {
                // Switch to market view (single player)
                ViewManager.switchView('market');

                if (UIManager && UIManager.showEventBanner) {
                    UIManager.showEventBanner({
                        name: '💰 Marktplatz erreicht!',
                        banner: 'success',
                        description: 'Zeit zum Handeln!'
                    });
                }
            }
        } else if (field.type === this.fieldTypes.EVENT) {
            SoundManager.playSound('levelup');

            // In multiplayer, give random resource
            if (player) {
                this.giveRandomResource(player);

                if (UIManager && UIManager.showEventBanner) {
                    UIManager.showEventBanner({
                        name: '⚡ Event-Feld!',
                        banner: 'info',
                        description: `${player.name} erhält eine zufällige Ressource!`
                    });
                }
            } else {
                // Trigger random event (single player)
                if (UIManager && UIManager.showEventBanner) {
                    UIManager.showEventBanner({
                        name: '⚡ Event-Feld!',
                        banner: 'info',
                        description: 'Ein besonderes Ereignis tritt ein!'
                    });
                }
            }
        } else if (field.type === this.fieldTypes.NORMAL && player) {
            // Normal field in multiplayer: give 1 random resource
            this.giveRandomResource(player, 1);
        }
    },

    /**
     * Give market resources to player
     */
    giveMarketResources(player) {
        const resources = Object.keys(StateManager.gameState.resources);
        const randomResource = resources[Math.floor(Math.random() * resources.length)];

        player.addToHand(randomResource, 2);
        console.log(`💰 ${player.name} erhält 2x ${randomResource} vom Marktplatz`);

        if (typeof PlayerManager !== 'undefined') {
            PlayerManager.updateUI();
        }
    },

    /**
     * Give random resource to player
     */
    giveRandomResource(player, amount = 1) {
        const resources = Object.keys(StateManager.gameState.resources);
        const randomResource = resources[Math.floor(Math.random() * resources.length)];

        player.addToHand(randomResource, amount);
        console.log(`🎁 ${player.name} erhält ${amount}x ${randomResource}`);

        if (typeof PlayerManager !== 'undefined') {
            PlayerManager.updateUI();
        }
    },

    /**
     * Update UI elements
     */
    updateUI() {
        const posDisplay = document.getElementById('player-position-display');
        if (posDisplay) {
            posDisplay.textContent = this.currentPosition;
        }

        const field = this.fields[this.currentPosition - 1];
        this.updateFieldInfo(field);
    },

    /**
     * Update field info panel
     */
    updateFieldInfo(field) {
        const content = document.getElementById('field-info-content');
        if (!content) return;

        let badgeClass = 'field-type-normal';
        let typeName = 'Normal';
        let description = 'Ein normales Feld.';

        if (field.type === this.fieldTypes.START) {
            badgeClass = 'field-type-start';
            typeName = 'Start';
            description = 'Das Startfeld des Spiels. Hier beginnt deine Reise!';
        } else if (field.type === this.fieldTypes.MARKET) {
            badgeClass = 'field-type-market';
            typeName = 'Marktplatz';
            description = 'Hier kannst du Ressourcen handeln und dein Vermögen vergrößern!';
        } else if (field.type === this.fieldTypes.EVENT) {
            badgeClass = 'field-type-event';
            typeName = 'Event';
            description = 'Ein Event-Feld! Hier passieren besondere Dinge.';
        }

        content.innerHTML = `
            <div class="text-4xl mb-3">${field.icon}</div>
            <div class="text-xl font-bold text-white mb-2">${field.name}</div>
            <div class="field-type-badge ${badgeClass}">${typeName}</div>
            <p class="text-sm text-gray-300 mt-3">${description}</p>
            <div class="text-xs text-gray-500 mt-2">Feld #${field.number}</div>
        `;
    },

    /**
     * Handle field click
     */
    onFieldClick(field) {
        console.log(`Feld ${field.number} angeklickt:`, field);
        this.updateFieldInfo(field);
        SoundManager.playSound('click');
    },

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Reset board state
     */
    reset() {
        this.currentPosition = 1;
        this.updatePlayerPosition(false);
        this.updateUI();

        document.getElementById('last-roll-info').classList.add('hidden');
        document.getElementById('last-roll-value').textContent = '-';

        console.log('🔄 Board zurückgesetzt');
    }
};
