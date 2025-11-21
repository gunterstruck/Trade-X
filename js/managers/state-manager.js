/**
 * Trade-X State Manager
 * Manages game state, history, undo/redo functionality
 */

const StateManager = {
    gameState: null,
    init() { this.resetGame(); },
    resetGame() {
        SoundManager.playSound('reset');
        const baseState = { history: [], historyIndex: -1, prices: {}, priceHistory: {}, marketPressure: {}, sharedPool: {} };
        if (ModeManager.currentMode === 'basis') {
            this.gameState = { ...baseState, mode: 'basis', resources: BASIS_RESOURCES, basisTradeFee: parseInt(DOMElements.basisFeeSelector?.value || 2, 10), totalTrades: 0, totalProfit: 0 };
            CONFIG.GAME.MAX_HISTORY_STEPS = CONFIG.GAME.MAX_HISTORY_STEPS_BASIS;
        } else {
            const resourceSetId = DOMElements.resourceSetSelector?.value || 'set_5';
            const startMonth = parseInt(DOMElements.startMonthSelector?.value || 1, 10);
            this.gameState = { ...baseState, mode: 'expert', round: startMonth, season: 'fruehling', resourceSet: resourceSetId, resources: getResourcesForSet(resourceSetId), economicSystem: DOMElements.systemSelector?.value || 'free_market', activeEvents: [], totalTrades: 0, totalProfit: 0, tradeHistory: [], lastGlobalEventRound: 0, sessionTrades: 0, sessionTotalGive: 0, sessionTotalGet: 0, unavailableResources: [] };
            CONFIG.GAME.MAX_HISTORY_STEPS = CONFIG.GAME.MAX_HISTORY_STEPS_EXPERT;
            GameEngine.updateSeason(); // Set initial season based on start month
        }
        Object.keys(this.gameState.resources).forEach(key => {
            this.gameState.prices[key] = 4.0;
            this.gameState.priceHistory[key] = [4.0];
            if (ModeManager.currentMode === 'expert') {
                this.gameState.marketPressure[key] = 0;
                this.gameState.sharedPool[key] = 0;
            }
        });
        UIManager.updateResourceUI(this.gameState.resources);
        UIManager.resetTradeSelection();
        this.saveState();
        UIManager.updateAllUI();
    },
    saveState() {
        try {
            if (this.gameState.historyIndex < this.gameState.history.length - 1) {
                this.gameState.history = this.gameState.history.slice(0, this.gameState.historyIndex + 1);
            }
            const snapshot = JSON.parse(JSON.stringify(this.gameState));
            delete snapshot.history;
            delete snapshot.historyIndex;
            this.gameState.history.push(snapshot);
            if (this.gameState.history.length > CONFIG.GAME.MAX_HISTORY_STEPS) this.gameState.history.shift();
            this.gameState.historyIndex = this.gameState.history.length - 1;
            UIManager.updateUndoRedoButtons();
        } catch (err) {
            throw new GameError(`Fehler beim Speichern des Spielzustands: ${err.message}`, 'STATE_ERROR');
        }
    },
    loadState(snapshot) {
        const history = this.gameState.history;
        const historyIndex = this.gameState.historyIndex;
        this.gameState = JSON.parse(JSON.stringify(snapshot));
        this.gameState.history = history;
        this.gameState.historyIndex = historyIndex;
        UIManager.updateResourceUI(this.gameState.resources);
        UIManager.updateAllUI();
    },
    undo() {
        if (this.gameState.historyIndex > 0) {
            SoundManager.playSound('undo');
            this.gameState.historyIndex--;
            this.loadState(this.gameState.history[this.gameState.historyIndex]);
            UIManager.updateUndoRedoButtons();
        }
    },
    redo() {
        if (this.gameState.historyIndex < this.gameState.history.length - 1) {
            SoundManager.playSound('redo');
            this.gameState.historyIndex++;
            this.loadState(this.gameState.history[this.gameState.historyIndex]);
            UIManager.updateUndoRedoButtons();
        }
    }
};
