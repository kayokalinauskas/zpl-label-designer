// ============================================================================
// LineItem Component
// ============================================================================
// Canvas element for rendering lines on the label.
// Lines in ZPL are rendered using ^GB with one dimension as thickness.
// ============================================================================

'use client';

import React, { useRef } from 'react';
import { Rect } from 'react-konva';
import Konva from 'konva';
import type { CanvasElementProps } from './types';

/**
 * LineItem renders a line element on the canvas.
 * 
 * Lines in ZPL are rendered using ^GB (Graphic Box):
 * - Horizontal line: width=length, height=thickness
 * - Vertical line: width=thickness, height=length
 * 
 * We use a Rect in Konva since lines in ZPL are really just thin rectangles.
 */
export default function LineItem({
  element,
  onSelect,
  onChange,
  stageWidth,
  stageHeight,
}: CanvasElementProps) {
  const shapeRef = useRef<Konva.Rect>(null);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const newWidth = Math.max(1, node.width() * scaleX);
    const newHeight = Math.max(1, node.height() * scaleY);

    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    onChange({
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight,
    });
  };

  return (
    <Rect
      ref={shapeRef}
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      fill={element.stroke || 'black'}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      dragBoundFunc={(pos) => ({
        x: Math.max(0, Math.min(pos.x, stageWidth - element.width)),
        y: Math.max(0, Math.min(pos.y, stageHeight - element.height)),
      })}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );
}
