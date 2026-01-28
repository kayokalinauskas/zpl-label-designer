// ============================================================================
// Canvas Element Shared Types
// ============================================================================
// Common types and props shared by all canvas element components.
// ============================================================================

import { LabelElement, ElementUpdate } from '@/types';

/**
 * Base props shared by all canvas element components.
 */
export interface CanvasElementProps {
  /** The element data from store */
  element: LabelElement;
  /** Whether this element is currently selected */
  isSelected: boolean;
  /** Callback when element is clicked/tapped */
  onSelect: () => void;
  /** Callback when element properties change */
  onChange: (updates: ElementUpdate) => void;
  /** Canvas stage width in dots */
  stageWidth: number;
  /** Canvas stage height in dots */
  stageHeight: number;
}

/**
 * Extended props for barcode elements that need extra data.
 */
export interface BarcodeElementProps extends CanvasElementProps {
  /** Print density for barcode scaling calculations */
  density: number;
  /** Whether OCR-B font has loaded */
  fontLoaded: boolean;
}
