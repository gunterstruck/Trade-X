/**
 * Trade-X Game Engine
 * Contains all game logic: trading, pricing, events, and season management
 */

const GameEngine = {
    getRandomGaussian(min, max, sums = 3) {
        let randSum = 0;
        for (let i = 0; i < sums; i++) { randSum += Math.random(); }
        const scaledRand = randSum / sums;
        return min + scaledRand * (max - min);
    },
    calculateTradeOffer(sellRes, buyRes) {
        return ModeManager.currentMode === 'basis' ? this.calculateBasisTradeOffer(sellRes, buyRes) : this.calculateExpertTradeOffer(sellRes, buyRes);
    },
    calculateBasisTradeOffer(sellRes, buyRes) {
        const priceOfBuy = StateManager.gameState.prices[buyRes];
        const priceOfSell = StateManager.gameState.prices[sellRes];
        const basisTradeFee = StateManager.gameState.basisTradeFee;
        const priceDifference = priceOfSell - priceOfBuy;
        const bonusGet = Math.max(0, priceDifference);
        const extraGive = Math.max(0, -priceDifference);
        const amountToGive = basisTradeFee + 1 + extraGive;
        const amountToGet = 1 + bonusGet;
        return { amountToGive: Math.round(amountToGive), amountToGet: Math.round(amountToGet), tax: 0, taxEvents: [] };
    },
    calculateExpertTradeOffer(sellRes, buyRes) {
        const priceHistoryBuy = StateManager.gameState.priceHistory[buyRes];
        const priceHistorySell = StateManager.gameState.priceHistory[sellRes];
        const priceOfBuy = priceHistoryBuy[priceHistoryBuy.length - 1];
        const priceOfSell = priceHistorySell[priceHistorySell.length - 1];

        if (typeof priceOfSell !== 'number' || typeof priceOfBuy !== 'number') return { amountToGive: 0, amountToGet: 0, tax: 0, taxEvents: [] };

        const roundedPriceDiff = Math.round(priceOfBuy - priceOfSell);
        let amountToGive = Math.max(1, 1 + roundedPriceDiff);
        let amountToGet = Math.max(1, 1 - roundedPriceDiff);

        const system = CONFIG.ECONOMIC_SYSTEMS[StateManager.gameState.economicSystem];
        if (system.name === 'Soziale Marktwirtschaft') amountToGive += 1;
        else if (system.name === 'Planwirtschaft') amountToGive += 2;

        let totalTax = 0;
        const taxEvents = [];
        StateManager.gameState.activeEvents.forEach(activeEvent => {
            if (activeEvent.tax && activeEvent.tax > 0) {
                totalTax += activeEvent.tax;
                taxEvents.push({ name: activeEvent.name, tax: activeEvent.tax });
            }
        });

        const finalAmountToGive = amountToGive + totalTax;

        return { amountToGive: finalAmountToGive, amountToGet, tax: totalTax, taxEvents, baseAmount: amountToGive };
    },
    validateTradeOffer(sellRes, buyRes, amounts) {
        if (!StateManager.gameState.resources[sellRes] || !StateManager.gameState.resources[buyRes]) throw new GameError('Ungültige Ressource ausgewählt.', 'TRADE_ERROR');
        if (ModeManager.currentMode === 'expert' && StateManager.gameState.unavailableResources?.includes(buyRes)) throw new GameError('Die Ressource, die du erhalten möchtest, ist derzeit nicht auf dem Markt verfügbar.', 'TRADE_ERROR');
        if (amounts.amountToGive <= 0 || amounts.amountToGet <= 0) throw new GameError('Ungültige Handelsmengen berechnet.', 'TRADE_ERROR');
        return true;
    },
    executeTrade(sellRes, buyRes) {
        try {
            const offer = this.calculateTradeOffer(sellRes, buyRes);
            this.validateTradeOffer(sellRes, buyRes, offer);
            StateManager.saveState();

            // Tycoon Edition: Calculate profit (value gained - value given)
            const profit = (offer.amountToGet * 4) - (offer.amountToGive * 4);

            // Store mouse position for floating text before closing modal
            const confirmBtn = DOMElements.confirmTradeBtn;
            const btnRect = confirmBtn?.getBoundingClientRect();
            const mouseX = btnRect ? btnRect.left + btnRect.width / 2 : window.innerWidth / 2;
            const mouseY = btnRect ? btnRect.top + btnRect.height / 2 : window.innerHeight / 2;

            UIManager.closeModal(DOMElements.tradeModal);

            if (ModeManager.currentMode === 'basis') {
                this.executeBasisTrade(sellRes, buyRes);
                // Tycoon Edition: Update total trades for basis mode (expert mode handles it in executeExpertTrade)
                StateManager.gameState.totalTrades = (StateManager.gameState.totalTrades || 0) + 1;
            } else {
                this.executeExpertTrade(sellRes, buyRes, offer.amountToGive, offer.amountToGet);
                // totalTrades is already incremented in executeExpertTrade
            }

            // Tycoon Edition: Update total profit
            StateManager.gameState.totalProfit = (StateManager.gameState.totalProfit || 0) + profit;

            // Tycoon Edition: Visual and audio feedback
            if (profit > 0) {
                UIManager.showFloatingProfit(profit, mouseX, mouseY);
                SoundManager.playProfitSound(profit);
                if (confirmBtn) UIManager.flashTradeButton(confirmBtn);
            } else {
                SoundManager.playSound('kaching');
            }

            UIManager.resetTradeSelection();
            UIManager.updateAllUI();
        } catch (error) { handleGameError(error); }
    },
    executeBasisTrade(sellRes, buyRes) {
        const newSellPrice = Math.max(CONFIG.GAME.MIN_RESOURCE_PRICE_BASIS, StateManager.gameState.prices[sellRes] - 1);
        const newBuyPrice = Math.min(CONFIG.GAME.MAX_RESOURCE_PRICE_BASIS, StateManager.gameState.prices[buyRes] + 1);
        StateManager.gameState.prices[sellRes] = newSellPrice;
        StateManager.gameState.prices[buyRes] = newBuyPrice;
        StateManager.gameState.priceHistory[sellRes].push(newSellPrice);
        StateManager.gameState.priceHistory[buyRes].push(newBuyPrice);
        if (StateManager.gameState.priceHistory[sellRes].length > CONFIG.GAME.PRICE_HISTORY_LENGTH_BASIS) StateManager.gameState.priceHistory[sellRes].shift();
        if (StateManager.gameState.priceHistory[buyRes].length > CONFIG.GAME.PRICE_HISTORY_LENGTH_BASIS) StateManager.gameState.priceHistory[buyRes].shift();
    },
    executeExpertTrade(sellRes, buyRes, giveAmount, getAmount) {
        const influence = parseFloat(DOMElements.marketInfluenceSlider?.value || 0.5);
        const pressure = 1;
        if (sellRes !== GOLD_RESOURCE_KEY) StateManager.gameState.marketPressure[sellRes] -= giveAmount * pressure * influence;
        if (buyRes !== GOLD_RESOURCE_KEY) StateManager.gameState.marketPressure[buyRes] += getAmount * pressure * influence;
        StateManager.gameState.sessionTrades++;
        StateManager.gameState.totalTrades++;
        StateManager.gameState.sessionTotalGive += giveAmount;
        StateManager.gameState.sessionTotalGet += getAmount;
        StateManager.gameState.tradeHistory.unshift({ round: StateManager.gameState.round, sell: sellRes, buy: buyRes, giveAmount, getAmount });
        if (StateManager.gameState.tradeHistory.length > CONFIG.GAME.MAX_TRADE_HISTORY) StateManager.gameState.tradeHistory.pop();
        this.advanceRound(true);
    },
    advanceRound(tradeMade) {
        if (ModeManager.currentMode !== 'expert' || (DOMElements.endRoundBtn?.disabled && !tradeMade)) return;
        StateManager.saveState();
        SoundManager.playSound('click');
        if (DOMElements.endRoundBtn) {
            DOMElements.endRoundBtn.innerHTML = '<div class="loading-spinner mx-auto"></div>';
            DOMElements.endRoundBtn.disabled = true;
        }
        setTimeout(() => {
            StateManager.gameState.round++;
            this.updateSeason();
            this.updatePrices();
            this.updateEvents();
            this.updateResourceAvailability();
            Object.keys(StateManager.gameState.resources).forEach(key => {
                if (key !== GOLD_RESOURCE_KEY) StateManager.gameState.marketPressure[key] *= 0.7;
            });
            UIManager.updateAllUI();
            if (DOMElements.endRoundBtn) {
                DOMElements.endRoundBtn.innerHTML = 'Runde beenden';
                DOMElements.endRoundBtn.disabled = false;
            }
        }, 600);
    },
    updateSeason() {
        const monthOfYear = (StateManager.gameState.round - 1) % 12;
        if (monthOfYear < 3)      StateManager.gameState.season = 'fruehling';
        else if (monthOfYear < 6) StateManager.gameState.season = 'sommer';
        else if (monthOfYear < 9) StateManager.gameState.season = 'herbst';
        else                      StateManager.gameState.season = 'winter';
    },
    updatePrices() {
        if (ModeManager.currentMode === 'basis') return;
        const system = CONFIG.ECONOMIC_SYSTEMS[StateManager.gameState.economicSystem];

        Object.keys(StateManager.gameState.resources).forEach(key => {
            if (key === GOLD_RESOURCE_KEY) return;

            const corePrice = this.calculateDynamicPrice(key, StateManager.gameState.prices[key]);
            StateManager.gameState.prices[key] = corePrice;

            let finalPrice = corePrice;
            const season = CONFIG.SEASONS[StateManager.gameState.season];
            if (season?.effects[key]) {
                finalPrice += season.effects[key];
            }
            finalPrice = Math.round(Math.max(system.minPrice, Math.min(system.maxPrice, finalPrice)) * 8) / 8;

            StateManager.gameState.priceHistory[key].push(finalPrice);
            if (StateManager.gameState.priceHistory[key].length > CONFIG.GAME.PRICE_HISTORY_LENGTH_EXPERT) {
                StateManager.gameState.priceHistory[key].shift();
            }
        });
    },
    calculateDynamicPrice(resource, basePrice) {
        if (ModeManager.currentMode === 'basis' || resource === GOLD_RESOURCE_KEY) return basePrice;

        const system = CONFIG.ECONOMIC_SYSTEMS[StateManager.gameState.economicSystem];
        const influenceMultiplier = parseFloat(DOMElements.marketInfluenceSlider?.value || 0.5);
        const volatilityInfluence = parseFloat(DOMElements.marketVolatilitySlider?.value || 0.5);

        const randomBase = this.getRandomGaussian(system.minPrice, system.maxPrice);
        let price = basePrice * (1 - volatilityInfluence) + randomBase * volatilityInfluence;

        price += (StateManager.gameState.marketPressure[resource] || 0) * (influenceMultiplier * 0.5);

        StateManager.gameState.activeEvents.forEach(activeEvent => {
            const eventLogic = CONFIG.EVENTS[activeEvent.key];
            if (eventLogic && eventLogic.modifier) {
                price = eventLogic.modifier(resource, price, activeEvent.targetResource);
            }
        });

        return Math.round(Math.max(system.minPrice, Math.min(system.maxPrice, price)) * 8) / 8;
    },
    updateEvents() {
        if (ModeManager.currentMode === 'basis') return;
        StateManager.gameState.activeEvents = StateManager.gameState.activeEvents.filter(event => --event.duration > 0);
        if (document.getElementById('events-panel')?.classList.contains('collapsed')) return;
        if (Math.random() < 0.15) {
            const keys = Object.keys(CONFIG.EVENTS).filter(k => CONFIG.EVENTS[k].type === 'mini');
            this.triggerEvent(keys[Math.floor(Math.random() * keys.length)]);
        }
        const sinceLast = StateManager.gameState.round - StateManager.gameState.lastGlobalEventRound;
        if (sinceLast >= 2 && Math.random() < Math.min(0.4, sinceLast * 0.08)) {
            const pool = Object.keys(CONFIG.EVENTS).filter(k => ['global', 'shock'].includes(CONFIG.EVENTS[k].type));
            const weights = pool.map(k => CONFIG.EVENTS[k].chance), total = weights.reduce((s, w) => s + w, 0);
            let rand = Math.random() * total;
            for (let i = 0; i < pool.length; i++) {
                if ((rand -= weights[i]) <= 0) {
                    this.triggerEvent(pool[i]);
                    StateManager.gameState.lastGlobalEventRound = StateManager.gameState.round;
                    break;
                }
            }
        }
    },
    triggerEvent(key) {
        if (ModeManager.currentMode === 'basis' || StateManager.gameState.activeEvents.some(e => e.key === key)) return;
        const eventData = CONFIG.EVENTS[key];
        const newActiveEvent = { key, name: eventData.name, duration: eventData.duration, description: eventData.description, banner: eventData.banner, tax: eventData.tax || 0 };
        if (['spekulationsblase', 'lieferengpass', 'edelsteinfund'].includes(key)) {
            const keys = Object.keys(StateManager.gameState.resources).filter(k => k !== GOLD_RESOURCE_KEY);
            const target = keys[Math.floor(Math.random() * keys.length)];
            newActiveEvent.targetResource = target;
            newActiveEvent.description += ` ${StateManager.gameState.resources[target].icon}`;
        }
        StateManager.gameState.activeEvents.push(newActiveEvent);
        SoundManager.playSound('click');
        UIManager.showEventBanner(newActiveEvent);
    },
    updateResourceAvailability() {
        if (ModeManager.currentMode === 'basis') return;
        const { economicSystem, resources } = StateManager.gameState;
        StateManager.gameState.unavailableResources = [];
        const resourceKeys = Object.keys(resources);
        if (resourceKeys.length < 2) return;
        let unavailableCount = 0;
        if (economicSystem === 'social_market') unavailableCount = 1;
        else if (economicSystem === 'planned_economy') unavailableCount = 2;
        if (unavailableCount > 0 && resourceKeys.length > unavailableCount) {
            const shuffled = [...resourceKeys].sort(() => 0.5 - Math.random());
            StateManager.gameState.unavailableResources = shuffled.slice(0, unavailableCount);
        }
    }
};
