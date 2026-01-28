// ============================================================================
// ZPL Label Designer - Type Definitions
// ============================================================================
// This module defines all TypeScript types used throughout the application.
// Types are organized by domain: Elements, Settings, Canvas, and Utilities.
// ============================================================================

// ----------------------------------------------------------------------------
// Element Types
// ----------------------------------------------------------------------------

/** All supported element types that can be placed on the canvas */
export type ElementType = 'text' | 'rect' | 'barcode' | 'variable' | 'line';

/** Orientation for line elements */
export type LineOrientation = 'horizontal' | 'vertical';

/** Base properties shared by all elements */
export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Properties specific to text and variable elements */
export interface TextProperties {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  isBold?: boolean;
}

/** Properties specific to rectangle elements */
export interface RectProperties {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

/** Properties specific to line elements */
export interface LineProperties {
  lineOrientation?: LineOrientation;
}

/** Properties specific to barcode elements */
export interface BarcodeProperties {
  barcodeValue?: string;
  showHumanReadable?: boolean;
}

/**
 * Complete LabelElement interface combining all possible properties.
 * 
 * Design Decision: We use a single interface with optional properties rather than
 * discriminated unions for several reasons:
 * 1. Zustand state updates are simpler with a flat structure
 * 2. React Konva handlers receive the same type consistently
 * 3. Property access doesn't require type narrowing in most cases
 * 
 * Type-specific properties are only accessed when element.type matches.
 */
export interface LabelElement extends BaseElement, TextProperties, RectProperties, LineProperties, BarcodeProperties {}

/** Partial element for updates (all fields optional except what's changing) */
export type ElementUpdate = Partial<Omit<LabelElement, 'id' | 'type'>>;

// ----------------------------------------------------------------------------
// Settings Types
// ----------------------------------------------------------------------------

/** Supported print densities in dots per mm */
export type PrintDensity = 6 | 8 | 12 | 24;

/** Label configuration settings */
export interface LabelSettings {
  /** Label width in millimeters */
  width: number;
  /** Label height in millimeters */
  height: number;
  /** Print density in dots per millimeter */
  density: PrintDensity;
}

/** Mapping from density (dpmm) to DPI for reference */
export const DENSITY_TO_DPI: Record<PrintDensity, number> = {
  6: 152,
  8: 203,
  12: 300,
  24: 600,
};

// Alias for backwards compatibility
export const DENSITY_MAP = DENSITY_TO_DPI;

// ----------------------------------------------------------------------------
// Canvas Types
// ----------------------------------------------------------------------------

/** Position on canvas in dots */
export interface Position {
  x: number;
  y: number;
}

/** Dimensions in dots */
export interface Dimensions {
  width: number;
  height: number;
}

/** Bounding box combining position and dimensions */
export interface BoundingBox extends Position, Dimensions {}

// ----------------------------------------------------------------------------
// Store Types
// ----------------------------------------------------------------------------

/** Payload for creating new elements with optional initial values */
export type CreateElementPayload = string | Partial<Omit<LabelElement, 'id' | 'type'>>;

// ----------------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------------

/**
 * Convert millimeters to dots based on print density.
 * Canvas operates in dots for 1:1 preview accuracy.
 * 
 * @example
 * mmToDots(100, 8) // 800 dots (100mm at 8 dpmm)
 */
export const mmToDots = (mm: number, dpmm: number): number => Math.round(mm * dpmm);

/**
 * Convert dots to millimeters based on print density.
 * 
 * @example
 * dotsToMm(800, 8) // 100mm
 */
export const dotsToMm = (dots: number, dpmm: number): number => dots / dpmm;
