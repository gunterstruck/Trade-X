# Trade-X PWA Icons

## Schnellstart

### Automatische Icon-Generierung

```bash
./generate-icons.sh
```

Benötigt: ImageMagick oder Inkscape

### Alternative: Online Icon Generator

Falls ImageMagick nicht verfügbar ist, nutzen Sie einen Online-Dienst:

1. **PWA Asset Generator** (empfohlen)
   - URL: https://www.pwabuilder.com/imageGenerator
   - Laden Sie `icon-template.svg` hoch
   - Generieren Sie alle benötigten Größen

2. **RealFaviconGenerator**
   - URL: https://realfavicongenerator.net/
   - Unterstützt PWA-Icons und Favicons

3. **Favicon.io**
   - URL: https://favicon.io/
   - Einfache Icon-Generierung

## Benötigte Icon-Größen

- 72x72 px
- 96x96 px
- 128x128 px
- 144x144 px
- 152x152 px
- 192x192 px (minimum für PWA)
- 384x384 px
- 512x512 px (empfohlen für PWA)

## Eigenes Icon verwenden

1. Erstellen Sie ein quadratisches Icon (mindestens 512x512 px)
2. Format: PNG mit transparentem Hintergrund oder SVG
3. Ersetzen Sie `icon-template.svg` mit Ihrem Icon
4. Führen Sie `./generate-icons.sh` aus

## Screenshots für PWA Store Listings

Erstellen Sie Screenshots Ihrer App:

- **Desktop**: 1280x720 px (Wide)
- **Mobile**: 540x720 px (Narrow)

Speichern Sie diese im `screenshots/` Verzeichnis.
