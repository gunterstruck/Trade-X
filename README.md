# Hammer Fluktoria — App-First Edition

**Trainer-GPT Paket v2 · Wirtschafts-Brettspiel mit PWA-Companion**

![Version](https://img.shields.io/badge/version-2.0-blue)
![PWA](https://img.shields.io/badge/PWA-ready-green)
![Players](https://img.shields.io/badge/players-2--4-orange)
![Time](https://img.shields.io/badge/time-60--90min-purple)

---

## 📱 Über Trade-X PWA

**Trade-X** ist die offizielle digitale Marktplatz-Companion-App für **Hammer Fluktoria**, ein strategisches Wirtschaftsspiel, bei dem Spieler Ressourcen handeln, Gebäude errichten und durch clevere Markttaktiken Siegpunkte sammeln.

### ✨ Was macht die App?

Die **PWA (Progressive Web App)** übernimmt die gesamte **Marktlogik**:

- 📊 **Dynamische Preisanzeige** mit Echtzeit-Updates
- 💱 **Handelssystem** mit automatischer Preisanpassung (+1 Kauf / −1 Verkauf)
- 🎲 **Ereignis-Management** (Dürren, Unwetter, Industrierevolution, etc.)
- 🌍 **Wirtschaftssysteme** (Freier Markt, Soziale Marktwirtschaft, Planwirtschaft)
- 📈 **Marktanalyse** mit Charts und Prognosen
- 🎯 **Siegpunkt-Tracking** und Regelkonformität
- 🔄 **Undo/Redo** für faire Spiele

> **App ist Quelle der Wahrheit.** Das Brettspiel spiegelt nur die Marktdaten, alle Berechnungen erfolgen in der App.

---

## 🎯 Spielübersicht

### Leitbild

**Hammer Fluktoria** kombiniert **Poker-ähnliche Kombinationen** mit **dynamischem Ressourcenhandel**. Spieler sammeln Ressourcen, bilden Kombinationen (wie Straßen, Full House, Vierling) und bauen Gebäude, die dauerhafte Produktionseffekte (Engines) gewähren.

### Komponenten

#### Physisches Brett
- **40-Felder-Ring** (Monopoly-ähnlich)
  - **30 Ressourcenfelder** (geben +2 Ressourcen beim Betreten)
  - **10 Marktplatzfelder** (nur hier darf gehandelt werden!)
- **Gemeinschaftstopf** (Mitte, nur Experten-Systeme)
- **4 Spielerecken** mit 5-Slot-Bauracks
- Ressourcen-Karten/Plättchen, Würfel (W6), Spielfiguren

#### Digitale App (Trade-X PWA)
- Läuft im Browser (installierbar wie native App)
- Offline-fähig durch Service Worker
- Synchronisiert mit dem Brettspiel

---

## 🚀 Schnellstart

### 1. App installieren

#### Option A: Lokal testen
```bash
# HTTP-Server starten
python3 -m http.server 8000

# Browser öffnen
http://localhost:8000
```

#### Option B: PWA installieren
1. Öffne die gehostete App (GitHub Pages/Netlify)
2. Browser zeigt "App installieren"-Symbol
3. Klick auf **Installation** → App ist nun offline verfügbar

### 2. Spiel vorbereiten

1. **App starten** → Modus wählen:
   - **Basis** (Einstieg, 12 SP Ziel, einfache Regeln)
   - **Expert** (60–90 min, Wirtschaftssysteme, 8–10 SP Ziel)

2. **Ressourcenset** wählen:
   - `set_4`: 🌲 Bauholz, 🐑 Fleece, 🌾 Weizen, 🧱 Ziegel
   - `set_5`: + ⛏️ Metall **(empfohlen)**
   - `set_8`: + 🧵 Seide, 📜 Papier, 🪙 Münze

3. **(Expert)** **Wirtschaftssystem** wählen:
   - **Freier Markt**: Ziel 10 SP, keine Limits, hohe Volatilität
   - **Soziale Marktwirtschaft**: Ziel 9 SP, Handlimit 8, Topf aktiv
   - **Planwirtschaft**: Ziel 8 SP, Handlimit 3, hohe Bürokratie

4. **Brettaufbau**:
   - Figuren aufs Startfeld
   - Startpreise aus App übernehmen (alle bei 4.0)
   - Topf-Marker auf 0 (nur Expert)

---

## 🎲 Spielablauf

### Zugstruktur (für alle Modi identisch)

```
1. Zugbeginn → Engine-Produktion (falls vorhanden)
   ↓
2. Würfeln & Ziehen (W6)
   ↓
3. Feld ausführen
   • Ressourcenfeld: +2 Karten der Ressource
   • Marktplatz: Handel in der App
   ↓
4. Bauen (optional)
   • Beste Kombi aus Rack (5 Slots) bezahlen
   • SP buchen, Engine aktivieren
   ↓
5. Handlimit prüfen (nur Expert, Sozial/Plan)
   • Überschuss → kostenlos in Topf
   ↓
6. App-Cleanup (Ereignisse, Rundenende)
```

### 🔑 Kernregeln

#### Handel
- **Nur auf Marktplatzfeldern!**
- In der App: Ressource auswählen → Verkaufen/Kaufen
- **Nie gleiche Ressource auf beiden Seiten**
- **Preisänderung automatisch**: Kauf +1, Verkauf −1
- **Gebühren** werden von der App berechnet (Basis: fest, Expert: systemabhängig)

#### Engines (Dauerhafte Produktion)
- Werden durch **Gebäude** aktiviert
- **Trigger**: Zu **Beginn deines Zuges** (vor Würfeln)
- Ertrag geht **direkt auf die Hand**
- Zählt sofort zum Handlimit (Expert)

#### Rack-System (Parking)
- **5 Slots** zum Parken von Karten
- **Max. 2 Karten/Zug** aufs Rack legen
- Karten auf dem Rack **zählen nicht** zum Handlimit
- **Bauphase**: Sobald 5 Karten im Rack → beste Kombi wird gebaut

---

## 🃏 Poker-Kombinationen & Gebäude

| Kombo | Effekt | Engine |
|-------|--------|--------|
| **🏭 Fünfling** (5 gleiche) | **+3 SP** | **+2/Zug** der gewählten Ressource |
| **🏗️ Vierling** (4+1) | **+2 SP** | **+1/Zug** der Vierlings-Ressource |
| **🏘️ Full House** (3+2) | **+2 SP** | **+1/Zug** zufällige Ressource |
| **🎰 Straße** (5 versch.) | **+2 SP** | **+1/Zug** zufällige Ressource |
| **🏪 Zwei Paare** (2+2+1) | **+1 SP** | **Einmalig +1 Karte** (kein Dauereffekt) |
| **🏚️ Drilling** (3+1+1) | **+1 SP** | Keine Engine |

### Bezahlen
- **Hand** + **Rack** (alle Modi)
- **(Sozial/Plan)** optional aus **Topf** → **Bürokratiekosten** zahlen:
  - Sozial: **1 SP/Karte**
  - Plan: **2 SP/Karte**

---

## ⚙️ Wirtschaftssysteme (Expert)

### 🔥 Freier Markt
- **Ziel**: 10 SP
- **Handlimit**: Keins
- **Topf**: Aus
- **Bürokratie**: 0
- **Volatilität**: Hoch (2.5)
- **Philosophie**: Maximale Freiheit, maximales Risiko

### 🤝 Soziale Marktwirtschaft
- **Ziel**: 9 SP
- **Handlimit**: 8
- **Topf**: Aktiv
- **Bürokratie**: 1 SP/Karte (nur bei Topf-Entnahme)
- **Volatilität**: Mittel (1.2)
- **Philosophie**: Balance zwischen Freiheit und Solidarität

### ⚖️ Planwirtschaft
- **Ziel**: 8 SP
- **Handlimit**: 3
- **Topf**: Aktiv
- **Bürokratie**: 2 SP/Karte (nur bei Topf-Entnahme)
- **Volatilität**: Niedrig (0.8)
- **Philosophie**: Kollektive Ressourcenverwaltung

---

## 🌦️ Ereignisse & Jahreszeiten (Expert)

### Ereignistypen

Die App triggert automatisch:

#### 🌍 Globale Ereignisse (4–5 Runden)
- **Große Dürre**: 🌾 Weizen +2.5, andere +0.5
- **Unwetter**: 🌲 Holz/🐑 Fleece +2.0, andere −0.3
- **Industrie-Revolution**: ⛏️ Metall/🧱 Ziegel −1.5, andere +0.5
- **Erntefest**: 🌾 Weizen/🐑 Fleece −1.5
- **Friedenszeit**: Alle Preise −0.8

#### 💥 Schock-Events (1–4 Runden, selten)
- **Marktcrash**: Alle Preise auf 40%
- **Spekulationsblase**: Eine Ressource x4
- **Bankenkrise**: +3 Steuer/Handel, alle +1.0

#### 🎯 Mini-Events (1–2 Runden)
- **Lieferengpass**: Eine Ressource +1.5
- **Marktfest**: −1 Steuer/Handel, alle −0.3
- **Piratenüberfall**: +1 Steuer/Handel, alle +0.8

### 🌸 Jahreszeiten

Automatisch alle 3 Runden (in Expert):

- **Frühling** 🌸: Weizen +1, Fleece −0.5
- **Sommer** ☀️: Ziegel +1, Bauholz −1
- **Herbst** 🍂: Weizen −1.5, Metall +0.5
- **Winter** ❄️: Bauholz +1.5, Fleece +1

---

## 🏆 Spielende & Sieg

### Siegbedingungen
- **Sofortsieg** bei Erreichen der Ziel-SP:
  - Basis: **12 SP**
  - Freier Markt: **10 SP**
  - Sozial: **9 SP**
  - Plan: **8 SP**

### Tie-Break (bei Gleichstand)
1. **Mehr gebaute Kombos**
2. **Mehr Karten** (Hand + Rack)
3. **Höherer Engine-Ertrag/Zug**

---

## 🎮 Trade-X App: Features im Detail

### Basis-Modus (Einsteiger)
- Einfache Oberfläche
- **Feste Handelsgebühr** (wählbar: 0–3)
- 5 Ressourcen (empfohlen)
- Keine Ereignisse, keine Jahreszeiten
- **Ziel**: 12 SP

### Expert-Modus
- Alle 8 Ressourcen verfügbar
- Wirtschaftssysteme mit unterschiedlichen Regeln
- Dynamische Ereignisse
- Jahreszeiten-Zyklus
- Marktanalyse & Prognosen
- Charts & Historie

### UI-Elemente

#### Hauptansicht
- **Preisanzeige** mit Echtzeit-Updates
- **Handel-Buttons** (Verkaufen/Kaufen)
- **Rundenanzeige** und **Jahreszeit** (Expert)
- **Ereignis-Banner** (Expert)

#### Steuerung
- **Undo/Redo** (letzte 20 Schritte)
- **Reset** (Spiel neu starten)
- **Modus-Umschalter** (Basis ↔ Expert)
- **System-Wahl** (Expert)

#### Analyse (Expert)
- **Preishistorie-Chart** (10 Schritte)
- **Handelsempfehlungen** (KI-gestützt)
- **Volatilitäts-Status**
- **Marktprognose**

---

## 🛠️ Erweiterte Regeln

### Optionale Module (standardmäßig aus)

#### 1. Knappheit "Light"
- Jede Ressource hat **Startbestand** (z.B. 10)
- Käufe nur möglich, wenn Bestand ≥ Menge
- Verkäufe füllen Bestand auf

#### 2. Markteinfluss "Light"
- Zu Rundenbeginn: **10% Chance** auf −1 Bestand (zufällige Ressource)
- Simuliert Lieferkettenstress

#### 3. Topf-Nachfüllung (Sozial/Plan)
- Rundenende: Topf auf **min. 1 Karte/Ressource** auffüllen
- Verhindert komplettes Leeren

> Diese Module sind für Showcases/Messen gedacht und verändern **nicht** die App-Logik.

---

## 📊 Trainer-GPT: Regelkonformität

### Zustandsmodell

#### Spieler-State
```javascript
{
  hand: { bauholz: 3, weizen: 2, ... },
  rack_slots: [null, 'fleece', 'ziegel', null, null], // max 5
  engines: { bauholz: +2, random: +1 },
  sp: 7,
  pos: 15, // Feldposition (0-39)
  profile: 'aggressive' | 'conservative' | 'balanced'
}
```

#### Global-State
```javascript
{
  system: 'free_market' | 'social_market' | 'planned_economy',
  handLimit: null | 8 | 3,
  bureaucracyCost: 0 | 1 | 2,
  pool: { bauholz: 2, weizen: 5, ... }, // Gemeinschaftstopf
  prices: { bauholz: 4.5, weizen: 3.2, ... },
  set: 'set_5',
  round: 12,
  activePlayer: 0
}
```

### Turn-FSM (Finite State Machine)

```python
onTurnStart():
  applyEngines() → hand++
  checkHandLimit() → excess to pool (free)

rollD6() → move(pos + dice)

if tile == Resource:
  hand[res] += 2

if tile == Market:
  openAppTrade()
  applyPriceDeltas(+1 buy, -1 sell)

buildPhase():
  if rack.length == 5:
    bestCombo = evaluateBestCombo(hand + rack + pool?)
    payCost(bestCombo)
    sp += comboPoints
    grantEngine(bestCombo)

enforceHandLimit():
  if handLimit and hand.length > handLimit:
    excess → pool (free)

cleanup():
  applyAppEvents()
  if roundEnd: updateSeason(), checkEvents()
  nextPlayer()
```

### Validierungen (hart)

Die App/Trainer-GPT prüft:

- ❌ **Kein Off-Market-Trade** (nur auf Marktplatzfeldern)
- ❌ **Nie gleiche Ressource** auf beiden Handelsseiten
- ✅ **Bürokratie nur bei Topf-Entnahme** (nicht bei Überlauf!)
- ✅ **Rack: max. 2 Karten/Zug**, max. 5 Slots
- ✅ **Engine vor Würfeln**, Überlauf nach Bauen
- ✅ **Ziel-SP** korrekt (Basis 12, Frei 10, Sozial 9, Plan 8)

---

## 🎯 Strategie-Tipps

### Allgemein
- **Engines früh bauen** → kumulative Vorteile
- **Rack clever nutzen** → Handlimit umgehen
- **Marktplatzfelder ansteuern** → Handelsmöglichkeiten

### Freier Markt
- Aggressive Trades bei hohen Preisen
- Keine Einschränkungen → maximale Flexibilität
- Risiko: Ereignisse können dich hart treffen

### Soziale Marktwirtschaft
- **Handlimit 8** → Rack ist wichtig
- **Topf als Puffer** nutzen
- Bürokratie (1 SP) einkalkulieren

### Planwirtschaft
- **Handlimit 3** → sehr restriktiv!
- **Topf ist zentral** → gemeinsam wirtschaften
- Bürokratie (2 SP) ist teuer → sparsam entnehmen
- Niedrigeres Ziel (8 SP) kompensiert Einschränkungen

---

## 🚀 PWA-Installation & Deployment

### Lokaler Test

```bash
# Python
python3 -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

### GitHub Pages

1. **Icons generieren**:
   ```bash
   ./generate-icons.sh
   ```

2. **Push zu GitHub**:
   ```bash
   git add .
   git commit -m "PWA deployed"
   git push
   ```

3. **Settings → Pages aktivieren**

4. **manifest.json anpassen**:
   ```json
   "start_url": "/REPOSITORY-NAME/"
   ```

### Mobile Installation

#### Android (Chrome)
1. Menü (⋮) → "Zum Startbildschirm hinzufügen"
2. Bestätigen → App ist installiert

#### iOS (Safari)
1. Teilen (□↑) → "Zum Home-Bildschirm"
2. Bestätigen

---

## 📖 Glossar

| Begriff | Definition |
|---------|-----------|
| **Engine** | Dauerhafter Produktionseffekt eines Gebäudes (Ertrag zu Zugbeginn) |
| **Topf** | Gemeinschaftsvorrat; erhält Überlauf (kostenfrei), Entnahme kostet Bürokratie |
| **Bürokratie** | Fixkosten pro Topfkarte, **nur** beim Bauen (Sozial = 1, Plan = 2) |
| **Rack** | 5-Slot-Leiste zum Parken von Karten (zählt nicht zum Handlimit) |
| **Überlauf** | Karten über Handlimit → in Topf (kostenfrei, am Zugende) |
| **Marktplatz** | Spezialfeld, nur hier darf gehandelt werden |

---

## 🏅 Balance & Simulationen

### Empfohlene Defaults (aus 500+ Simulationen)

- **Set**: `set_5` (30 Ressourcenfelder, 10 Marktplätze)
- **Basis-Gebühr**: 1 (erhöht Interaktion spürbar)
- **Spielzeit**: 60–90 min (4 Spieler, Expert)
- **Siegrate**: Ausgeglichen (alle Systeme competitive)

### Bekannte Edge Cases

- **Marktcrash** in Freiem Markt kann katastrophal sein → Risikomanagement!
- **Planwirtschaft** mit vielen Engines → Topf wird überlebenswichtig
- **Spekulationsblase** auf Münze (set_8) → extrem volatil

---

## 🐛 Troubleshooting

### App lädt nicht
- **HTTPS erforderlich** (oder localhost)
- Browser-Cache leeren
- Service Worker neu registrieren

### Preise aktualisieren nicht
- **Hard Reload**: Strg+Shift+R (Chrome/Firefox)
- DevTools → Application → Service Workers → "Update"

### PWA kann nicht installiert werden
- Prüfe `manifest.json` Pfade
- Mindestens 192x192 und 512x512 Icons erforderlich
- Lighthouse-Audit durchführen (DevTools → Lighthouse)

---

## 📚 Ressourcen

- **PWA-Setup**: Siehe [`PWA-SETUP.md`](./PWA-SETUP.md)
- **Icons**: Siehe [`ICONS-README.md`](./ICONS-README.md)
- **PWA Builder**: [pwabuilder.com](https://www.pwabuilder.com/)
- **Lighthouse**: Chrome DevTools → Lighthouse → PWA Audit

---

## 🎉 Changelog

### v2.0 — App-First Edition (2025)
- Vollständige PWA-Integration
- Trainer-GPT Regelvalidierung
- Expert-Modus mit 3 Wirtschaftssystemen
- Dynamische Ereignisse & Jahreszeiten
- Offline-Support

### v1.0 — Basis-Prototyp
- Grundlegendes Handelssystem
- 5 Ressourcen, feste Preise
- Einfache Combo-Mechanik

---

## 🤝 Mitwirken

Dieses Projekt ist für **Showcases, Messen und Spieltests** gedacht.

**Feedback willkommen!**
- Regelklarheit
- UI/UX-Verbesserungen
- Balance-Vorschläge

---

## 📄 Lizenz

Dieses Projekt ist ein **Spielekonzept** und unterliegt den üblichen Urheberschutzregeln.

**Trade-X PWA** nutzt Open-Source-Bibliotheken:
- Tailwind CSS (MIT)
- Chart.js (MIT)
- Tone.js (MIT)

---

## 🎮 Viel Spaß beim Spielen!

**Hammer Fluktoria** verbindet taktisches Ressourcenmanagement mit der Spannung dynamischer Märkte. Die **Trade-X PWA** macht das Spiel zugänglich, fair und wiederholbar.

**Möge der Markt mit euch sein!** 🚀📊

---

**Version**: 2.0 | **Status**: Production Ready | **PWA**: ✅ Installierbar
