/**
 * Trade-X Mode Manager
 * Manages game mode switching between Basis (simple) and Expert (full) modes
 */

const ModeManager = {
    currentMode: localStorage.getItem('tradingMode') || 'basis',
    initializeModeToggle() {
        DOMElements.modeSelector.addEventListener('change', (e) => this.toggleMode(e.target.value));
        this.setMode(this.currentMode);
    },
    toggleMode(mode) {
        if (this.currentMode === mode) return;
        SoundManager.playSound('click');
        this.currentMode = mode;
        this.setMode(mode);
        this.saveMode();
        StateManager.resetGame();
    },
    setMode(mode) {
        DOMElements.body.classList.remove('basis-mode', 'expert-mode');
        DOMElements.body.classList.add(`${mode}-mode`);
        DOMElements.modeSelector.value = mode;
        this.updateModeUI();
    },
    updateModeUI() {
        if (DOMElements.mainGrid) {
            DOMElements.mainGrid.style.display = 'none';
            DOMElements.mainGrid.offsetHeight;
            DOMElements.mainGrid.style.display = '';
        }
        if (this.currentMode === 'expert') {
            setTimeout(() => {
                UIManager.initChart();
                UIManager.initSeasonalChart();
                if (UIManager.debouncedUpdateChart) UIManager.debouncedUpdateChart();
            }, 100);
        } else {
            if (UIManager.priceChart) {
                UIManager.priceChart.destroy();
                UIManager.priceChart = null;
            }
            if (UIManager.seasonalChart) {
                UIManager.seasonalChart.destroy();
                UIManager.seasonalChart = null;
            }
        }
    },
    saveMode() {
        localStorage.setItem('tradingMode', this.currentMode);
    }
};
