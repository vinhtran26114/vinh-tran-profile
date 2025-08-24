const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

// Path to your TTF font
const fontPath = path.join(__dirname, '../src/assets/fonts/Roboto_VN.ttf');
const outputPath = path.join(__dirname, '../src/assets/fonts/Roboto_VN-normal.js');

// Read and parse the font
const font = opentype.loadSync(fontPath);

// Create font data object
const fontData = {
  familyName: 'Roboto_VN',
  fontName: 'Roboto_VN-normal',
  fontStyle: 'normal',
  ascender: font.ascender,
  descender: font.descender,
  underlinePosition: font.tables.post.underlinePosition,
  underlineThickness: font.tables.post.underlineThickness,
  boundingBox: {
    yMin: font.tables.head.yMin,
    xMin: font.tables.head.xMin,
    yMax: font.tables.head.yMax,
    xMax: font.tables.head.xMax,
  },
  resolution: 1000,
  original_font_information: font.tables.name,
  charset: font.encoding.charset,
  format: "truetype",
  metrics: {},
  widths: [],
  encoding: "Identity-H",
  unicode: true
};

// Get character metrics
const glyphs = font.glyphs.glyphs;
for (let i = 0; i < 65536; i++) {
  const glyph = glyphs[i];
  if (glyph) {
    fontData.metrics[i] = {
      width: glyph.advanceWidth,
      height: glyph.advanceHeight || 0,
      xMin: glyph.xMin || 0,
      xMax: glyph.xMax || 0,
      yMin: glyph.yMin || 0,
      yMax: glyph.yMax || 0
    };
    fontData.widths[i] = glyph.advanceWidth;
  }
}

// Convert font to base64
const fontBuffer = fs.readFileSync(fontPath);
const base64Font = fontBuffer.toString('base64');

// Create the output JavaScript
const output = `
import { jsPDF } from 'jspdf';

const fontData = ${JSON.stringify(fontData, null, 2)};
const base64Font = "${base64Font}";

// Register the font with jsPDF
(typeof window !== 'undefined' ? window : {}).jsPDF = window.jsPDF || jsPDF;
window.jsPDF.API.events.push(['addFonts', function() {
  const font = {
    ...fontData,
    data: atob(base64Font)
  };
  this.addFileToVFS('Roboto_VN-normal.ttf', base64Font);
  this.addFont('Roboto_VN-normal.ttf', 'Roboto_VN', 'normal', 'Identity-H');
}]);

export default fontData;
`;

// Write the output file
fs.writeFileSync(outputPath, output);
console.log('Font conversion complete!'); 