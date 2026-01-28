import { LabelElement, LabelSettings } from '@/types';

export function generateZPL(elements: LabelElement[], settings: LabelSettings): string {
  const { density } = settings;
  
  // Start Label
  let zpl = '^XA\n';
  
  // Set global defaults if needed
  // ^CI28 for UTF-8 support if using newer firmware, but keeping simple for now.

  elements.forEach((el) => {
    // Position
    const x = Math.round(el.x);
    const y = Math.round(el.y);

    // Common positioning
    zpl += `^FO${x},${y}\n`;

    switch (el.type) {
      case 'variable':
      case 'text':
        // ^A{font},{orientation},{height},{width}
        // font='0' (scalable)
        const h = Math.round(el.fontSize || 24);
        const w = Math.round(h); 
        zpl += `^A0N,${h},${w}\n`;
        
        // Field Block for wrapping and width control
        // ^FB{width},{max_lines},{spacing},{align},{indent}
        // We use the element width.
        const textWidth = Math.round(el.width);
        zpl += `^FB${textWidth},99,0,L,0\n`;
        
        zpl += `^FD${el.text}^FS\n`;
        break;

      case 'rect':
        // ^GB{width},{height},{thickness},{color},{rounding}
        const rw = Math.round(el.width);
        const rh = Math.round(el.height);
        
        if (el.fill === 'black' || !el.stroke) {
           // Filled
           zpl += `^GB${rw},${rh},${rh}^FS\n`;
        } else {
           // Outlined
           const t = Math.round(el.strokeWidth || 1);
           zpl += `^GB${rw},${rh},${t}^FS\n`;
        }
        break;

      case 'barcode':
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
