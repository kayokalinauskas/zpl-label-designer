// ============================================================================
// RectItem Component
// ============================================================================
// Canvas element for rendering rectangles on the label.
// Handles ZPL ^GB logic where thickness affects fill behavior.
// ============================================================================

'use client';

import React, { useRef } from 'react';
import { Rect } from 'react-konva';
import Konva from 'konva';
import { isRectFilled } from '@/lib/element-factory';
import type { CanvasElementProps } from './types';

/**
 * RectItem renders a rectangle element on the canvas.
 * 
 * ZPL ^GB Logic:
 * 1. Thickness (t) is drawn *inward* from the bounding box.
 * 2. If t >= width or t >= height, the box becomes a solid filled block.
 * 
 * Konva renders stroke centered on the path, so we compensate by:
 * - Offsetting position by +strokeWidth/2
 * - Reducing size by -strokeWidth
 */
export default function RectItem({
  element,
  onSelect,
  onChange,
  stageWidth,
  stageHeight,
}: CanvasElementProps) {
  const shapeRef = useRef<Konva.Rect>(null);

  const width = element.width;
  const height = element.height;
  const strokeWidth = element.strokeWidth || 1;
  const isFilled = isRectFilled(element);

  // Compensate for Konva's centered stroke rendering
  const konvaX = element.x + (isFilled ? 0 : strokeWidth / 2);
  const konvaY = element.y + (isFilled ? 0 : strokeWidth / 2);
  const konvaWidth = Math.max(0, width - (isFilled ? 0 : strokeWidth));
  const konvaHeight = Math.max(0, height - (isFilled ? 0 : strokeWidth));

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const offset = isFilled ? 0 : strokeWidth / 2;
    onChange({
      x: e.target.x() - offset,
      y: e.target.y() - offset,
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Calculate logical dimensions from visual
    const visualWidth = node.width() * scaleX;
    const visualHeight = node.height() * scaleY;
    const newWidth = visualWidth + (isFilled ? 0 : strokeWidth);
    const newHeight = visualHeight + (isFilled ? 0 : strokeWidth);

    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    const offset = isFilled ? 0 : strokeWidth / 2;
    onChange({
      x: node.x() - offset,
      y: node.y() - offset,
      width: newWidth,
      height: newHeight,
    });
  };

  return (
    <Rect
      ref={shapeRef}
      id={element.id}
      x={konvaX}
      y={konvaY}
      width={konvaWidth}
      height={konvaHeight}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      fill={isFilled ? 'black' : undefined}
      stroke={isFilled ? undefined : (element.stroke || 'black')}
      strokeWidth={isFilled ? 0 : strokeWidth}
      strokeScaleEnabled={false}
      dragBoundFunc={(pos) => ({
        x: Math.max(0, Math.min(pos.x, stageWidth - konvaWidth)),
        y: Math.max(0, Math.min(pos.y, stageHeight - konvaHeight)),
      })}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );
}
