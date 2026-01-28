// ============================================================================
// Element Factory Tests
// ============================================================================

import {
  createElement,
  isValidEAN13,
  isRectFilled,
  cloneElement,
  getLineLength,
  getLineThickness,
  ELEMENT_DEFAULTS,
  generateId,
} from '@/lib/element-factory';
import { LabelElement } from '@/types';

describe('generateId', () => {
  it('should generate a unique string ID', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should generate different IDs on each call', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('createElement', () => {
  describe('text elements', () => {
    it('should create a text element with default values', () => {
      const element = createElement('text');
      
      expect(element.type).toBe('text');
      expect(element.id).toBeDefined();
      expect(element.x).toBe(50);
      expect(element.y).toBe(50);
      expect(element.width).toBe(ELEMENT_DEFAULTS.text.width);
      expect(element.height).toBe(ELEMENT_DEFAULTS.text.height);
      expect(element.text).toBe('Novo Texto');
      expect(element.fontSize).toBe(24);
      expect(element.isBold).toBe(true);
    });

    it('should allow custom position override', () => {
      const element = createElement('text', { x: 100, y: 200 });
      
      expect(element.x).toBe(100);
      expect(element.y).toBe(200);
    });
  });

  describe('variable elements', () => {
    it('should create a variable element with string payload', () => {
      const element = createElement('variable', '${product.name}');
      
      expect(element.type).toBe('variable');
      expect(element.text).toBe('${product.name}');
    });

    it('should use default values for variable', () => {
      const element = createElement('variable', '${test}');
      
      expect(element.width).toBe(ELEMENT_DEFAULTS.variable.width);
      expect(element.fontSize).toBe(24);
    });
  });

  describe('rect elements', () => {
    it('should create a rectangle element with default values', () => {
      const element = createElement('rect');
      
      expect(element.type).toBe('rect');
      expect(element.width).toBe(100);
      expect(element.height).toBe(100);
      expect(element.stroke).toBe('black');
      expect(element.strokeWidth).toBe(2);
      expect(element.fill).toBe('transparent');
    });

    it('should allow custom dimensions', () => {
      const element = createElement('rect', { width: 200, height: 50 });
      
      expect(element.width).toBe(200);
      expect(element.height).toBe(50);
    });
  });

  describe('line elements', () => {
    it('should create a horizontal line by default', () => {
      const element = createElement('line');
      
      expect(element.type).toBe('line');
      expect(element.lineOrientation).toBe('horizontal');
      expect(element.width).toBe(100);
      expect(element.height).toBe(2);
    });

    it('should allow vertical orientation override', () => {
      const element = createElement('line', { lineOrientation: 'vertical' });
      
      expect(element.lineOrientation).toBe('vertical');
    });
  });

  describe('barcode elements', () => {
    it('should create a barcode element with default values', () => {
      const element = createElement('barcode');
      
      expect(element.type).toBe('barcode');
      expect(element.width).toBe(190);
      expect(element.height).toBe(100);
      expect(element.barcodeValue).toBe('789000000001');
      expect(element.showHumanReadable).toBe(true);
    });

    it('should allow custom barcode value', () => {
      const element = createElement('barcode', { barcodeValue: '1234567890123' });
      
      expect(element.barcodeValue).toBe('1234567890123');
    });
  });
});

describe('isValidEAN13', () => {
  it('should return true for valid 12-digit barcode', () => {
    expect(isValidEAN13('123456789012')).toBe(true);
  });

  it('should return true for valid 13-digit barcode', () => {
    expect(isValidEAN13('1234567890123')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(isValidEAN13('')).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidEAN13(undefined)).toBe(false);
  });

  it('should return false for too short barcode', () => {
    expect(isValidEAN13('12345')).toBe(false);
  });

  it('should return false for too long barcode', () => {
    expect(isValidEAN13('12345678901234')).toBe(false);
  });

  it('should handle barcodes with non-numeric characters (strips them)', () => {
    // The function strips non-digits, so "123-456-789-012" becomes "123456789012" (12 digits)
    expect(isValidEAN13('123-456-789-012')).toBe(true);
  });

  it('should return false for letters only', () => {
    expect(isValidEAN13('abcdefghijklm')).toBe(false);
  });
});

describe('isRectFilled', () => {
  it('should return true when strokeWidth >= width', () => {
    const element: LabelElement = {
      id: '1',
      type: 'rect',
      x: 0,
      y: 0,
      width: 10,
      height: 100,
      strokeWidth: 10,
    };
    expect(isRectFilled(element)).toBe(true);
  });

  it('should return true when strokeWidth >= height', () => {
    const element: LabelElement = {
      id: '1',
      type: 'rect',
      x: 0,
      y: 0,
      width: 100,
      height: 10,
      strokeWidth: 10,
    };
    expect(isRectFilled(element)).toBe(true);
  });

  it('should return true when fill is black', () => {
    const element: LabelElement = {
      id: '1',
      type: 'rect',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: 'black',
      strokeWidth: 2,
    };
    expect(isRectFilled(element)).toBe(true);
  });

  it('should return false for outlined rectangle', () => {
    const element: LabelElement = {
      id: '1',
      type: 'rect',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      strokeWidth: 2,
      fill: 'transparent',
    };
    expect(isRectFilled(element)).toBe(false);
  });

  it('should use default strokeWidth of 1 when not specified', () => {
    const element: LabelElement = {
      id: '1',
      type: 'rect',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
    expect(isRectFilled(element)).toBe(false);
  });
});

describe('cloneElement', () => {
  const originalElement: LabelElement = {
    id: 'original-id',
    type: 'text',
    x: 100,
    y: 100,
    width: 200,
    height: 50,
    text: 'Test Text',
    fontSize: 24,
  };

  it('should create a new element with different ID', () => {
    const cloned = cloneElement(originalElement);
    
    expect(cloned.id).not.toBe(originalElement.id);
    expect(cloned.id.length).toBeGreaterThan(0);
  });

  it('should apply default offset of 20,20', () => {
    const cloned = cloneElement(originalElement);
    
    expect(cloned.x).toBe(120);
    expect(cloned.y).toBe(120);
  });

  it('should apply custom offset', () => {
    const cloned = cloneElement(originalElement, { x: 50, y: 30 });
    
    expect(cloned.x).toBe(150);
    expect(cloned.y).toBe(130);
  });

  it('should preserve all other properties', () => {
    const cloned = cloneElement(originalElement);
    
    expect(cloned.type).toBe(originalElement.type);
    expect(cloned.width).toBe(originalElement.width);
    expect(cloned.height).toBe(originalElement.height);
    expect(cloned.text).toBe(originalElement.text);
    expect(cloned.fontSize).toBe(originalElement.fontSize);
  });

  it('should handle partial offset', () => {
    const cloned = cloneElement(originalElement, { x: 10 });
    
    expect(cloned.x).toBe(110);
    expect(cloned.y).toBe(100); // No y offset provided, should be 0
  });
});

describe('getLineLength', () => {
  it('should return width for horizontal line', () => {
    const element: LabelElement = {
      id: '1',
      type: 'line',
      x: 0,
      y: 0,
      width: 200,
      height: 5,
      lineOrientation: 'horizontal',
    };
    expect(getLineLength(element)).toBe(200);
  });

  it('should return height for vertical line', () => {
    const element: LabelElement = {
      id: '1',
      type: 'line',
      x: 0,
      y: 0,
      width: 5,
      height: 200,
      lineOrientation: 'vertical',
    };
    expect(getLineLength(element)).toBe(200);
  });
});

describe('getLineThickness', () => {
  it('should return height for horizontal line', () => {
    const element: LabelElement = {
      id: '1',
      type: 'line',
      x: 0,
      y: 0,
      width: 200,
      height: 5,
      lineOrientation: 'horizontal',
    };
    expect(getLineThickness(element)).toBe(5);
  });

  it('should return width for vertical line', () => {
    const element: LabelElement = {
      id: '1',
      type: 'line',
      x: 0,
      y: 0,
      width: 5,
      height: 200,
      lineOrientation: 'vertical',
    };
    expect(getLineThickness(element)).toBe(5);
  });
});
