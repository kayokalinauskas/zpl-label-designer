export type ElementType = 'text' | 'rect' | 'barcode' | 'variable' | 'line';

export interface LabelElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  isBold?: boolean;

  // Rect specific
  fill?: string;
  stroke?: string;
  strokeWidth?: number;

  // Line specific
  lineOrientation?: 'horizontal' | 'vertical';

  // Barcode specific
  barcodeValue?: string; // EAN-13
  showHumanReadable?: boolean;
}

export type PrintDensity = 6 | 8 | 12 | 24;

export interface LabelSettings {
  width: number; // in mm
  height: number; // in mm
  density: PrintDensity;
}

export const DENSITY_MAP: Record<PrintDensity, number> = {
  6: 152,
  8: 203,
  12: 300,
  24: 600,
};

// Helper to convert mm to pixels for screen display (using 96 DPI as base screen DPI or arbitrary scale)
// We will treat 1 "screen pixel" as 1 "printer dot" for simplicity in one mode, 
// OR we map mm to screen pixels using a constant scale (e.g. 1mm = 3.78px at 96 DPI).
// For the CANVAS, it's better to work in "dots" if we want 1:1 preview, or "mm" converted to screen pixels.
// Let's stick to: Canvas operates in "dots" based on the selected density. 
// So 100mm width at 8dpmm = 800 dots.
// We display it scaled down/up to fit the screen.

export const mmToDots = (mm: number, dpmm: number) => Math.round(mm * dpmm);
export const dotsToMm = (dots: number, dpmm: number) => dots / dpmm;
