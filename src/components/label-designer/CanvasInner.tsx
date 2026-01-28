'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Image, Transformer } from 'react-konva';
import Konva from 'konva';
import bwipjs from 'bwip-js';
import { useLabelStore } from '@/store/useLabelStore';
import { mmToDots, LabelElement } from '@/types';
import { isRectFilled } from '@/lib/zpl-generator';
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
  
  // Use shared helper for consistent filled logic
  const isFilled = isRectFilled(element);

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

const LineItem = ({ element, isSelected, onSelect, onChange, stageWidth, stageHeight }: any) => {
  const shapeRef = useRef<Konva.Rect>(null);

  // Lines in ZPL are rendered using ^GB with either width=thickness or height=thickness
  // Horizontal line: width=length, height=thickness
  // Vertical line: width=thickness, height=length
  const isHorizontal = element.lineOrientation === 'horizontal';
  
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
      dragBoundFunc={(pos) => {
        return {
          x: Math.max(0, Math.min(pos.x, stageWidth - element.width)),
          y: Math.max(0, Math.min(pos.y, stageHeight - element.height)),
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
        
        const newWidth = Math.max(1, node.width() * scaleX);
        const newHeight = Math.max(1, node.height() * scaleY);
        
        node.scaleX(1);
        node.scaleY(1);

        onChange({
          x: node.x(),
          y: node.y(),
          width: newWidth,
          height: newHeight,
        });
      }}
    />
  );
};

const TextItem = ({ element, isSelected, onSelect, onChange, stageWidth, stageHeight }: any) => {
  const shapeRef = useRef<Konva.Text>(null);
  const lastSyncedHeightRef = useRef<number>(element.height);

  // ZPL ^A0N,H,W positions text at the TOP of the character cell.
  // Canvas/CSS fonts have internal metrics where glyphs don't start at y=0.
  // 
  // APPROACH: Render text normally in Konva (no offset tricks).
  // The Transformer will match the Konva Text bounding box.
  // We'll compensate in the ZPL generator by adjusting the Y position.
  //
  // This keeps the canvas WYSIWYG accurate to what Konva renders,
  // and the ZPL generator handles the translation to ZPL coordinates.
  
  const zplFontHeight = element.fontSize || 24;
  const konvaFontSize = zplFontHeight;
  
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
  }, [element.text, element.fontSize, element.width, onChange]);

  return (
    <Text
      ref={shapeRef}
      id={element.id}
      x={element.x}
      y={element.y}
      text={element.text}
      fontSize={konvaFontSize}
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
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = shapeRef.current;
        if (!node) return;
        
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        const newWidth = Math.max(5, node.width() * scaleX);
        const newFontSize = Math.max(8, Math.round(element.fontSize * scaleY));

        node.scaleX(1);
        node.scaleY(1);
        node.width(newWidth);
        
        onChange({
            x: node.x(),
            y: node.y(),
            width: newWidth,
            fontSize: newFontSize,
        });
      }}
    />
  );
};

const BarcodeItem = ({ element, isSelected, onSelect, onChange, stageWidth, stageHeight, density, fontLoaded }: any) => {
  const [imageCanvas, setImageCanvas] = useState<HTMLCanvasElement | null>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const shapeRef = useRef<Konva.Image>(null);

  // Validate EAN-13: must be 12 or 13 numeric digits
  const isValidEAN13 = (value: string): boolean => {
    return /^\d{12,13}$/.test(value || '');
  };

  // ZPL/EAN-13 Logical vs Visual Constants
  // Logical: 95 modules (bars only).
  // Visual: ~113 modules (11 Left QZ + 95 Bars + 7 Right QZ).
  // Offset: 11 modules left.
  const modules = 95;
  const leftQZModules = 11;
  const scale = Math.max(1, Math.floor(element.width / modules));
  const offset = leftQZModules * scale;

  useEffect(() => {
    // Validate barcode value first
    if (!isValidEAN13(element.barcodeValue)) {
      setBarcodeError('EAN-13 deve ter 12 ou 13 dígitos numéricos');
      setImageCanvas(null);
      return;
    }

    const canvas = document.createElement('canvas');
    try {
      // ZPL behavior: ^BEN,h,f,g specifies bar height in dots.
      // When includetext=Y, text is rendered BELOW the bars (bars keep full height).
      // 
      // bwip-js behavior: When includetext=true, it REDUCES bar height to ~92.5% 
      // to fit text within the specified height (bhs values show 0.925).
      //
      // To match ZPL: We need to compensate by increasing the height parameter
      // so that after bwip-js reduces it, the bars end up at element.height.
      //
      // Compensation factor: 1 / 0.925 ≈ 1.081 when includetext is true
      const BAR_HEIGHT_RATIO_WITH_TEXT = 0.925;
      const compensationFactor = element.showHumanReadable ? (1 / BAR_HEIGHT_RATIO_WITH_TEXT) : 1;
      
      // Convert desired bar height (in pixels/dots) to millimeters for bwip-js
      // bwip-js formula: rendered_pixels = height_mm * (72/25.4) * scale
      // We want: bar_height_pixels = element.height
      // With compensation: total_height_mm = (element.height * compensationFactor / scale) * (25.4 / 72)
      const targetHeightMm = (element.height * compensationFactor / scale) * (25.4 / 72);
      
      // bwip-js renders the full visual barcode (including quiet zones and text)
      bwipjs.toCanvas(canvas, {
        bcid: 'ean13',
        text: element.barcodeValue,
        scale: scale, 
        height: targetHeightMm, 
        includetext: element.showHumanReadable,
        // textxalign: 'center', // Removed to enforce standard EAN-13 layout (first digit left)
      });
      setImageCanvas(canvas);
      setBarcodeError(null);
    } catch (e) {
      console.warn('Barcode render error', e);
      setBarcodeError('Erro ao renderizar código de barras');
      setImageCanvas(null);
    }
  }, [element.barcodeValue, element.showHumanReadable, element.height, element.width, density, scale, fontLoaded]);

  // Show error placeholder if barcode is invalid
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
              if (el.type === 'line') return <LineItem key={el.id} {...elementProps} />;
              if (el.type === 'text') return <TextItem key={el.id} {...elementProps} />;
              if (el.type === 'variable') return <TextItem key={el.id} {...elementProps} />;
              if (el.type === 'barcode') return <BarcodeItem key={el.id} {...elementProps} />;
              return null;
            })}
            
            <Transformer
              ref={trRef}
              rotateEnabled={false}
              // Critical: Prevent centering behavior during scaling
              // This ensures scaling happens from the anchor point, not from center
              centeredScaling={false}
              // No padding between the transformer border and the actual shape
              padding={0}
              // Ensure anchors are at exact corners
              anchorCornerRadius={0}
              // Keep ratio only when shift is pressed (optional, can remove if not desired)
              keepRatio={false}
              // Enable scaling from all corners and edges
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']}
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
