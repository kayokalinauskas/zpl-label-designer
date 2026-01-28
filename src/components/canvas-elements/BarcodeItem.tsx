// ============================================================================
// BarcodeItem Component
// ============================================================================
// Canvas element for rendering EAN-13 barcodes on the label.
// Uses bwip-js for barcode generation.
// ============================================================================

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Image, Rect, Text } from 'react-konva';
import Konva from 'konva';
import bwipjs from 'bwip-js';
import { isValidEAN13 } from '@/lib/element-factory';
import type { BarcodeElementProps } from './types';

// EAN-13 Module Constants
const MODULES = 95; // Logical bar modules
const LEFT_QZ_MODULES = 11; // Left quiet zone modules

// bwip-js reduces bar height to ~92.5% when includetext=true
const BAR_HEIGHT_RATIO_WITH_TEXT = 0.925;

/**
 * BarcodeItem renders an EAN-13 barcode element on the canvas.
 * 
 * ZPL/EAN-13 Layout:
 * - Logical: 95 modules (bars only)
 * - Visual: ~113 modules (11 Left QZ + 95 Bars + 7 Right QZ)
 * - Offset: 11 modules left
 * 
 * Height Compensation:
 * When includetext=true, bwip-js reduces bar height to ~92.5% to fit text.
 * We compensate by increasing the height parameter so bars end up at element.height.
 */
export default function BarcodeItem({
  element,
  onSelect,
  onChange,
  density,
  fontLoaded,
}: BarcodeElementProps) {
  const [imageCanvas, setImageCanvas] = useState<HTMLCanvasElement | null>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const shapeRef = useRef<Konva.Image>(null);

  // Calculate scale and offset
  const scale = Math.max(1, Math.floor(element.width / MODULES));
  const offset = LEFT_QZ_MODULES * scale;

  // Generate barcode image
  useEffect(() => {
    // Validate barcode value
    if (!isValidEAN13(element.barcodeValue)) {
      setBarcodeError('EAN-13 deve ter 12 ou 13 dígitos numéricos');
      setImageCanvas(null);
      return;
    }

    const canvas = document.createElement('canvas');
    try {
      // Compensation factor for bar height when text is shown
      const compensationFactor = element.showHumanReadable
        ? 1 / BAR_HEIGHT_RATIO_WITH_TEXT
        : 1;

      // Convert desired bar height (in dots) to millimeters for bwip-js
      // bwip-js formula: rendered_pixels = height_mm * (72/25.4) * scale
      const targetHeightMm = (element.height * compensationFactor / scale) * (25.4 / 72);

      bwipjs.toCanvas(canvas, {
        bcid: 'ean13',
        text: element.barcodeValue || '',
        scale: scale,
        height: targetHeightMm,
        includetext: element.showHumanReadable,
      });

      setImageCanvas(canvas);
      setBarcodeError(null);
    } catch (e) {
      console.warn('Barcode render error', e);
      setBarcodeError('Erro ao renderizar código de barras');
      setImageCanvas(null);
    }
  }, [element.barcodeValue, element.showHumanReadable, element.height, element.width, density, scale, fontLoaded]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Map Visual X back to Logical X (add offset)
    onChange({
      x: e.target.x() + offset,
      y: e.target.y(),
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Calculate new Logical Width and snap to module multiples
    let newWidth = Math.max(MODULES, element.width * scaleX);
    const moduleWidth = Math.max(1, Math.round(newWidth / MODULES));
    newWidth = MODULES * moduleWidth;

    // Calculate new Logical Height
    const oldVisualHeight = node.height();
    const oldLogicalHeight = element.height;
    const heightDiff = oldVisualHeight - oldLogicalHeight;
    const newVisualHeight = oldVisualHeight * scaleY;
    const newLogicalHeight = Math.max(10, newVisualHeight - heightDiff);

    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    onChange({
      x: node.x() + (LEFT_QZ_MODULES * moduleWidth),
      y: node.y(),
      width: newWidth,
      height: newLogicalHeight,
    });
  };

  // Render error placeholder if barcode is invalid
  if (barcodeError) {
    return (
      <React.Fragment>
        <Rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          fill="#fee2e2"
          stroke="#ef4444"
          strokeWidth={2}
          dash={[5, 5]}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={(e) => {
            onChange({ x: e.target.x(), y: e.target.y() });
          }}
        />
        <Text
          x={element.x + 5}
          y={element.y + element.height / 2 - 10}
          width={element.width - 10}
          text={barcodeError}
          fontSize={12}
          fill="#dc2626"
          align="center"
        />
      </React.Fragment>
    );
  }

  return (
    <Image
      ref={shapeRef}
      id={element.id}
      image={imageCanvas || undefined}
      // Visual Position: Shift left by Quiet Zone offset
      x={element.x - offset}
      y={element.y}
      // Use actual canvas dimensions
      width={imageCanvas?.width || element.width}
      height={imageCanvas?.height || element.height}
      draggable
      imageSmoothingEnabled={false}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );
}
