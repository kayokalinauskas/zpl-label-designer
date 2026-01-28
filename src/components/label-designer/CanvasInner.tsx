'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Image, Transformer } from 'react-konva';
import Konva from 'konva';
import bwipjs from 'bwip-js';
import { useLabelStore } from '@/store/useLabelStore';
import { mmToDots, LabelElement } from '@/types';
import { clsx } from 'clsx';

// --- Sub-components ---

const RectItem = ({ element, isSelected, onSelect, onChange, stageWidth, stageHeight }: any) => {
  const shapeRef = useRef<Konva.Rect>(null);

  // ZPL ^GB Logic:
  // 1. Thickness (t) is drawn *inward* from the bounding box.
  // 2. If t >= width or t >= height, the box becomes a solid filled block.
  
  const width = element.width;
  const height = element.height;
  const strokeWidth = element.strokeWidth || 1; // Default ZPL thickness is 1 dot
  
  const isFilled = strokeWidth >= width || strokeWidth >= height || element.fill === 'black';

  // Konva renders stroke centered on the path.
  // To simulate "inner stroke":
  // Offset position by +strokeWidth/2
  // Reduce size by -strokeWidth
  const konvaX = element.x + (isFilled ? 0 : strokeWidth / 2);
  const konvaY = element.y + (isFilled ? 0 : strokeWidth / 2);
  const konvaWidth = Math.max(0, width - (isFilled ? 0 : strokeWidth));
  const konvaHeight = Math.max(0, height - (isFilled ? 0 : strokeWidth));

  return (
    <Rect
      ref={shapeRef}
      {...element}
      x={konvaX}
      y={konvaY}
      width={konvaWidth}
      height={konvaHeight}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      // If filled condition is met, fill black, no stroke. 
      // Otherwise, transparent fill (or white?) ZPL boxes are usually just borders unless filled.
      // Assuming 'fill' prop might be used for 'black', but ZPL logic overrides if thickness is high.
      fill={isFilled ? 'black' : undefined}
      stroke={isFilled ? undefined : (element.stroke || 'black')} 
      strokeWidth={isFilled ? 0 : strokeWidth}
      strokeScaleEnabled={false}
      dragBoundFunc={(pos) => {
        // ... (Keep existing drag bound logic, but accounting for the offset might be tricky if we don't map back)
        // Actually, Konva drags the NODE. The node x/y are konvaX/konvaY. 
        // We need to map back to Logical X/Y in onDragEnd.
        // For simplicity in bounds check, we can use the stage size.
        return {
          x: Math.max(0, Math.min(pos.x, stageWidth - konvaWidth)),
          y: Math.max(0, Math.min(pos.y, stageHeight - konvaHeight)),
        };
      }}
      onDragEnd={(e) => {
        // Map Konva Visual X/Y back to Logical ZPL X/Y
        // Logical X = Konva X - (isFilled ? 0 : strokeWidth/2)
        const currentStrokeWidth = shapeRef.current?.strokeWidth() || 0;
        // Check if currently filled state might have changed? 
        // We use the variables from render scope, assuming they match the drag start state.
        const offset = isFilled ? 0 : strokeWidth / 2;
        
        onChange({ 
          x: e.target.x() - offset, 
          y: e.target.y() - offset 
        });
      }}
      onTransformEnd={(e) => {
        const node = shapeRef.current;
        if (!node) return;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        // Visual dimensions
        const visualWidth = node.width() * scaleX;
        const visualHeight = node.height() * scaleY;
        
        // Logical dimensions
        // visualWidth = logicalWidth - strokeWidth
        // logicalWidth = visualWidth + strokeWidth
        const newWidth = visualWidth + (isFilled ? 0 : strokeWidth);
        const newHeight = visualHeight + (isFilled ? 0 : strokeWidth);
        
        node.scaleX(1);
        node.scaleY(1);
        
        // Recalculate offset for X/Y correction
        const offset = isFilled ? 0 : strokeWidth / 2;

        onChange({
          x: node.x() - offset,
          y: node.y() - offset,
          width: newWidth,
          height: newHeight,
        });
      }}
    />
  );
};

const TextItem = ({ element, isSelected, onSelect, onChange, stageWidth, stageHeight }: any) => {
  const shapeRef = useRef<Konva.Text>(null);

  // We do NOT extract height to clip. We let Konva Text auto-size height based on content and wrapping width.
  // ZPL ^A defines char height/width, not bounding box height.
  // ^FB defines bounding box width for wrapping.
  
  useEffect(() => {
    const node = shapeRef.current;
    if (node) {
      // Sync the natural rendered height back to store so we know the bounding box for ZPL positioning/collisions
      const naturalHeight = node.height();
      if (Math.abs(naturalHeight - element.height) > 1) {
        onChange({ height: naturalHeight });
      }
    }
  }, [element.text, element.fontSize, element.width, element.height, onChange]);

  return (
    <Text
      ref={shapeRef}
      {...element}
      fontFamily="OCR-B, Courier New, monospace" // Approx for ZPL Font 0
      // Ensure we don't pass a fixed height that might clip content if the store value is stale
      // We only pass width (for wrapping).
      height={undefined} 
      draggable
      onClick={onSelect}
      onTap={onSelect}
      fontStyle='Bold'
      dragBoundFunc={(pos) => {
        const node = shapeRef.current;
        if (!node) return pos;
        return {
          x: Math.max(0, Math.min(pos.x, stageWidth - node.width())),
          y: Math.max(0, Math.min(pos.y, stageHeight - node.height())),
        };
      }}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = shapeRef.current;
        if (!node) return;
        
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        // ZPL Logic:
        // Horizontal scaling -> Changes Wrapping Width (field block width)
        const newWidth = Math.max(5, node.width() * scaleX);
        
        // Vertical scaling -> Changes Font Size (ZPL ^A height)
        const newFontSize = Math.max(5, element.fontSize * scaleY);

        node.scaleX(1);
        node.scaleY(1);
        node.width(newWidth);
        // Note: We don't set height directly on node, it auto-calculates.
        
        onChange({
            x: node.x(),
            y: node.y(),
            width: newWidth,
            fontSize: newFontSize,
            // Height will be updated by the useEffect after render
        });
      }}
    />
  );
};

const BarcodeItem = ({ element, isSelected, onSelect, onChange, stageWidth, stageHeight, density, fontLoaded }: any) => {
  const [imageCanvas, setImageCanvas] = useState<HTMLCanvasElement | null>(null);
  const shapeRef = useRef<Konva.Image>(null);

  // ZPL/EAN-13 Logical vs Visual Constants
  // Logical: 95 modules (bars only).
  // Visual: ~113 modules (11 Left QZ + 95 Bars + 7 Right QZ).
  // Offset: 11 modules left.
  const modules = 95;
  const leftQZModules = 11;
  const scale = Math.max(1, Math.floor(element.width / modules));
  const offset = leftQZModules * scale;

  useEffect(() => {
    const canvas = document.createElement('canvas');
    try {
      // Calculate height in millimeters that results in exactly 'element.height' pixels
      // when rendered by bwip-js. 
      // bwip-js logic approx: pixels = height_mm * (72/25.4) * scale
      // Therefore: height_mm = (pixels / scale) * (25.4 / 72)
      const barHeightMm = (element.height / scale) * (25.4 / 72);
      
      // bwip-js renders the full visual barcode (including quiet zones and text)
      bwipjs.toCanvas(canvas, {
        bcid: 'ean13',
        text: element.barcodeValue,
        scale: scale, 
        height: barHeightMm, 
        includetext: element.showHumanReadable,
        // textxalign: 'center', // Removed to enforce standard EAN-13 layout (first digit left)
      });
      setImageCanvas(canvas);
    } catch (e) {
      console.warn('Barcode render error', e);
    }
  }, [element.barcodeValue, element.showHumanReadable, element.height, element.width, density, scale, fontLoaded]);

  return (
    <Image
      ref={shapeRef}
      image={imageCanvas || undefined}
      // Visual Position: Shift left by the Quiet Zone offset to align "Logical Origin" (bars start) with element.x
      x={element.x - offset}
      y={element.y}
      // Use the actual canvas dimensions (visual size)
      width={imageCanvas?.width || element.width}
      height={imageCanvas?.height || element.height}
      draggable
      imageSmoothingEnabled={false}
      onClick={onSelect}
      onTap={onSelect}
      dragBoundFunc={(pos) => {
        // We accept the default drag behavior for the visual box
        return pos;
      }}
      onDragEnd={(e) => {
        // Map Visual X back to Logical X
        // Logical X = Visual X + Offset
        const visualX = e.target.x();
        const visualY = e.target.y();
        onChange({ x: visualX + offset, y: visualY });
      }}
      onTransformEnd={(e) => {
        const node = shapeRef.current;
        if (!node) return;
        
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        // Calculate new Logical Width derived from the visual scaling
        let newWidth = Math.max(95, element.width * scaleX);
        
        // Snap to module multiples
        const moduleWidth = Math.max(1, Math.round(newWidth / modules));
        newWidth = modules * moduleWidth;

        // Calculate new Logical Height
        // Visual Height = Logical Height + (Visual - Logical)
        // New Logical Height = New Visual Height - (Old Visual - Old Logical)
        const oldVisualHeight = node.height();
        const oldLogicalHeight = element.height;
        const heightDiff = oldVisualHeight - oldLogicalHeight;
        
        const newVisualHeight = oldVisualHeight * scaleY;
        const newLogicalHeight = Math.max(10, newVisualHeight - heightDiff);

        node.scaleX(1);
        node.scaleY(1);

        onChange({
          x: node.x() + (leftQZModules * moduleWidth), // Recalculate offset with new scale
          y: node.y(),
          width: newWidth,
          height: newLogicalHeight,
        });
      }}
    />
  );
};

// --- Main Component ---

export default function CanvasInner() {
  const { elements, selectedId, settings, updateElement, selectElement } = useLabelStore();
  const stageWidth = mmToDots(settings.width, settings.density);
  const stageHeight = mmToDots(settings.height, settings.density);
  
  const trRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  
  const [fontLoaded, setFontLoaded] = useState(false);

  // Load OCR-B Font for Barcodes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    fetch('/fonts/OCR-B.ttf')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(buffer => {
        // bwip-js requires binary string for fonts in browser environment
        const data = new Uint8Array(buffer);
        let fontStr = '';
        // Efficient chunk processing to avoid stack overflow on large fonts
        const chunkSize = 8192;
        for (let i = 0; i < data.length; i += chunkSize) {
          fontStr += String.fromCharCode.apply(null, Array.from(data.subarray(i, i + chunkSize)));
        }
        
        // Register 'ocrb' to override the default built-in font for EAN-13
        bwipjs.loadFont('ocrb', 100, fontStr);
        setFontLoaded(true);
      })
      .catch(e => {
        console.warn('OCR-B font failed to load, falling back to default system/built-in font.', e);
        // We set loaded to true anyway to ensure we don't hang, just use fallback
        setFontLoaded(true); 
      });
  }, []);

  // Selection logic
  useEffect(() => {
    if (selectedId && trRef.current && stageRef.current) {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, elements]); 

  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectElement(null);
    }
  };

  return (
    <div 
      className="w-full h-full bg-neutral-50/50 overflow-auto flex items-center justify-center p-8 relative"
      draggable="false"
      onDragStart={(e) => e.preventDefault()}
    >
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ 
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }}
      />
      <div 
        className="z-10 bg-white shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 transition-all duration-200" 
        style={{ width: stageWidth, height: stageHeight }}
      >
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
        >
          <Layer>
            {elements.map((el) => {
              const elementProps = {
                element: { ...el, id: el.id },
                isSelected: el.id === selectedId,
                onSelect: () => selectElement(el.id),
                onChange: (newAttrs: Partial<LabelElement>) => updateElement(el.id, newAttrs),
                stageWidth,
                stageHeight,
                density: settings.density,
                fontLoaded, // Pass fontLoaded to trigger re-render of barcodes
              };

              if (el.type === 'rect') return <RectItem key={el.id} {...elementProps} />;
              if (el.type === 'text') return <TextItem key={el.id} {...elementProps} />;
              if (el.type === 'variable') return <TextItem key={el.id} {...elementProps} />;
              if (el.type === 'barcode') return <BarcodeItem key={el.id} {...elementProps} />;
              return null;
            })}
            
            <Transformer
              ref={trRef}
              rotateEnabled={false}
              boundBoxFunc={(oldBox, newBox) => {
                // Minimum size
                const minSize = 5;
                if (newBox.width < minSize || newBox.height < minSize) {
                  return oldBox;
                }

                // Stage boundaries
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
