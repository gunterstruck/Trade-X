/**
 * Trade-X UI Manager
 * Manages all UI interactions, charts, modals, and visual updates
 */

const UIManager = {
    priceChart: null,
    seasonalChart: null,
    selectedSell: null,
    selectedBuy: null,
    setupUI() {
        DOMElements.resetBtn.addEventListener('click', () => StateManager.resetGame());
        DOMElements.cancelTradeBtn.addEventListener('click', () => this.closeModal(DOMElements.tradeModal));
        DOMElements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        DOMElements.undoBtn.addEventListener('click', () => StateManager.undo());
        DOMElements.redoBtn.addEventListener('click', () => StateManager.redo());
        DOMElements.helpBtn.addEventListener('click', () => this.showHelpModal());
        if (DOMElements.basisFeeSelector) DOMElements.basisFeeSelector.addEventListener('change', (e) => { StateManager.gameState.basisTradeFee = parseInt(e.target.value, 10); SoundManager.playSound('click'); if (this.selectedSell && this.selectedBuy) this.checkTradeReady(); });
        if (DOMElements.endRoundBtn) DOMElements.endRoundBtn.addEventListener('click', () => GameEngine.advanceRound(false));
        if (DOMElements.systemSelector) DOMElements.systemSelector.addEventListener('change', e => { StateManager.gameState.economicSystem = e.target.value; SoundManager.playSound('click'); this.updateSystemDetails(); });
        if (DOMElements.closeInfoBtn) DOMElements.closeInfoBtn.addEventListener('click', () => this.closeModal(DOMElements.infoModal));
        if (DOMElements.marketInfluenceSlider) DOMElements.marketInfluenceSlider.addEventListener('input', (e) => { DOMElements.influenceValue.textContent = `${parseFloat(e.target.value).toFixed(1)}x`; });
        if (DOMElements.marketVolatilitySlider) DOMElements.marketVolatilitySlider.addEventListener('input', (e) => { DOMElements.volatilityValue.textContent = `${parseFloat(e.target.value).toFixed(2)}x`; });
        if (DOMElements.resourceSetSelector) DOMElements.resourceSetSelector.addEventListener('change', () => StateManager.resetGame());
        if (DOMElements.startMonthSelector) DOMElements.startMonthSelector.addEventListener('change', () => StateManager.resetGame());
        if (DOMElements.toggleSeasonalChartBtn) {
            DOMElements.toggleSeasonalChartBtn.addEventListener('click', () => {
                const content = DOMElements.seasonalChartContent;
                const container = DOMElements.seasonalChartContainer;
                if (!content || !container) return;
                content.classList.toggle('hidden');
                const isHidden = content.classList.contains('hidden');
                DOMElements.toggleSeasonalChartBtn.textContent = isHidden ? '➕' : '➖';
                container.style.minHeight = isHidden ? 'auto' : '160px';
                SoundManager.playSound('click');
            });
        }
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') { this.closeModal(DOMElements.tradeModal); if (DOMElements.infoModal && !DOMElements.infoModal.classList.contains('hidden')) this.closeModal(DOMElements.infoModal); }
            if (e.key.toLowerCase() === 'f11') { e.preventDefault(); this.toggleFullscreen(); }
            if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); StateManager.undo(); }
            if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); StateManager.redo(); }
        });
        this.setupTabs();
        this.initializeCollapsibleTiles();
        ModeManager.initializeModeToggle();
    },
    updateResourceUI(resources) {
        ['priceContainer', 'sellOptions', 'buyOptions'].forEach(el => DOMElements[el] && (DOMElements[el].innerHTML = ''));
        const resourceCount = Object.keys(resources).length;
        const gridClass = resourceCount === 4 ? 'grid-cols-4' : (resourceCount > 7 ? 'grid-cols-4 sm:grid-cols-8' : 'grid-cols-3 sm:grid-cols-5');
        DOMElements.priceContainer && (DOMElements.priceContainer.className = `grid ${gridClass} gap-2 text-center w-full`);
        Object.keys(resources).forEach(key => {
            const res = resources[key];
            if (DOMElements.priceContainer) {
                const priceDiv = Object.assign(document.createElement('div'), { className: 'price-display p-2 rounded-lg border-l-4 flex flex-col items-center justify-center', style: `border-color: ${res.color}`, innerHTML: `<div class="resource-icon mb-1">${res.icon}</div><div id="price-value-${key}" class="text-xl font-black">4.0</div><div id="price-trend-${key}" class="text-sm ${ModeManager.currentMode === 'basis' ? 'hidden' : ''}">➡️</div>` });
                ModeManager.currentMode === 'expert' && priceDiv.addEventListener('click', () => this.showResourceInfo(key));
                DOMElements.priceContainer.appendChild(priceDiv);
            }
            ['sell', 'buy'].forEach(type => {
                const container = DOMElements[`${type}Options`];
                if (container) {
                    const btn = document.createElement('button');
                    Object.assign(btn, { innerHTML: `<div class="resource-icon mx-auto mb-1">${res.icon}</div><div class="text-xs font-medium">${res.name}</div>`, ariaLabel: `${res.name} ${type === 'sell' ? 'verkaufen' : 'erhalten'}`, className: 'trade-button glass-panel text-center rounded-lg hover:bg-slate-600 focus:outline-none transition-transform active:scale-95', onclick: () => (type === 'sell' ? this.selectSell(key) : this.selectBuy(key)) });
                    btn.dataset.resource = key;
                    container.appendChild(btn);
                }
            });
        });
    },
    setupTabs() {
        if (DOMElements.tabHistory) DOMElements.tabHistory.addEventListener('click', () => this.switchTab('history'));
        if (DOMElements.tabChart) DOMElements.tabChart.addEventListener('click', () => this.switchTab('chart'));
    },
    initializeCollapsibleTiles() {
        document.querySelectorAll('.tile-container .collapse-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tile = e.target.closest('.tile-container');
                if (tile) this.toggleTileCollapse(tile);
            });
        });
    },
    toggleTileCollapse(tile) {
        const btn = tile.querySelector('.collapse-btn');
        const content = tile.querySelector('.tile-content');
        const isCollapsed = tile.classList.toggle('collapsed');
        if (tile.id === 'steuerung-panel') {
            DOMElements.mainGrid.classList.toggle('collapsed', isCollapsed);
            const iconLeft = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
            const iconRight = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            if (btn) { btn.innerHTML = isCollapsed ? iconRight : iconLeft; btn.title = isCollapsed ? 'Steuerung einblenden' : 'Steuerung ausblenden'; }
        } else { if (btn) btn.textContent = isCollapsed ? '➕' : '➖'; }
        if (content) { content.style.display = isCollapsed ? 'none' : ''; isCollapsed ? this.deactivateTileEvents(content) : this.activateTileEvents(content); }
        SoundManager.playSound('click');
    },
    activateTileEvents(element) { element.querySelectorAll('[data-event-handler]').forEach(el => el.classList.remove('disabled')) },
    deactivateTileEvents(element) { element.querySelectorAll('[data-event-handler]').forEach(el => el.classList.add('disabled')) },
    selectSell(res) {
        SoundManager.playSound('click');
        this.selectedSell = res;
        this.updateTradeButtonsUI();
        this.updateTradingInsightsUI();
        if (window.innerWidth < 1024) if (DOMElements.handelsinterfacePanel) DOMElements.handelsinterfacePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.checkTradeReady();
    },
    selectBuy(res) {
        SoundManager.playSound('click');
        this.selectedBuy = res;
        this.updateTradeButtonsUI();
        this.checkTradeReady();
    },
    checkTradeReady() {
        if (!this.selectedSell || !this.selectedBuy) return;
        if (this.selectedSell === this.selectedBuy) {
            DOMElements.tradeSummary.innerHTML = `<span class="text-red-400">❌ Gleiche Ressource!</span>`;
            SoundManager.playSound('error');
            setTimeout(() => this.resetTradeSelection(), 1500);
            return;
        }
        const offer = GameEngine.calculateTradeOffer(this.selectedSell, this.selectedBuy);
        if (ModeManager.currentMode === 'expert' && offer.amountToGet <= 0) {
            this.showModalMessage("Handel nicht möglich!", "Dieser Handel ist aufgrund der aktuellen Marktpreise, Steuern oder Events nicht profitabel.", true);
            return;
        }

        let tradeDetailsHTML = `${offer.amountToGive} ${StateManager.gameState.resources[this.selectedSell].icon} → ${offer.amountToGet} ${StateManager.gameState.resources[this.selectedBuy].icon}`;
        if (offer.tax > 0) {
            const taxBreakdown = offer.taxEvents.map(e => `${e.tax} für ${e.name.split(' ')[0]}`).join(', ');
            tradeDetailsHTML = `
                <div class="flex items-center justify-center text-2xl">
                   <span>${offer.baseAmount} ${StateManager.gameState.resources[this.selectedSell].icon}</span>
                   <span class="mx-2 text-lg text-red-400 font-bold">+ ${offer.tax} 🃏</span>
                   <span class="mx-2 text-lg">→</span>
                   <span>${offer.amountToGet} ${StateManager.gameState.resources[this.selectedBuy].icon}</span>
                </div>
                <div class="text-xs text-gray-400 mt-2">Steuer von: ${taxBreakdown}</div>
            `;
        }
        DOMElements.modalTradeDetails.innerHTML = tradeDetailsHTML;

        DOMElements.confirmTradeBtn.onclick = () => GameEngine.executeTrade(this.selectedSell, this.selectedBuy);
        SoundManager.playSound('click');
        this.openModal(DOMElements.tradeModal);
    },
    resetTradeSelection() {
        this.selectedSell = null;
        this.selectedBuy = null;
        DOMElements.tradeSummary.innerHTML = '';
        this.updateTradeButtonsUI();
        this.updateTradingInsightsUI();
    },
    updateAllUI() {
        requestAnimationFrame(() => {
            if (!StateManager.gameState) return;
            this.updatePricesUI();
            this.updateUndoRedoButtons();
            this.updateTradeButtonsUI();
            this.updateTradingInsightsUI();
            this.updateTraderRank(); // Tycoon Edition
            if (ModeManager.currentMode === 'expert') {
                DOMElements.roundCounter && (DOMElements.roundCounter.textContent = StateManager.gameState.round);
                this.updateSystemDetails();
                this.updateActiveEventsUI();
                this.updateTradeHistoryUI();
                this.updateAnalysis();
                this.updateSeasonUI();
                this.debouncedUpdateChart && this.debouncedUpdateChart();
                this.updateSeasonalChartAnnotation();
                this.updateSliderDisplays();
            } else {
                const expertOnlyElements = [ DOMElements.systemDetails, DOMElements.activeEventsContainer, DOMElements.tradeHistory, DOMElements.volatilityStatus, DOMElements.tradeRecommendation, DOMElements.forecastText, DOMElements.seasonDisplay ];
                expertOnlyElements.forEach(el => el && (el.innerHTML = ''));
                UIManager.priceChart && (UIManager.priceChart.destroy(), UIManager.priceChart = null);
            }
        });
    },
    updatePricesUI() {
        Object.keys(StateManager.gameState.resources).forEach(key => {
            const valEl = document.getElementById(`price-value-${key}`), trendEl = document.getElementById(`price-trend-${key}`);
            if (!valEl) return;
            const hist = StateManager.gameState.priceHistory[key];
            if (!hist || hist.length === 0) return;
            const price = hist[hist.length - 1];
            const prev = hist[hist.length - 2] || price;
            const diff = price - prev;
            valEl.textContent = price.toFixed(ModeManager.currentMode === 'basis' ? 1 : 2);
            valEl.classList.remove('price-up', 'price-down');
            if (diff < -0.1) valEl.classList.add('price-down');
            if (diff > 0.1) valEl.classList.add('price-up');
            if (trendEl) trendEl.textContent = ModeManager.currentMode === 'expert' ? (diff > 0.5 ? '🚀' : diff > 0.1 ? '📈' : diff < -0.5 ? '💥' : diff < -0.1 ? '📉' : '➡️') : '';
        });
    },
    updateTradeButtonsUI() {
        const { resources } = StateManager.gameState;
        const unavailableResources = ModeManager.currentMode === 'expert' ? StateManager.gameState.unavailableResources : [];
        const updateButton = (btn, isSelected, isDisabled, needsOverlay) => {
            if (!btn) return;
            btn.classList.toggle('selected-trade', isSelected);
            btn.disabled = isDisabled;
            let overlay = btn.querySelector('.unavailable-overlay');
            if (needsOverlay && !overlay) {
                overlay = Object.assign(document.createElement('div'), { className: 'unavailable-overlay', innerHTML: '❌', style: 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.6); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; border-radius: 0.5rem;' });
                btn.appendChild(overlay);
            } else if (!needsOverlay && overlay) overlay.remove();
        };
        Object.keys(resources).forEach(key => {
            const isUnavailableForPurchase = unavailableResources.includes(key);
            const sellBtn = document.querySelector(`#sell-options .trade-button[data-resource="${key}"]`);
            updateButton(sellBtn, this.selectedSell === key, false, false);
            const buyBtn = document.querySelector(`#buy-options .trade-button[data-resource="${key}"]`);
            updateButton(buyBtn, this.selectedBuy === key, isUnavailableForPurchase || !this.selectedSell, isUnavailableForPurchase);
        });
    },
    updateSystemDetails() {
        if (ModeManager.currentMode !== 'expert' || !DOMElements.systemDetails) return;
        const s = CONFIG.ECONOMIC_SYSTEMS[StateManager.gameState.economicSystem];
        DOMElements.systemDetails.innerHTML = `<div class="space-y-1"><div class="flex justify-between"><span>Handkarten-Limit:</span><b>${s.handLimit === null ? '∞' : s.handLimit}</b></div><div class="flex justify-between"><span>Gemeinschaftstopf:</span><b>${s.hasSharedPool ? 'Ja' : 'Nein'}</b></div><div class="flex justify-between"><span>Bürokratie-Kosten:</span><b>${s.bureaucracyCost || 'Keine'}</b></div><div class="mt-2 p-1 bg-slate-700 rounded">${s.description}</div></div>`;
    },
    updateActiveEventsUI() {
        if (ModeManager.currentMode !== 'expert' || !DOMElements.activeEventsContainer) return;
        if (StateManager.gameState.activeEvents.length === 0) { DOMElements.activeEventsContainer.innerHTML = `<div class="stats-card rounded-lg p-2 text-center text-gray-400"><div class="text-lg mb-1">🌙</div><p class="text-xs">Markt ruhig</p></div>`; return; }
        // Security: Escape user-controllable content to prevent XSS
        DOMElements.activeEventsContainer.innerHTML = StateManager.gameState.activeEvents.map(activeEvent => {
            const eventConfig = CONFIG.EVENTS[activeEvent.key];
            const bannerClass = { critical: 'border-red-500', warning: 'border-yellow-500', info: 'border-blue-500', success: 'border-green-500' }[eventConfig.banner];
            let effectText = eventConfig.effectText;
            if (activeEvent.targetResource) effectText += ` (${StateManager.gameState.resources[activeEvent.targetResource].icon})`;
            return `<div class="stats-card ${bannerClass} border-l-4 p-2 mb-2"><div class="flex justify-between items-start"><h6 class="font-bold text-white">${escapeHTML(eventConfig.name)}</h6><div class="text-gray-400 text-xs whitespace-nowrap pl-2">⏱️ ${activeEvent.duration}R</div></div><p class="text-xs mt-1 mb-2 text-gray-300 italic">"${escapeHTML(eventConfig.story)}"</p><div class="text-xs space-y-1"><p><b>Auswirkung:</b> ${effectText}</p></div></div>`;
        }).join('');
    },
    updateTradeHistoryUI() {
        if (ModeManager.currentMode !== 'expert' || !DOMElements.tradeHistory) return;
        DOMElements.tradeHistory.innerHTML = StateManager.gameState.tradeHistory.length === 0 ? `<div class="text-center py-4 text-gray-500"><div class="text-lg mb-1">📊</div><p class="text-xs">Keine Trades</p></div>` : StateManager.gameState.tradeHistory.map(t => { const eff = (t.getAmount * 4) / t.giveAmount; const c = eff > 1.5 ? 'text-green-400' : eff > 1.0 ? 'text-green-300' : eff > 0.7 ? 'text-yellow-400' : 'text-red-400'; const i = eff > 1.5 ? '🎉' : eff > 1.0 ? '👍' : eff > 0.7 ? '📊' : '💸'; return `<div class="${c}">R${t.round}: ${t.giveAmount} ${StateManager.gameState.resources[t.sell].icon} → ${t.getAmount} ${StateManager.gameState.resources[t.buy].icon} ${i}</div>`; }).join('');
    },
    updateAnalysis() {
        if (ModeManager.currentMode !== 'expert') return;
        const prices = Object.values(StateManager.gameState.priceHistory).map(h => h[h.length - 1]);
        const vol = Math.max(...prices) - Math.min(...prices);
        let s = 'NIEDRIG', c = 'text-green-400', volTooltip = 'Geringe Preisänderungen erwartet.';
        if (vol > 4) { s = 'EXTREM'; c = 'text-red-400'; volTooltip = 'Sehr starke Preissprünge sind wahrscheinlich!'; }
        else if (vol > 2.5) { s = 'HOCH'; c = 'text-yellow-400'; volTooltip = 'Stärkere Preisänderungen erwartet.'; }
        if (DOMElements.volatilityStatus) { DOMElements.volatilityStatus.textContent = s; DOMElements.volatilityStatus.className = `ml-1 font-bold ${c}`; }
        if (DOMElements.volatilityContainer) DOMElements.volatilityContainer.title = volTooltip;

        const currentPrices = Object.entries(StateManager.gameState.priceHistory).map(([key, hist]) => [key, hist[hist.length - 1]]);
        const cheap = currentPrices.reduce((a, b) => a[1] < b[1] ? a : b);
        const exp = currentPrices.reduce((a, b) => a[1] > b[1] ? a : b);

        let recTooltip = 'Die Preise sind moderat. Abwarten könnte sich lohnen.';
        if (DOMElements.tradeRecommendation) {
            if (cheap[1] < 2.5) { DOMElements.tradeRecommendation.textContent = `${StateManager.gameState.resources[cheap[0]].icon} KAUFEN`; DOMElements.tradeRecommendation.className = 'ml-1 font-bold text-green-400'; recTooltip = `Dieser Rohstoff (${StateManager.gameState.resources[cheap[0]].name}) ist aktuell sehr günstig. Eine gute Kaufgelegenheit.`; }
            else if (exp[1] > 6) { DOMElements.tradeRecommendation.textContent = `${StateManager.gameState.resources[exp[0]].icon} VERKAUFEN`; DOMElements.tradeRecommendation.className = 'ml-1 font-bold text-red-400'; recTooltip = `Dieser Rohstoff (${StateManager.gameState.resources[exp[0]].name}) ist aktuell sehr teuer. Eine gute Verkaufsgelegenheit.`; }
            else { DOMElements.tradeRecommendation.textContent = 'HALTEN'; DOMElements.tradeRecommendation.className = 'ml-1 font-bold text-gray-400'; }
        }
        if (DOMElements.recommendationContainer) DOMElements.recommendationContainer.title = recTooltip;
        if (DOMElements.forecastText) DOMElements.forecastText.textContent = StateManager.gameState.activeEvents.length > 0 ? 'Volatil durch Events' : 'Stabil';
    },
    updateSeasonUI() {
        if (ModeManager.currentMode !== 'expert' || !DOMElements.seasonDisplay) return;
        const round = StateManager.gameState.round, year = Math.floor((round - 1) / 12) + 1, seasonKey = StateManager.gameState.season, season = CONFIG.SEASONS[seasonKey], monthOfSeason = ((round - 1) % 3) + 1;
        DOMElements.seasonDisplay.innerHTML = `<span class="text-sm font-bold">${season.name} ${season.icon}</span><span class="block text-xl font-black gradient-text">Jahr ${year}</span><span class="text-xs text-gray-400">(Monat ${monthOfSeason}/3)</span>`;
    },
    updateTradingInsightsUI() {
        const insightsEl = DOMElements.tradingInsightsWrapper;
        if (!insightsEl) return;
        if (ModeManager.currentMode === 'expert') {
            let htmlContent = '';
            if (this.selectedSell) {
                const sellRes = StateManager.gameState.resources[this.selectedSell];
                htmlContent = `<div class="stats-card p-2 rounded border-l-2 border-blue-500 h-full flex flex-col"><div class="font-bold">Angebote für ${sellRes.icon}:</div><div class="space-y-1 mt-1 text-xs scrollable-content pr-1 flex-grow">`;
                for (const buyKey of Object.keys(StateManager.gameState.resources)) {
                    if (buyKey === this.selectedSell) continue;
                    const offer = GameEngine.calculateTradeOffer(this.selectedSell, buyKey), buyRes = StateManager.gameState.resources[buyKey];
                    const isUnavailable = StateManager.gameState.unavailableResources.includes(buyKey), unavailableClass = isUnavailable ? 'opacity-50' : '', unavailableText = isUnavailable ? ' (nicht verfügbar)' : '';
                    if (offer.amountToGet > 0) htmlContent += `<div class="p-1 rounded bg-slate-800/50 ${unavailableClass}"><span>${String(offer.amountToGive).padStart(2, ' ')} ${sellRes.icon} → </span><span class="font-bold text-green-300">${String(offer.amountToGet).padStart(2, ' ')} ${buyRes.icon}</span>${unavailableText}</div>`;
                    else htmlContent += `<div class="p-1 rounded opacity-50"><span>${sellRes.icon} → ${buyRes.icon} (n.m.)</span></div>`;
                }
                htmlContent += `</div></div>`;
            } else {
                const eff = StateManager.gameState.sessionTotalGive > 0 ? ((StateManager.gameState.sessionTotalGet * 4) / StateManager.gameState.sessionTotalGive) * 100 : 0;
                let best = { efficiency: 0 };
                for (const sellRes of Object.keys(StateManager.gameState.resources)) for (const buyRes of Object.keys(StateManager.gameState.resources)) { if (sellRes === buyRes || StateManager.gameState.unavailableResources.includes(buyRes)) continue; const offer = GameEngine.calculateTradeOffer(sellRes, buyRes); if (offer.amountToGet > 0) { const e = (offer.amountToGet * 4) / offer.amountToGive; if (e > best.efficiency) best = { ...offer, sellRes, buyRes, efficiency: e }; } }
                htmlContent = `<div class="grid grid-cols-2 gap-2 h-full"><div class="stats-card p-2 rounded border-l-2 border-blue-500"><div class="font-bold">Diese Session:</div><div>🔄 <span>${StateManager.gameState.sessionTrades}</span> Trades</div><div>📈 <span>${eff.toFixed(0)}%</span> Effizienz</div></div><div class="stats-card p-2 rounded border-l-2 border-green-500"><div class="font-bold text-green-300">💰 Beste Chance:</div><div>${best.sellRes ? `${best.amountToGive} ${StateManager.gameState.resources[best.sellRes].icon} → ${best.amountToGet} ${StateManager.gameState.resources[best.buyRes].icon}` : 'Keine'}</div></div></div>`;
            }
            insightsEl.innerHTML = htmlContent;
        } else {
            let htmlContent = `<div class="stats-card rounded-lg p-2">`;
            if (this.selectedSell) {
                const sellRes = StateManager.gameState.resources[this.selectedSell];
                htmlContent += `<h3 class="text-sm font-bold mb-2 text-blue-300">💡 Handels-Angebote für ${sellRes.name}</h3><div class="text-xs space-y-1">`;
                for (const buyKey of Object.keys(StateManager.gameState.resources)) {
                    if (buyKey === this.selectedSell) continue;
                    const offer = GameEngine.calculateTradeOffer(this.selectedSell, buyKey), buyRes = StateManager.gameState.resources[buyKey];
                    htmlContent += `<div class="flex justify-between items-center p-1 rounded bg-slate-800/50"><span>${offer.amountToGive} ${sellRes.icon}</span><span>→</span><span class="font-bold text-green-300">${offer.amountToGet} ${buyRes.icon}</span></div>`;
                }
                htmlContent += `</div>`;
            } else htmlContent += `<h3 class="text-sm font-bold mb-2 text-blue-300">💡 Handels-Angebote</h3><div class="text-center text-gray-400">Wähle eine Ressource zum Verkaufen</div>`;
            htmlContent += `</div>`;
            insightsEl.innerHTML = htmlContent;
        }
    },
    showEventBanner(event) {
        if (ModeManager.currentMode !== 'expert' || !DOMElements.eventBannerContainer) return;
        const c = DOMElements.eventBannerContainer, b = document.createElement('div'), cl = { critical: 'bg-red-600', warning: 'bg-yellow-600', info: 'bg-blue-600', success: 'bg-green-600' };
        b.className = `event-banner ${cl[event.banner]} p-4 text-center text-white font-bold shadow-2xl rounded-xl`;
        // Security: Escape event content to prevent XSS
        b.innerHTML = `<div class="text-2xl mb-2">${escapeHTML(event.name)}</div><div class="text-sm opacity-90">${escapeHTML(event.description)}</div>`;
        c.innerHTML = ''; c.appendChild(b);
        setTimeout(() => { b.classList.add('event-banner-out'); setTimeout(() => b.remove(), 600); }, (event.duration || 3) * CONFIG.UI.BANNER_DISPLAY_TIME_FACTOR);
    },
    debouncedUpdateChart: null,
    initChart() {
        if (ModeManager.currentMode !== 'expert') return;
        setTimeout(() => {
            const canvas = document.getElementById('price-chart');
            if (!canvas || typeof Chart === 'undefined') return;
            if (this.priceChart) { this.priceChart.destroy(); this.priceChart = null; }
            try {
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                canvas.style.display = 'block';
                this.priceChart = new Chart(ctx, { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8', font: { size: 9 } } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } } }, plugins: { legend: { display: true, position: 'top', labels: { color: '#f1f5f9', font: { size: 10 }, usePointStyle: true } }, tooltip: { backgroundColor: 'rgba(30, 41, 59, 0.95)', titleColor: '#f1f5f9', bodyColor: '#e2e8f0', borderColor: 'rgba(148, 163, 184, 0.2)', borderWidth: 1, cornerRadius: 8 } } } });
                if (!this.debouncedUpdateChart) this.debouncedUpdateChart = debounce(() => this.updateChart(), CONFIG.UI.CHART_UPDATE_DEBOUNCE);
                this.updateChart();
            } catch (error) { console.error('Failed to initialize chart:', error); handleGameError(new GameError('Chart konnte nicht initialisiert werden', 'UI_ERROR')); }
        }, 200);
    },
    updateChart() {
        if (!this.priceChart || ModeManager.currentMode !== 'expert' || !StateManager.gameState) return;
        try {
            const { resources, priceHistory, round } = StateManager.gameState;
            this.priceChart.data.datasets = Object.keys(resources).map(key => ({ label: resources[key].name, data: priceHistory[key] || [], borderColor: resources[key].color, backgroundColor: resources[key].color + '33', tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: false }));
            const maxLen = Math.max(...Object.values(priceHistory).map(h => h.length));
            this.priceChart.data.labels = Array.from({ length: maxLen }, (_, i) => Math.max(1, round - maxLen + i + 1));
            this.priceChart.update('none');
        } catch (error) { console.error('Failed to update chart:', error); }
    },
    initSeasonalChart() {
        if (ModeManager.currentMode !== 'expert' || !DOMElements.seasonalChart) return;
        if (this.seasonalChart) { this.seasonalChart.destroy(); this.seasonalChart = null; }
        try {
            const ctx = DOMElements.seasonalChart.getContext('2d');
            if (!ctx) return;
            const getSeasonalModifier = (resourceKey, monthIndex) => { let seasonKey; if (monthIndex < 3) seasonKey = 'fruehling'; else if (monthIndex < 6) seasonKey = 'sommer'; else if (monthIndex < 9) seasonKey = 'herbst'; else seasonKey = 'winter'; return CONFIG.SEASONS[seasonKey]?.effects[resourceKey] || 0; };
            const resources = getResourcesForSet(DOMElements.resourceSetSelector.value);
            const datasets = Object.keys(resources).map(key => { if (key === GOLD_RESOURCE_KEY) return null; return { label: resources[key].name, data: Array.from({ length: 12 }, (_, i) => getSeasonalModifier(key, i)), borderColor: resources[key].color, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 2, pointHoverRadius: 5, tension: 0.1 }; }).filter(Boolean);
            this.seasonalChart = new Chart(ctx, {
                type: 'line',
                data: { labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'], datasets: datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { title: { display: true, text: 'Preis-Modifikator', color: '#94a3b8', font: { size: 9 } }, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8', font: { size: 9 } } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } } },
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: 'rgba(30, 41, 59, 0.95)', titleColor: '#f1f5f9', bodyColor: '#e2e8f0', mode: 'index', intersect: false },
                        annotation: {
                            annotations: {
                                currentMonthLine: {
                                    type: 'line', scaleID: 'x', value: 'Jan', borderColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 2, borderDash: [6, 6],
                                    label: { enabled: true, content: 'Jetzt', position: 'start', backgroundColor: 'rgba(255, 255, 255, 0.7)', color: '#0f172a', font: { weight: 'bold' } }
                                }
                            }
                        }
                    }
                }
            });
            this.updateSeasonalChartAnnotation();
        } catch (error) { console.error('Failed to initialize seasonal chart:', error); }
    },
    updateSeasonalChartAnnotation() {
        if (!this.seasonalChart || ModeManager.currentMode !== 'expert' || !StateManager.gameState) return;
        try {
            const monthIndex = (StateManager.gameState.round - 1) % 12;
            const monthLabel = this.seasonalChart.data.labels[monthIndex];
            this.seasonalChart.options.plugins.annotation.annotations.currentMonthLine.value = monthLabel;
            this.seasonalChart.update('none');
        } catch (error) { console.error('Failed to update seasonal chart annotation:', error); }
    },
    updateUndoRedoButtons() {
        DOMElements.undoBtn.disabled = StateManager.gameState.historyIndex <= 0;
        DOMElements.redoBtn.disabled = StateManager.gameState.historyIndex >= StateManager.gameState.history.length - 1;
    },
    updateSliderDisplays() {
        if (DOMElements.marketInfluenceSlider) DOMElements.influenceValue.textContent = `${parseFloat(DOMElements.marketInfluenceSlider.value).toFixed(1)}x`;
        if (DOMElements.marketVolatilitySlider) DOMElements.volatilityValue.textContent = `${parseFloat(DOMElements.marketVolatilitySlider.value).toFixed(2)}x`;
    },
    openModal(modal) {
        SoundManager.playSound('click');
        document.querySelector('.main-grid').style.pointerEvents = 'none';
        modal.classList.remove('hidden');
        setTimeout(() => modal.querySelector('.transform').classList.remove('scale-95', 'opacity-0'), 10);
    },
    closeModal(modal) {
        SoundManager.playSound('click');
        document.querySelector('.main-grid').style.pointerEvents = 'auto';
        modal.querySelector('.transform').classList.add('scale-95', 'opacity-0');
        setTimeout(() => modal.classList.add('hidden'), CONFIG.UI.MODAL_ANIMATION_DURATION);
        this.resetTradeSelection();
    },
    showModalMessage(title, message, isError = false) {
        DOMElements.modalTradeDetails.innerHTML = `<b class="block mb-2 text-xl ${isError ? 'text-red-400' : 'text-blue-400'}">${title}</b><p class="text-base">${message}</p>`;
        DOMElements.confirmTradeBtn.classList.add('hidden');
        DOMElements.cancelTradeBtn.textContent = "💡 OK";
        DOMElements.cancelTradeBtn.className = "bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-transform hover:scale-105";
        DOMElements.cancelTradeBtn.onclick = () => { this.closeModal(DOMElements.tradeModal); DOMElements.confirmTradeBtn.classList.remove('hidden'); DOMElements.cancelTradeBtn.textContent = "❌ Abbrechen"; DOMElements.cancelTradeBtn.className = "bg-red-600 hover:red-bg-700 text-white font-bold py-3 px-8 rounded-xl transition-transform hover:scale-105"; };
        this.openModal(DOMElements.tradeModal);
    },
    showInfoMessage(title, bodyHTML, icon = '💡', allowHTML = false) {
        if (!DOMElements.infoModal) return;
        if (DOMElements.infoModalIcon) DOMElements.infoModalIcon.textContent = icon;
        if (DOMElements.infoModalTitle) DOMElements.infoModalTitle.textContent = title;
        // Security: Only allow HTML for trusted internal content, escape everything else
        if (DOMElements.infoModalBody) {
            if (allowHTML) {
                // Only for internal trusted content (help modal, etc.)
                DOMElements.infoModalBody.innerHTML = bodyHTML;
            } else {
                // Escape all user-controllable content
                DOMElements.infoModalBody.textContent = bodyHTML;
            }
        }
        this.openModal(DOMElements.infoModal);
    },
    showHelpModal() {
        const helpContentData = {
            tabs: [
                { id: 'modi', label: 'Spielmodi', content: [ { title: '🟢 Modus: Einfach', text: 'Ideal für Einsteiger oder eine schnelle Runde. Die Preise ändern sich nur direkt durch Handel. Es gibt keine komplexen Events oder Wirtschaftssysteme.' }, { title: '🔴 Modus: Vollständig', text: 'Die volle Simulation! Hier beeinflussen Jahreszeiten, Wirtschaftssysteme, zufällige Events und der allgemeine Marktdruck die Preise. Dieser Modus bietet mehr Tiefe und strategische Möglichkeiten.' } ]},
                { id: 'handel', label: 'Handel', content: [ { title: 'Handel im "Einfach"-Modus', text: 'Die Kosten sind vorhersehbar. Du zahlst immer eine Grundgebühr (einstellbar), 1 Karte deines Rohstoffs und eine eventuelle Preisdifferenz. Gibst du eine teure Karte für eine billige ab, erhältst du mehr zurück.' }, { title: 'Handel im "Vollständig"-Modus', text: 'Jeder Handel beeinflusst den Markt. Wenn du viel von einer Ressource verkaufst, sinkt ihr Preis. Kaufst du viel, steigt er. Der "Markteinfluss"-Regler bestimmt, wie stark deine Aktionen die Preise verändern.' } ]},
                { id: 'systeme', label: 'Systeme', expertOnly: true, content: [ { title: '🔥 Freier Markt', text: 'Hohe Preisschwankungen, keine Handkartenlimits. Ein riskantes System mit hohen potenziellen Gewinnen und Verlusten.' }, { title: '🤝 Soziale Marktwirtschaft', text: 'Ein ausbalanciertes System mit moderaten Preisen und einem Handkartenlimit. Bestimmte Ressourcen können temporär vom Markt genommen werden, um Monopole zu verhindern.' }, { title: '⚖️ Planwirtschaft', text: 'Stabile, staatlich kontrollierte Preise und ein strenges Handkartenlimit. Ein Teil der Handelserträge fließt in einen Gemeinschaftstopf, der periodisch umverteilt wird.' } ]},
                { id: 'events', label: 'Events', expertOnly: true, content: [ { title: '⚡ Zufällige Events', text: 'Im "Vollständig"-Modus können jederzeit zufällige Ereignisse eintreten, die den Markt beeinflussen. Achte auf die Banner am oberen Bildschirmrand!' }, { title: 'Positive Events', text: '(<b class="text-green-400">z.B. Erntefest</b>) senken die Preise.', type: 'list-item' }, { title: 'Negative Events', text: '(<b class="text-yellow-400">z.B. Dürre</b>) erhöhen die Preise.', type: 'list-item' }, { title: 'Schock-Events', text: '(<b class="text-red-400">z.B. Marktcrash</b>) können die Preise dramatisch verändern.', type: 'list-item' } ]}
            ]
        };
        const icon = '📖', title = 'Hilfe & Spielregeln';
        let tabsHtml = '', contentHtml = '', firstTabId = '';
        helpContentData.tabs.forEach((tab, index) => {
            if (tab.expertOnly && ModeManager.currentMode === 'basis') return;
            if (!firstTabId) firstTabId = tab.id;
            tabsHtml += `<button data-tab="${tab.id}" class="help-tab-button ${index === 0 ? 'active' : ''} font-bold p-2 flex-1 ${tab.expertOnly ? 'expert-only' : ''}">${tab.label}</button>`;
            let tabContentBody = '';
            tab.content.forEach(item => { tabContentBody += item.type === 'list-item' ? `<li><b class="${item.textColor || ''}">${item.title}</b> ${item.text}</li>` : `<div><h4 class="font-bold">${item.title}</h4><p>${item.text}</p></div>`; });
            contentHtml += `<div id="help-${tab.id}" class="help-tab-content ${index === 0 ? '' : 'hidden'} space-y-3">${tab.id === 'events' ? '<ul class="list-disc list-inside mt-2 text-gray-400 text-sm">' + tabContentBody + '</ul>' : tabContentBody}</div>`;
        });
        const body = `<div class="flex border-b border-slate-600 mb-4">${tabsHtml}</div><div class="scrollable-content pr-2" style="max-height: 50vh;">${contentHtml}</div>`;
        // Allow HTML for trusted internal help content
        this.showInfoMessage(title, body, icon, true);
        const modalBody = DOMElements.infoModalBody;
        modalBody.querySelectorAll('.help-tab-button').forEach(btn => btn.addEventListener('click', () => { const tabId = btn.dataset.tab; modalBody.querySelectorAll('.help-tab-button').forEach(b => b.classList.remove('active')); btn.classList.add('active'); modalBody.querySelectorAll('.help-tab-content').forEach(content => content.classList.add('hidden')); modalBody.querySelector(`#help-${tabId}`).classList.remove('hidden'); }));
        if (firstTabId) modalBody.querySelector(`.help-tab-button[data-tab="${firstTabId}"]`)?.click();
    },
    // Tycoon Edition: Show floating profit text
    showFloatingProfit(profitAmount, x, y) {
        const floatingDiv = document.createElement('div');
        floatingDiv.className = 'floating-profit';
        floatingDiv.style.left = `${x}px`;
        floatingDiv.style.top = `${y}px`;

        // Determine color and emoji based on profit
        let color = '#22c55e'; // green
        let emoji = '💰';
        if (profitAmount >= 20) {
            color = '#fbbf24'; // gold
            emoji = '💎';
        } else if (profitAmount >= 10) {
            color = '#10b981'; // emerald
            emoji = '💵';
        }

        floatingDiv.style.color = color;
        floatingDiv.textContent = `+${profitAmount} ${emoji}`;
        document.body.appendChild(floatingDiv);

        // Remove after animation completes
        setTimeout(() => floatingDiv.remove(), 2000);
    },
    // Tycoon Edition: Flash trade button
    flashTradeButton(buttonElement) {
        if (!buttonElement) return;
        buttonElement.classList.add('button-flash');
        setTimeout(() => buttonElement.classList.remove('button-flash'), 600);
    },
    // Tycoon Edition: Get trader rank based on trades and profit
    getTraderRank() {
        const trades = StateManager.gameState?.totalTrades || 0;
        const profit = StateManager.gameState?.totalProfit || 0;

        const ranks = [
            { name: 'Neuling', minTrades: 0, minProfit: 0, emoji: '🌱' },
            { name: 'Straßenhändler', minTrades: 5, minProfit: 20, emoji: '🛒' },
            { name: 'Händler', minTrades: 15, minProfit: 75, emoji: '🏪' },
            { name: 'Kaufmann', minTrades: 30, minProfit: 200, emoji: '💼' },
            { name: 'Großhändler', minTrades: 50, minProfit: 400, emoji: '🏢' },
            { name: 'Großinvestor', minTrades: 80, minProfit: 700, emoji: '💎' },
            { name: 'Markt-Tycoon', minTrades: 120, minProfit: 1200, emoji: '👑' },
            { name: 'Handels-Legende', minTrades: 200, minProfit: 2500, emoji: '🌟' }
        ];

        let currentRank = ranks[0];
        let nextRank = ranks[1];

        for (let i = ranks.length - 1; i >= 0; i--) {
            if (trades >= ranks[i].minTrades && profit >= ranks[i].minProfit) {
                currentRank = ranks[i];
                nextRank = ranks[i + 1] || null;
                break;
            }
        }

        return { current: currentRank, next: nextRank, trades, profit };
    },
    // Tycoon Edition: Update trader rank display
    updateTraderRank() {
        const rankInfo = this.getTraderRank();
        const rankNameEl = document.getElementById('rank-name');
        const rankProgressEl = document.getElementById('rank-progress');

        if (rankNameEl) {
            rankNameEl.textContent = `${rankInfo.current.emoji} ${rankInfo.current.name}`;
        }

        if (rankProgressEl) {
            if (rankInfo.next) {
                const tradesNeeded = rankInfo.next.minTrades - rankInfo.trades;
                const profitNeeded = rankInfo.next.minProfit - rankInfo.profit;
                rankProgressEl.textContent = `${rankInfo.trades} Trades | Nächster: ${Math.max(tradesNeeded, 0)}T, ${Math.max(profitNeeded, 0)}P`;
            } else {
                rankProgressEl.textContent = `${rankInfo.trades} Trades | MAX LEVEL!`;
            }
        }
    },
    async toggleFullscreen() {
        if (!document.fullscreenElement) { try { await document.documentElement.requestFullscreen(); } catch (e) { console.error(e); this.showInfoMessage('Vollbild nicht verfügbar', 'Der Vollbild-Modus wird in dieser Vorschau-Umgebung möglicherweise durch Berechtigungen blockiert.', '⚠️'); } }
        else if (document.exitFullscreen) await document.exitFullscreen();
        setTimeout(() => this.updateFullscreenIcon(), 100);
    },
    updateFullscreenIcon() {
        const isFullscreen = !!document.fullscreenElement;
        DOMElements.fullscreenIconOpen.classList.toggle('hidden', isFullscreen);
        DOMElements.fullscreenIconClose.classList.toggle('hidden', !isFullscreen);
    },
    switchTab(tab) {
        if (ModeManager.currentMode !== 'expert') return;
        SoundManager.playSound('click');
        document.querySelectorAll('#insights-panel .tab-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tab-${tab}`)?.classList.add('active');
        const historyContent = document.getElementById('tab-content-history'), chartContent = document.getElementById('tab-content-chart');
        if (tab === 'history') { if(historyContent) historyContent.classList.remove('hidden'); if(chartContent) chartContent.classList.add('hidden'); }
        else {
            if(historyContent) historyContent.classList.add('hidden'); if(chartContent) chartContent.classList.remove('hidden');
            setTimeout(() => { if (!this.priceChart) this.initChart(); else { this.priceChart.resize(); if (this.debouncedUpdateChart) this.debouncedUpdateChart(); } }, 50);
        }
    },
    showResourceInfo(key) {
        if (ModeManager.currentMode === 'basis' || !DOMElements.infoModal) return;
        const res = StateManager.gameState.resources[key], history = StateManager.gameState.priceHistory[key];
        if (DOMElements.infoModalIcon) DOMElements.infoModalIcon.innerHTML = `<div class="resource-icon mx-auto w-16 h-16 flex items-center justify-center text-4xl">${res.icon}</div>`;
        if (DOMElements.infoModalTitle) DOMElements.infoModalTitle.textContent = res.name;
        // Security: Use template with safe data (no user input)
        if (DOMElements.infoModalBody) DOMElements.infoModalBody.innerHTML = `<p>Aktueller Preis: <b class="text-white">${history[history.length - 1].toFixed(2)}</b></p><p>Durchschnitt (letzte 10 Runden): <b class="text-white">${(history.reduce((a, b) => a + b, 0) / history.length).toFixed(2)}</b></p><p>Historie (letzte 10 Runden): <b class="text-green-400">${Math.min(...history).toFixed(2)}</b> - <b class="text-red-400">${Math.max(...history).toFixed(2)}</b></p>`;
        this.openModal(DOMElements.infoModal);
    },
};
