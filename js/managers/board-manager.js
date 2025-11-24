/**
 * Trade-X Board Manager
 * Manages the game board, dice rolling, player movement, and field interactions
 */

const BoardManager = {
    // Board State
    totalFields: 40,
    currentPosition: 1,
    playerToken: null,
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
        this.createPlayerToken();
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
     * Create player token
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
     * Update player token position
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
     * Roll the dice
     */
    async rollDice() {
        if (this.isRolling || this.isMoving) return;

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
        await this.movePlayer(roll);

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
     * Move player by steps
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
     * Handle field action after landing
     */
    async handleFieldAction() {
        const field = this.fields[this.currentPosition - 1];

        // Update field info panel
        this.updateFieldInfo(field);

        // Handle different field types
        if (field.type === this.fieldTypes.MARKET) {
            await this.sleep(800);
            SoundManager.playSound('success');

            // Switch to market view
            ViewManager.switchView('market');

            // Show notification
            if (UIManager && UIManager.showEventBanner) {
                UIManager.showEventBanner({
                    name: '💰 Marktplatz erreicht!',
                    banner: 'success',
                    description: 'Zeit zum Handeln!'
                });
            }
        } else if (field.type === this.fieldTypes.EVENT) {
            SoundManager.playSound('levelup');

            // Trigger random event (could be expanded)
            if (UIManager && UIManager.showEventBanner) {
                UIManager.showEventBanner({
                    name: '⚡ Event-Feld!',
                    banner: 'info',
                    description: 'Ein besonderes Ereignis tritt ein!'
                });
            }
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
