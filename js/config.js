/**
 * Trade-X Configuration
 * Contains all game constants, resources, economic systems, and event definitions
 */

// Global configuration object
const GOLD_RESOURCE_KEY = 'muenze';

const ALL_RESOURCES = {
    bauholz: { name: 'Bauholz', icon: '🌲', color: '#228B22', rarity: 1.0 },
    fleece: { name: 'Fleece', icon: '🐑', color: '#90EE90', rarity: 1.0 },
    weizen: { name: 'Weizen', icon: '🌾', color: '#FFD700', rarity: 1.0 },
    ziegel: { name: 'Ziegel', icon: '🧱', color: '#B22222', rarity: 1.0 },
    metall: { name: 'Metall', icon: '⛏️', color: '#708090', rarity: 1.2 },
    tuch: { name: 'Seide', icon: '🧵', color: '#4682B4', rarity: 1.5 },
    papier: { name: 'Papier', icon: '📜', color: '#F5DEB3', rarity: 1.5 },
    [GOLD_RESOURCE_KEY]: { name: 'Münze', icon: '🪙', color: '#FFC0CB', rarity: 1.5 },
};

const RESOURCE_SETS = {
    set_4: { name: 'Klassisch (4)', resources: ['bauholz', 'weizen', 'fleece', 'ziegel'] },
    set_5: { name: 'Normal (5)', resources: ['bauholz', 'fleece', 'weizen', 'ziegel', 'metall'] },
    set_8: { name: 'Erweitert (8)', resources: ['bauholz', 'fleece', 'weizen', 'ziegel', 'metall', 'tuch', 'papier', GOLD_RESOURCE_KEY] }
};

const BASIS_RESOURCES = {
    bauholz: ALL_RESOURCES.bauholz,
    fleece: ALL_RESOURCES.fleece,
    weizen: ALL_RESOURCES.weizen,
    ziegel: ALL_RESOURCES.ziegel,
    metall: ALL_RESOURCES.metall,
};

function getResourcesForSet(setId) {
    const resourceKeys = RESOURCE_SETS[setId].resources;
    const result = {};
    for (const key of resourceKeys) {
        result[key] = ALL_RESOURCES[key];
    }
    return result;
}

const CONFIG = {
    GAME: {
        MAX_HISTORY_STEPS_BASIS: 20,
        MAX_HISTORY_STEPS_EXPERT: 20,
        MAX_TRADE_HISTORY: 30,
        MIN_RESOURCE_PRICE_BASIS: 1,
        MAX_RESOURCE_PRICE_BASIS: 8,
        PRICE_HISTORY_LENGTH_BASIS: 10,
        PRICE_HISTORY_LENGTH_EXPERT: 10,
    },
    UI: {
        CHART_UPDATE_DEBOUNCE: 100,
        MODAL_ANIMATION_DURATION: 200,
        BANNER_DISPLAY_TIME_FACTOR: 1500,
    },
    SEASONS: {
        fruehling: { name: 'Frühling', icon: '🌸', effects: { weizen: +1.0, fleece: -0.5 } },
        sommer:    { name: 'Sommer',   icon: '☀️', effects: { ziegel: +1.0, bauholz: -1.0 } },
        herbst:    { name: 'Herbst',   icon: '🍂', effects: { weizen: -1.5, metall: +0.5 } },
        winter:    { name: 'Winter',   icon: '❄️', effects: { bauholz: +1.5, fleece: +1.0 } }
    },
    ECONOMIC_SYSTEMS: {
        free_market: { name: "Freier Markt", minPrice: 1.0, maxPrice: 8.0, volatility: 2.5, description: "🔥 Ein unregulierter Markt mit starken Preisschwankungen.", handLimit: null, hasSharedPool: false, bureaucracyCost: 0, siegpunkte: 10, calculateTax: () => 0 },
        social_market: { name: "Soziale Marktwirtschaft", minPrice: 1.0, maxPrice: 8.0, volatility: 1.2, description: "🤝 Ausgewogenes System", handLimit: 8, hasSharedPool: true, bureaucracyCost: 1, siegpunkte: 9, calculateTax: () => 1 },
        planned_economy: { name: "Planwirtschaft", minPrice: 1.0, maxPrice: 8.0, volatility: 0.8, description: "⚖️ Kollektives Wirtschaften", handLimit: 3, hasSharedPool: true, bureaucracyCost: 2, siegpunkte: 8, calculateTax: (bp, ga, getAmount) => Math.max(Math.ceil(getAmount * 0.5), 2) }
    },
    EVENTS: {
        duerre: { name: "Große Dürre", type: 'global', duration: 4, modifier: (res, p) => res === 'weizen' ? p + 2.5 : p + 0.5, chance: 0.8, banner: 'warning', description: "☀️ Ernten vertrocknen!", story: "Seit Monaten kein Regen! Die Felder verdorren, Brunnen trocknen aus. Getreide wird zur Mangelware, während andere Rohstoffe durch die allgemeine Knappheit ebenfalls teurer werden.", effectText: "🌾 <b>Getreide:</b> +2.5, <b>Andere:</b> +0.5" },
        unwetter: { name: "Unwetter", type: 'global', duration: 3, modifier: (res, p) => ['bauholz', 'fleece'].includes(res) ? p + 2 : p - 0.3, chance: 0.9, banner: 'warning', description: "⛈️ Stürme!", story: "Schwere Stürme verwüsten die Wälder und Weiden! Bäume werden entwurzelt, Schafe suchen Schutz. Die Holz- und Wollproduktion bricht ein.", effectText: "🌲/🐑 <b>Holz/Wolle:</b> +2.0, <b>Andere:</b> -0.3" },
        industrie: { name: "Industrie-Revolution", type: 'global', duration: 5, modifier: (res, p) => ['metall', 'ziegel'].includes(res) ? p - 1.5 : p + 0.5, chance: 0.7, banner: 'info', description: "🏭 Maschinen brauchen Rohstoffe!", story: "Die Dampfmaschine verändert alles! Neue Fabriken entstehen überall und verschlingen riesige Mengen an Erz und Lehm.", effectText: "⛏️/🧱 <b>Metall/Ziegel:</b> -1.5, <b>Andere:</b> +0.5" },
        erntefest: { name: "Erntefest", type: 'global', duration: 2, modifier: (res, p) => ['weizen', 'fleece'].includes(res) ? p - 1.5 : p, chance: 1, banner: 'success', description: "🎉 Reiche Ernte!", story: "Ein Jahr des Überflusses! Die Ernte war so reich wie seit Jahrzehnten nicht. Getreide und Wolle sind im Überfluss vorhanden.", effectText: "🌾/🐑 <b>Getreide/Wolle:</b> -1.5" },
        goldrausch: { name: "Goldrausch", type: 'global', duration: 4, modifier: (res, p) => res === 'metall' ? p + 1 : p, chance: 0.6, banner: 'warning', description: "💰 Metall-Preise explodieren!", story: "Gold entdeckt in den Bergen! Tausende Glücksritter strömen herbei und treiben die Nachfrage nach Erz in ungeahnte Höhen.", effectText: "⛏️ <b>Metall:</b> +1.0" },
        handelspest: { name: "Handelspest", type: 'global', duration: 3, tax: 2, modifier: (r, p) => p + 0.5, chance: 0.5, banner: 'critical', description: "🦠 Hohe Steuern!", story: "Eine mysteriöse Krankheit grassiert unter den Händlern! Quarantäne-Maßnahmen und Desinfektionskosten verteuern jeden Transport.", effectText: "+2 Steuerkarten pro Handel, Alle Preise +0.5" },
        friedenszeit: { name: "Friedenszeit", type: 'global', duration: 3, modifier: (res, p) => p - 0.8, chance: 1, banner: 'success', description: "🌈 Handel blüht!", story: "Endlich Frieden! Die Kriege sind vorbei, die Handelswege wieder sicher. Überall herrscht Optimismus, der Handel blüht wie nie zuvor.", effectText: "Alle Preise -0.8" },
        arbeiterstreik: { name: "Arbeiterstreik", type: 'global', duration: 2, modifier: (res, p) => ['ziegel', 'bauholz'].includes(res) ? p + 2.5 : p, chance: 0.7, banner: 'warning', description: "🔨 Material wird knapp!", story: "Die Arbeiter in den Steinbrüchen und Sägewerken streiken für bessere Löhne! Die Produktion von Lehm und Holz stockt.", effectText: "🧱/🌲 <b>Ziegel/Holz:</b> +2.5" },
        marktcrash: { name: "Marktcrash", type: 'shock', duration: 1, modifier: (res, p) => p * 0.4, chance: 0.03, banner: 'critical', description: "💥 Preise im freien Fall!", story: "Panik an den Börsen! Gerüchte über eine bevorstehende Wirtschaftskrise lassen die Preise ins Bodenlose fallen.", effectText: "Alle Preise fallen auf 40%" },
        spekulationsblase: { name: "Spekulationsblase", type: 'shock', duration: 2, modifier: (res, p, target) => res === target ? p * 4 : p, chance: 0.03, banner: 'critical', description: "📈 Eine Ressource explodiert!", story: "Spekulanten haben eine bestimmte Ressource als 'das Gold der Zukunft' ausgerufen! Irrationale Käufe treiben den Preis in astronomische Höhen.", effectText: "Preis einer zufälligen Ressource x4" },
        bankenkrise: { name: "Bankenkrise", type: 'shock', duration: 4, tax: 3, modifier: (r, p) => p + 1, chance: 0.02, banner: 'critical', description: "🏦 Extrem hohe Steuern!", story: "Die größte Handelsbank der Region ist zusammengebrochen! Der Staat muss eingreifen und verhängt eine Notsteuer auf alle Transaktionen.", effectText: "+3 Steuerkarten pro Handel, Alle Preise +1.0" },
        lieferengpass: { name: "Lieferengpass", type: 'mini', duration: 1, modifier: (res, p, target) => res === target ? p + 1.5 : p, chance: 0.15, banner: 'info', description: "🚚 Lieferprobleme!", story: "Probleme in der Lieferkette! Ein wichtiger Transportweg ist blockiert, was zu Verzögerungen bei einer bestimmten Ware führt.", effectText: "Preis einer zufälligen Ressource +1.5" },
        edelsteinfund: { name: "Reicher Fund", type: 'mini', duration: 1, modifier: (res, p, target) => res === target ? p - 1.2 : p, chance: 0.12, banner: 'success', description: "💎 Überraschende Funde!", story: "Unerwarteter Glücksfund! Entdecker haben ein riesiges Vorkommen einer bestimmten Ressource gefunden.", effectText: "Preis einer zufälligen Ressource -1.2" },
        marktfest: { name: "Marktfest", type: 'mini', duration: 1, tax: -1, modifier: (r, p) => p - 0.3, chance: 0.1, banner: 'success', description: "🎪 Gute Preise!", story: "Das große Jahresmarktfest! Händler aus aller Welt kommen zusammen, die Konkurrenz ist groß und die Steuern werden reduziert.", effectText: "-1 Steuerkarte pro Handel, Alle Preise -0.3" },
        piratenangriff: { name: "Piratenüberfall", type: 'mini', duration: 2, tax: 1, modifier: (r, p) => p + 0.8, chance: 0.08, banner: 'warning', description: "🏴‍☠️ Händler erpresst!", story: "Piraten terrorisieren die Handelswege! Jeder Transport muss nun bewacht werden, was die Kosten in die Höhe treibt.", effectText: "+1 Steuerkarte pro Handel, Alle Preise +0.8" }
    },
};
