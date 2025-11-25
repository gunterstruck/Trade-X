/**
 * Trade-X View Manager
 * Manages view switching between Board and Market views
 */

const ViewManager = {
    currentView: 'market',

    init() {
        console.log('🎯 ViewManager initialisiert');

        // Setup navigation buttons
        const navBtnBoard = document.getElementById('nav-btn-board');
        const navBtnMarket = document.getElementById('nav-btn-market');

        if (navBtnBoard) {
            navBtnBoard.addEventListener('click', () => this.switchView('board'));
        }

        if (navBtnMarket) {
            navBtnMarket.addEventListener('click', () => this.switchView('market'));
        }
    },

    switchView(viewId) {
        if (this.currentView === viewId) return; // Already on this view

        console.log(`🔄 Wechsle View: ${this.currentView} → ${viewId}`);
        SoundManager.playSound('click');

        // Hide all views
        const views = document.querySelectorAll('.view-section');
        views.forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden');
        });

        // Show target view
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
        }

        // Update navigation buttons
        document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Update current view
        this.currentView = viewId;

        // Special handling based on view
        if (viewId === 'market') {
            this.onMarketViewActivated();
        } else if (viewId === 'board') {
            this.onBoardViewActivated();
        }
    },

    onBoardViewActivated() {
        console.log('🎲 Board View aktiviert');

        // Show board player HUD with flex layout
        const boardHUD = document.getElementById('board-player-hud');
        if (boardHUD) {
            boardHUD.style.display = 'flex';
        }

        // Update player UI if PlayerManager is available
        if (typeof PlayerManager !== 'undefined') {
            PlayerManager.updateUI();
        }
    },

    onMarketViewActivated() {
        // Ensure charts are properly rendered when returning to market view
        // Canvas elements can lose their context when hidden
        console.log('📊 Market View aktiviert - aktualisiere Charts');

        // Hide board player HUD
        const boardHUD = document.getElementById('board-player-hud');
        if (boardHUD) {
            boardHUD.style.display = 'none';
        }

        setTimeout(() => {
            // Trigger chart resize/redraw if in expert mode
            if (ModeManager.currentMode === 'expert' && UIManager.priceChart) {
                try {
                    UIManager.priceChart.resize();
                    if (UIManager.debouncedUpdateChart) {
                        UIManager.debouncedUpdateChart();
                    }
                } catch (error) {
                    console.error('Chart update failed:', error);
                }
            }

            // Update seasonal chart if exists
            if (UIManager.seasonalChart) {
                try {
                    UIManager.seasonalChart.resize();
                    UIManager.updateSeasonalChart();
                } catch (error) {
                    console.error('Seasonal chart update failed:', error);
                }
            }
        }, 100);
    }
};
