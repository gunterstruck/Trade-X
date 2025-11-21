#!/bin/bash

# Icon Generator Script für Trade-X PWA
# Benötigt: ImageMagick (convert) oder Inkscape

echo "🎨 Trade-X Icon Generator"
echo "=========================="

# Prüfe ob ImageMagick installiert ist
if command -v convert &> /dev/null; then
    TOOL="convert"
    echo "✓ ImageMagick gefunden"
elif command -v magick &> /dev/null; then
    TOOL="magick"
    echo "✓ ImageMagick gefunden (magick)"
elif command -v inkscape &> /dev/null; then
    TOOL="inkscape"
    echo "✓ Inkscape gefunden"
else
    echo "❌ Fehler: Weder ImageMagick noch Inkscape gefunden!"
    echo ""
    echo "Installation:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  MacOS: brew install imagemagick"
    echo "  Windows: https://imagemagick.org/script/download.php"
    exit 1
fi

# Icon-Größen, die generiert werden sollen
SIZES=(72 96 128 144 152 192 384 512)

echo ""
echo "Generiere Icons in verschiedenen Größen..."
echo ""

# Erstelle icons Verzeichnis falls nicht vorhanden
mkdir -p icons

# Generiere Icons
for SIZE in "${SIZES[@]}"; do
    OUTPUT="icons/icon-${SIZE}x${SIZE}.png"

    if [ "$TOOL" = "convert" ] || [ "$TOOL" = "magick" ]; then
        $TOOL icon-template.svg -resize ${SIZE}x${SIZE} -background none $OUTPUT
    elif [ "$TOOL" = "inkscape" ]; then
        inkscape icon-template.svg --export-type=png --export-filename=$OUTPUT --export-width=$SIZE --export-height=$SIZE
    fi

    if [ -f "$OUTPUT" ]; then
        echo "✓ Generiert: $OUTPUT (${SIZE}x${SIZE})"
    else
        echo "❌ Fehler bei: $OUTPUT"
    fi
done

echo ""
echo "✅ Icon-Generierung abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "1. Überprüfe die generierten Icons im 'icons/' Verzeichnis"
echo "2. Optional: Erstelle Screenshots für PWA-Listing"
echo "3. Teste die PWA mit Chrome DevTools > Application > Manifest"
