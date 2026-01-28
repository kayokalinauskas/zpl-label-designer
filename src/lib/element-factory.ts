// ============================================================================
// Element Factory
// ============================================================================
// Pure functions for creating label elements with consistent defaults.
// This centralizes element creation logic that was previously scattered
// across the store and components.
//
// Benefits:
// 1. Single source of truth for default values
// 2. Easy to test (pure functions)
// 3. Decoupled from state management
// 4. Prepares for undo/redo by making element creation explicit
// ============================================================================

import { LabelElement, ElementType, CreateElementPayload, LineOrientation } from '@/types';

// ----------------------------------------------------------------------------
// ID Generation
// ----------------------------------------------------------------------------

/**
 * Generate a unique ID for elements.
 * Uses crypto.randomUUID when available, falls back to timestamp-based ID.
 */
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ----------------------------------------------------------------------------
// Default Values
// ----------------------------------------------------------------------------

/** Default position for new elements */
const DEFAULT_POSITION = { x: 50, y: 50 };

/** Default values by element type */
export const ELEMENT_DEFAULTS: Record<ElementType, Partial<LabelElement>> = {
  text: {
    width: 150,
    height: 30,
    text: 'Novo Texto',
    fontSize: 24,
    fontFamily: 'Courier New',
    isBold: true,
  },
  
  variable: {
    width: 200,
    height: 30,
    fontSize: 24,
    fontFamily: 'Courier New',
    isBold: true,
    // text is set from payload
  },
  
  rect: {
    width: 100,
    height: 100,
    fill: 'transparent',
    stroke: 'black',
    strokeWidth: 2,
  },
  
  line: {
    width: 100,
    height: 2,
    lineOrientation: 'horizontal' as LineOrientation,
    stroke: 'black',
    strokeWidth: 2,
  },
  
  barcode: {
    width: 190,
    height: 100,
    barcodeValue: '789000000001',
    showHumanReadable: true,
  },
};

// ----------------------------------------------------------------------------
// Element Creation
// ----------------------------------------------------------------------------

/**
 * Create a new element with proper defaults based on type.
 * 
 * @param type - The type of element to create
 * @param payload - Optional string (for variable text) or partial element overrides
 * @returns A complete LabelElement ready to be added to the store
 * 
 * @example
 * // Create a text element with defaults
 * const text = createElement('text');
 * 
 * // Create a variable with specific text
 * const variable = createElement('variable', '${product.name}');
 * 
 * // Create an element with custom position
 * const rect = createElement('rect', { x: 100, y: 200 });
 */
export function createElement(
  type: ElementType,
  payload?: CreateElementPayload
): LabelElement {
  const id = generateId();
  const defaults = ELEMENT_DEFAULTS[type];
  
  // Build the base element
  const baseElement: LabelElement = {
    id,
    type,
    x: DEFAULT_POSITION.x,
    y: DEFAULT_POSITION.y,
    width: defaults.width ?? 100,
    height: defaults.height ?? 100,
    ...defaults,
  };
  
  // Handle payload based on type
  if (payload !== undefined) {
    if (typeof payload === 'string') {
      // String payload is used for variable text
      return {
        ...baseElement,
        text: payload,
      };
    } else {
      // Object payload overrides any default properties
      return {
        ...baseElement,
        ...payload,
      };
    }
  }
  
  return baseElement;
}

// ----------------------------------------------------------------------------
// Element Validation
// ----------------------------------------------------------------------------

/**
 * Validate an EAN-13 barcode value.
 * 
 * @param value - The barcode value to validate
 * @returns true if valid EAN-13 (12-13 digits)
 */
export function isValidEAN13(value: string | undefined): boolean {
  if (!value) return false;
  const cleaned = value.replace(/\D/g, '');
  return cleaned.length === 12 || cleaned.length === 13;
}

/**
 * Check if a rectangle should be rendered as filled.
 * A rect is filled when strokeWidth >= dimensions or fill is explicitly 'black'.
 * 
 * @param element - The rectangle element to check
 * @returns true if the rect should be rendered filled
 */
export function isRectFilled(element: LabelElement): boolean {
  const strokeWidth = element.strokeWidth || 1;
  return (
    strokeWidth >= element.width || 
    strokeWidth >= element.height || 
    element.fill === 'black'
  );
}

// ----------------------------------------------------------------------------
// Element Cloning
// ----------------------------------------------------------------------------

/**
 * Clone an element with a new ID and optional offset.
 * Useful for duplicate/copy functionality.
 * 
 * @param element - The element to clone
 * @param offset - Optional position offset for the clone
 * @returns A new element with unique ID
 */
export function cloneElement(
  element: LabelElement,
  offset: { x?: number; y?: number } = { x: 20, y: 20 }
): LabelElement {
  return {
    ...element,
    id: generateId(),
    x: element.x + (offset.x ?? 0),
    y: element.y + (offset.y ?? 0),
  };
}

// ----------------------------------------------------------------------------
// Line Helpers
// ----------------------------------------------------------------------------

/**
 * Get the length dimension of a line based on orientation.
 */
export function getLineLength(element: LabelElement): number {
  return element.lineOrientation === 'horizontal' 
    ? element.width 
    : element.height;
}

/**
 * Get the thickness dimension of a line based on orientation.
 */
export function getLineThickness(element: LabelElement): number {
  return element.lineOrientation === 'horizontal' 
    ? element.height 
    : element.width;
}

/**
 * Set line dimensions maintaining orientation semantics.
 * 
 * @param element - The line element
 * @param length - New length value
 * @param thickness - New thickness value
 * @returns Partial update object for width/height
 */
export function setLineDimensions(
  orientation: LineOrientation | undefined,
  length: number,
  thickness: number
): Pick<LabelElement, 'width' | 'height'> {
  if (orientation === 'vertical') {
    return { width: thickness, height: length };
  }
  return { width: length, height: thickness };
}
