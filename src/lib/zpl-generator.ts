import { LabelElement, LabelSettings } from '@/types';

// Escape special ZPL characters to prevent command injection
const escapeZPL = (text: string): string => {
  if (!text) return '';
  // Replace ^ with _5E (hex for ^) and ~ with _7E (hex for ~)
  // ZPL uses _XX format for hex escape sequences
  return text
    .replace(/_/g, '_5F') // Escape underscore first since it's our escape char
    .replace(/\^/g, '_5E')
    .replace(/~/g, '_7E');
};

// Helper to check if a rect should be filled (consistent with CanvasInner logic)
export const isRectFilled = (element: LabelElement): boolean => {
  const strokeWidth = element.strokeWidth || 1;
  return strokeWidth >= element.width || strokeWidth >= element.height || element.fill === 'black';
};

// Font metrics compensation for canvas vs ZPL alignment
// 
// CSS/Canvas fonts (like Courier New) have internal metrics where:
// - The em-square includes space for ascenders and descenders
// - Glyphs don't start at y=0; there's padding above the tallest glyphs
// 
// ZPL Font 0 positions text where Y is the TOP of the character cell,
// and glyphs appear to start immediately at that position.
//
// To compensate: We shift the ZPL Y position UP by a percentage of fontSize
// so that the visual result in Labelary matches the canvas preview.
//
// For Courier New Bold: ~12% of fontSize is empty space above cap-height
const CANVAS_FONT_TOP_PADDING_RATIO = 0.12;

export function generateZPL(elements: LabelElement[], settings: LabelSettings): string {
  const { density } = settings;
  
  // Start Label
  let zpl = '^XA\n';
  
  // Set global defaults if needed
  // ^CI28 for UTF-8 support if using newer firmware, but keeping simple for now.

  elements.forEach((el) => {
    // Base position
    const x = Math.round(el.x);
    let y = Math.round(el.y);

    switch (el.type) {
      case 'variable':
      case 'text':
        // Compensate for canvas font top padding
        // Shift Y up so ZPL text aligns with where canvas text visually starts
        const fontSize = el.fontSize || 24;
        const topPaddingCompensation = Math.round(fontSize * CANVAS_FONT_TOP_PADDING_RATIO);
        const adjustedY = Math.max(0, y - topPaddingCompensation);
        
        zpl += `^FO${x},${adjustedY}\n`;
        
        // ^A{font},{orientation},{height},{width}
        // font='0' (scalable)
        const h = Math.round(fontSize);
        const w = Math.round(h); 
        zpl += `^A0N,${h},${w}\n`;
        
        // Field Block for wrapping and width control
        // ^FB{width},{max_lines},{spacing},{align},{indent}
        // We use the element width.
        const textWidth = Math.round(el.width);
        zpl += `^FB${textWidth},99,0,L,0\n`;
        
        zpl += `^FD${escapeZPL(el.text || '')}^FS\n`;
        break;

      case 'rect':
        zpl += `^FO${x},${y}\n`;
        // ^GB{width},{height},{thickness},{color},{rounding}
        const rw = Math.round(el.width);
        const rh = Math.round(el.height);
        
        if (isRectFilled(el)) {
           // Filled - use height as thickness for solid fill
           zpl += `^GB${rw},${rh},${rh}^FS\n`;
        } else {
           // Outlined
           const t = Math.round(el.strokeWidth || 1);
           zpl += `^GB${rw},${rh},${t}^FS\n`;
        }
        break;

      case 'line':
        zpl += `^FO${x},${y}\n`;
        // Lines in ZPL are rendered using ^GB (Graphic Box)
        // Horizontal line: width=length, height=thickness, thickness=thickness
        // Vertical line: width=thickness, height=length, thickness=thickness
        const lw = Math.round(el.width);
        const lh = Math.round(el.height);
        // For a solid line, thickness should equal the smaller dimension
        const lineThickness = Math.min(lw, lh);
        zpl += `^GB${lw},${lh},${lineThickness}^FS\n`;
        break;

      case 'barcode':
        zpl += `^FO${x},${y}\n`;
        // EAN-13 has exactly 95 modules.
        // We calculate module width based on the visual width of the bars.
        const dotsPerModule = Math.max(1, Math.floor(el.width / 95));
        const barcodeHeight = Math.round(el.height);
        const interpretLine = el.showHumanReadable ? 'Y' : 'N';

        // ^BYw,r,h -> w = module width, r = ratio (3.0 default), h = height (10 default)
        zpl += `^BY${dotsPerModule},3,10\n`;
        // ^BEo,h,f,g -> o = orientation, h = height, f = print interpretation, g = interpret above
        zpl += `^BEN,${barcodeHeight},${interpretLine},N\n`;
        
        // Use placeholder strictly for the ZPL output, ignoring the preview value in el.barcodeValue
        zpl += `^FD\${etiqueta.barra}^FS\n`;
        break;
    }
  });

  // End Label
  zpl += '^XZ';
  return zpl;
}
