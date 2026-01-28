// ============================================================================
// CanvasInner Component
// ============================================================================
// Main canvas component that orchestrates element rendering.
// 
// Architecture:
// - This component is the "orchestrator" - it manages the Stage and Layer
// - Element rendering is delegated to extracted components in canvas-elements/
// - Selection and transformation logic uses Konva's Transformer
// - Font loading for barcodes is handled here and passed down
// ============================================================================

'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import Konva from 'konva';
import bwipjs from 'bwip-js';
import { useLabelStore } from '@/store/useLabelStore';
import { mmToDots, LabelElement, ElementUpdate } from '@/types';
import { RectItem, LineItem, TextItem, BarcodeItem } from '@/components/canvas-elements';

// ============================================================================
// Font Loading Hook
// ============================================================================

/**
 * Hook to load OCR-B font for barcode rendering.
 * Returns true when font is loaded (or failed with fallback).
 */
function useOCRBFont(): boolean {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    fetch('/fonts/OCR-B.ttf')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(buffer => {
        // bwip-js requires binary string for fonts in browser
        const data = new Uint8Array(buffer);
        let fontStr = '';
        const chunkSize = 8192;
        for (let i = 0; i < data.length; i += chunkSize) {
          fontStr += String.fromCharCode.apply(null, Array.from(data.subarray(i, i + chunkSize)));
        }
        bwipjs.loadFont('ocrb', 100, fontStr);
        setFontLoaded(true);
      })
      .catch(e => {
        console.warn('OCR-B font failed to load, using fallback.', e);
        setFontLoaded(true); // Continue with default font
      });
  }, []);

  return fontLoaded;
}

// ============================================================================
// Selection Hook
// ============================================================================

/**
 * Hook to manage Transformer attachment to selected element.
 */
function useTransformerAttachment(
  transformerRef: React.RefObject<Konva.Transformer | null>,
  stageRef: React.RefObject<Konva.Stage | null>,
  selectedId: string | null,
  elements: LabelElement[]
) {
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, elements, transformerRef, stageRef]);
}

// ============================================================================
// Element Renderer
// ============================================================================

interface ElementRendererProps {
  element: LabelElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: ElementUpdate) => void;
  stageWidth: number;
  stageHeight: number;
  density: number;
  fontLoaded: boolean;
}

/**
 * Render the appropriate component based on element type.
 */
function ElementRenderer({
  element,
  isSelected,
  onSelect,
  onChange,
  stageWidth,
  stageHeight,
  density,
  fontLoaded,
}: ElementRendererProps) {
  const baseProps = {
    element,
    isSelected,
    onSelect,
    onChange,
    stageWidth,
    stageHeight,
  };

  switch (element.type) {
    case 'rect':
      return <RectItem key={element.id} {...baseProps} />;
    case 'line':
      return <LineItem key={element.id} {...baseProps} />;
    case 'text':
    case 'variable':
      return <TextItem key={element.id} {...baseProps} />;
    case 'barcode':
      return <BarcodeItem key={element.id} {...baseProps} density={density} fontLoaded={fontLoaded} />;
    default:
      return null;
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function CanvasInner() {
  // Store state
  const { elements, selectedId, settings, updateElement, selectElement } = useLabelStore();
  
  // Canvas dimensions in dots
  const stageWidth = useMemo(
    () => mmToDots(settings.width, settings.density),
    [settings.width, settings.density]
  );
  const stageHeight = useMemo(
    () => mmToDots(settings.height, settings.density),
    [settings.height, settings.density]
  );
  
  // Refs
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  
  // Font loading for barcodes
  const fontLoaded = useOCRBFont();
  
  // Transformer attachment
  useTransformerAttachment(transformerRef, stageRef, selectedId, elements);

  // Click on empty space deselects
  const handleDeselect = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      selectElement(null);
    }
  }, [selectElement]);

  return (
    <div
      className="w-full h-full bg-neutral-50/50 overflow-auto flex items-center justify-center p-8 relative"
      draggable="false"
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Canvas container */}
      <div
        className="z-10 bg-white shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 transition-all duration-200"
        style={{ width: stageWidth, height: stageHeight }}
      >
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          onMouseDown={handleDeselect}
          onTouchStart={handleDeselect}
        >
          <Layer>
            {/* Render all elements */}
            {elements.map((el) => (
              <ElementRenderer
                key={el.id}
                element={el}
                isSelected={el.id === selectedId}
                onSelect={() => selectElement(el.id)}
                onChange={(updates) => updateElement(el.id, updates)}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
                density={settings.density}
                fontLoaded={fontLoaded}
              />
            ))}
            
            {/* Transformer for selected element */}
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              centeredScaling={false}
              padding={0}
              anchorCornerRadius={0}
              keepRatio={false}
              enabledAnchors={[
                'top-left', 'top-right', 'bottom-left', 'bottom-right',
                'top-center', 'bottom-center', 'middle-left', 'middle-right'
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                const minSize = 5;
                if (newBox.width < minSize || newBox.height < minSize) {
                  return oldBox;
                }
                
                const isOutOfBounds =
                  newBox.x < 0 ||
                  newBox.y < 0 ||
                  newBox.x + newBox.width > stageWidth ||
                  newBox.y + newBox.height > stageHeight;
                
                if (isOutOfBounds) {
                  return oldBox;
                }
                
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
