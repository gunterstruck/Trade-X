/**
 * Trade-X Utility Functions
 * Contains helper functions for security, error handling, and performance
 */

// Security: HTML escape function to prevent XSS
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Custom error class for game-specific errors
class GameError extends Error {
    constructor(message, type = 'GENERAL') {
        super(message);
        this.name = 'GameError';
        this.type = type;
    }
}

// Centralized error handling with UI feedback
function handleGameError(error) {
    console.error(error);
    SoundManager.playSound('error');
    switch(error.type) {
        case 'TRADE_ERROR':
            UIManager.showInfoMessage("Handelsfehler", error.message, '⚠️');
            break;
        case 'STATE_ERROR':
            UIManager.showInfoMessage("Zustandsfehler", `${error.message} Es wird empfohlen, das Spiel zurückzusetzen.`, '💥');
            break;
        default:
            UIManager.showInfoMessage("Unerwarteter Fehler", error.message, '💥');
    }
}

// Debounce function for performance optimization
const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
};
