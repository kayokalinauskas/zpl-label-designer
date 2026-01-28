// ============================================================================
// TextItem Component
// ============================================================================
// Canvas element for rendering text and variable elements on the label.
// ============================================================================

'use client';

import React, { useEffect, useRef } from 'react';
import { Text } from 'react-konva';
import Konva from 'konva';
import type { CanvasElementProps } from './types';

/**
 * TextItem renders a text or variable element on the canvas.
 * 
 * Design Notes:
 * - ZPL ^A0N,H,W positions text at the TOP of the character cell.
 * - Canvas/CSS fonts have internal metrics where glyphs don't start at y=0.
 * - We render text normally in Konva (no offset tricks).
 * - The ZPL generator handles the translation to ZPL coordinates.
 * 
 * This keeps the canvas WYSIWYG accurate to what Konva renders.
 */
export default function TextItem({
  element,
  onSelect,
  onChange,
  stageWidth,
  stageHeight,
}: CanvasElementProps) {
  const shapeRef = useRef<Konva.Text>(null);
  const lastSyncedHeightRef = useRef<number>(element.height);

  const fontSize = element.fontSize || 24;

  // Sync height when text content or font size changes
  useEffect(() => {
    const node = shapeRef.current;
    if (node) {
      const naturalHeight = node.height();
      if (Math.abs(naturalHeight - lastSyncedHeightRef.current) > 1) {
        lastSyncedHeightRef.current = naturalHeight;
        onChange({ height: naturalHeight });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element.text, element.fontSize, element.width]);

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

    const newWidth = Math.max(5, node.width() * scaleX);
    const newFontSize = Math.max(8, Math.round(fontSize * scaleY));

    // Reset scale
    node.scaleX(1);
    node.scaleY(1);
    node.width(newWidth);

    onChange({
      x: node.x(),
      y: node.y(),
      width: newWidth,
      fontSize: newFontSize,
    });
  };

  return (
    <Text
      ref={shapeRef}
      id={element.id}
      x={element.x}
      y={element.y}
      text={element.text}
      fontSize={fontSize}
      fill={element.fill || 'black'}
      width={element.width}
      fontFamily="Arial, ORC-B, Courier New, Courier, monospace"
      fontStyle="bold"
      lineHeight={1.0}
      align="left"
      verticalAlign="top"
      padding={0}
      height={undefined}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      dragBoundFunc={(pos) => {
        const node = shapeRef.current;
        if (!node) return pos;
        return {
          x: Math.max(0, Math.min(pos.x, stageWidth - node.width())),
          y: Math.max(0, Math.min(pos.y, stageHeight - node.height())),
        };
      }}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );
}
