#!/bin/bash

# Create a temporary directory
mkdir -p temp

# Create base image with initials
convert -size 1024x1024 xc:transparent \
  -font Helvetica-Bold \
  -pointsize 400 \
  -gravity center \
  -fill "#2563eb" \
  -draw "text 0,0 'VIN'" \
  -background transparent \
  temp/base.png

# Create circle mask
convert -size 1024x1024 xc:white \
  -draw "circle 512,512 512,0" \
  temp/mask.png

# Apply mask to create circular icon
convert temp/base.png temp/mask.png \
  -alpha Off -compose CopyOpacity -composite \
  temp/final.png

# Generate different sizes
convert temp/final.png -resize 16x16 favicon-16x16.png
convert temp/final.png -resize 32x32 favicon-32x32.png
convert temp/final.png -resize 180x180 apple-touch-icon.png
convert temp/final.png -resize 192x192 android-chrome-192x192.png
convert temp/final.png -resize 512x512 android-chrome-512x512.png

# Create ICO file with multiple sizes
convert favicon-16x16.png favicon-32x32.png favicon.ico

# Create Safari pinned tab SVG
convert temp/final.png -resize 512x512 -threshold 50% safari-pinned-tab.svg

# Clean up
rm -rf temp

echo "Favicon generation complete!"
