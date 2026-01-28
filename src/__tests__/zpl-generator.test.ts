// ============================================================================
// ZPL Generator Tests
// ============================================================================

import { generateZPL } from '@/lib/zpl-generator';
import { LabelElement, LabelSettings } from '@/types';

const defaultSettings: LabelSettings = {
  width: 100,
  height: 50,
  density: 8,
};

describe('generateZPL', () => {
  describe('basic structure', () => {
    it('should generate proper ZPL start and end commands', () => {
      const zpl = generateZPL([], defaultSettings);
      
      expect(zpl).toContain('^XA');
      expect(zpl).toContain('^XZ');
      expect(zpl.indexOf('^XA')).toBeLessThan(zpl.indexOf('^XZ'));
    });

    it('should generate valid ZPL for empty elements array', () => {
      const zpl = generateZPL([], defaultSettings);
      
      expect(zpl).toBe('^XA\n^XZ');
    });
  });

  describe('text elements', () => {
    it('should generate ZPL for text element', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'text',
        x: 50,
        y: 100,
        width: 200,
        height: 30,
        text: 'Hello World',
        fontSize: 24,
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('^FO50,'); // Position (Y is adjusted)
      expect(zpl).toContain('^A0N,24,24'); // Font command
      expect(zpl).toContain('^FB200,'); // Field Block
      expect(zpl).toContain('^FDHello World^FS'); // Field Data
    });

    it('should escape special ZPL characters in text', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'text',
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        text: 'Hello^World~Test_End',
        fontSize: 24,
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('_5E'); // ^ escaped
      expect(zpl).toContain('_7E'); // ~ escaped
      expect(zpl).toContain('_5F'); // _ escaped
    });

    it('should handle empty text', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'text',
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        text: '',
        fontSize: 24,
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('^FD^FS');
    });
  });

  describe('variable elements', () => {
    it('should generate ZPL for variable element same as text', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'variable',
        x: 10,
        y: 20,
        width: 150,
        height: 30,
        text: '${product.name}',
        fontSize: 20,
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('^FO10,'); // Position
      expect(zpl).toContain('^A0N,20,20'); // Font
      expect(zpl).toContain('^FB150,'); // Field Block
    });
  });

  describe('rect elements', () => {
    it('should generate ZPL for outlined rectangle', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'rect',
        x: 50,
        y: 50,
        width: 100,
        height: 80,
        strokeWidth: 3,
        fill: 'transparent',
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('^FO50,50');
      expect(zpl).toContain('^GB100,80,3^FS');
    });

    it('should generate ZPL for filled rectangle', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'rect',
        x: 50,
        y: 50,
        width: 100,
        height: 80,
        fill: 'black',
        strokeWidth: 2,
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('^FO50,50');
      // When filled, thickness = height
      expect(zpl).toContain('^GB100,80,80^FS');
    });

    it('should generate filled rect when strokeWidth >= width', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'rect',
        x: 0,
        y: 0,
        width: 10,
        height: 100,
        strokeWidth: 10,
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('^GB10,100,100^FS');
    });
  });

  describe('line elements', () => {
    it('should generate ZPL for horizontal line', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'line',
        x: 20,
        y: 30,
        width: 150,
        height: 3,
        lineOrientation: 'horizontal',
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('^FO20,30');
      expect(zpl).toContain('^GB150,3,3^FS');
    });

    it('should generate ZPL for vertical line', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'line',
        x: 20,
        y: 30,
        width: 3,
        height: 150,
        lineOrientation: 'vertical',
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('^FO20,30');
      expect(zpl).toContain('^GB3,150,3^FS');
    });
  });

  describe('barcode elements', () => {
    it('should generate ZPL for EAN-13 barcode with text', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'barcode',
        x: 50,
        y: 100,
        width: 190,
        height: 80,
        barcodeValue: '1234567890123',
        showHumanReadable: true,
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('^FO50,100');
      expect(zpl).toContain('^BY2,3,10'); // Module width = floor(190/95) = 2
      expect(zpl).toContain('^BEN,80,Y,N'); // Height 80, show text
      expect(zpl).toContain('^FD${etiqueta.barra}^FS'); // Placeholder
    });

    it('should generate ZPL for barcode without text', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'barcode',
        x: 50,
        y: 100,
        width: 190,
        height: 80,
        barcodeValue: '1234567890123',
        showHumanReadable: false,
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('^BEN,80,N,N'); // N for no text
    });

    it('should calculate correct module width for different widths', () => {
      const elements: LabelElement[] = [{
        id: '1',
        type: 'barcode',
        x: 0,
        y: 0,
        width: 285, // 285/95 = 3
        height: 100,
        barcodeValue: '1234567890123',
        showHumanReadable: true,
      }];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      expect(zpl).toContain('^BY3,3,10');
    });
  });

  describe('multiple elements', () => {
    it('should generate ZPL for multiple elements in order', () => {
      const elements: LabelElement[] = [
        {
          id: '1',
          type: 'text',
          x: 10,
          y: 10,
          width: 100,
          height: 20,
          text: 'First',
          fontSize: 20,
        },
        {
          id: '2',
          type: 'rect',
          x: 50,
          y: 50,
          width: 50,
          height: 50,
          strokeWidth: 2,
        },
        {
          id: '3',
          type: 'text',
          x: 10,
          y: 100,
          width: 100,
          height: 20,
          text: 'Last',
          fontSize: 20,
        },
      ];
      
      const zpl = generateZPL(elements, defaultSettings);
      
      // Check order
      const firstIndex = zpl.indexOf('First');
      const rectIndex = zpl.indexOf('^GB50,50');
      const lastIndex = zpl.indexOf('Last');
      
      expect(firstIndex).toBeLessThan(rectIndex);
      expect(rectIndex).toBeLessThan(lastIndex);
    });
  });
});
