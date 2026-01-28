'use client';

import { useLabelStore } from '@/store/useLabelStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Type, 
  Square, 
  Barcode, 
  Database, 
  Minus,
  Layers,
  Trash2,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LabelElement } from '@/types';

/**
 * LayersPanel Component
 * 
 * Displays all canvas elements as layers in rendering order (z-index).
 * Elements are listed from top (last rendered, visually on top) to bottom (first rendered).
 * 
 * Features:
 * - Click a layer to select it on canvas
 * - Selection syncs bidirectionally with canvas
 * - Visual indicator for selected layer
 * - Element type icons and labels for easy identification
 */

// Helper to get icon for element type
const getElementIcon = (type: LabelElement['type']) => {
  switch (type) {
    case 'text':
      return <Type className="w-4 h-4" />;
    case 'variable':
      return <Database className="w-4 h-4" />;
    case 'rect':
      return <Square className="w-4 h-4" />;
    case 'line':
      return <Minus className="w-4 h-4" />;
    case 'barcode':
      return <Barcode className="w-4 h-4" />;
    default:
      return <Square className="w-4 h-4" />;
  }
};

// Helper to get display label for element
const getElementLabel = (element: LabelElement): string => {
  switch (element.type) {
    case 'text':
      // Show first 20 chars of text content
      const textContent = element.text || 'Texto';
      return textContent.length > 20 ? textContent.slice(0, 20) + '...' : textContent;
    case 'variable':
      // Show variable name
      return element.text || '${variável}';
    case 'rect':
      return 'Retângulo';
    case 'line':
      return element.lineOrientation === 'vertical' ? 'Linha Vertical' : 'Linha Horizontal';
    case 'barcode':
      return `EAN-13: ${element.barcodeValue?.slice(0, 8) || '...'}`;
    default:
      return 'Elemento';
  }
};

// Helper to get type label in Portuguese
const getTypeLabel = (type: LabelElement['type']): string => {
  switch (type) {
    case 'text': return 'Texto';
    case 'variable': return 'Variável';
    case 'rect': return 'Retângulo';
    case 'line': return 'Linha';
    case 'barcode': return 'Código de Barras';
    default: return 'Elemento';
  }
};

export default function LayersPanel() {
  const { elements, selectedId, selectElement, removeElement } = useLabelStore();
  
  // Reverse order so top-most element (last in array) appears first in the list
  // This matches typical layer panel behavior (top layer = top of list)
  const layersInOrder = [...elements].reverse();

  const handleDelete = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation(); // Prevent selecting the element when clicking delete
    removeElement(elementId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-sm text-slate-900">Camadas</h3>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {elements.length}
          </span>
        </div>
      </div>

      {/* Layers List */}
      <ScrollArea className="flex-1">
        {elements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 p-4">
            <Layers className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs text-center">
              Nenhum elemento no canvas.
              <br />
              Adicione elementos pela barra lateral.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {layersInOrder.map((element, index) => {
              const isSelected = element.id === selectedId;
              // Calculate z-index display (1-based, from bottom)
              const zIndex = elements.length - index;
              
              return (
                <div
                  key={element.id}
                  onClick={() => selectElement(element.id)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all cursor-pointer",
                    "hover:bg-slate-100 group",
                    isSelected && "bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200"
                  )}
                >
                  {/* Drag handle placeholder - for future reordering */}
                  <div className="opacity-0 group-hover:opacity-40 transition-opacity cursor-grab">
                    <GripVertical className="w-3 h-3 text-slate-400" />
                  </div>
                  
                  {/* Element icon */}
                  <div className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                    isSelected ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {getElementIcon(element.type)}
                  </div>
                  
                  {/* Element info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isSelected ? "text-blue-900" : "text-slate-700"
                    )}>
                      {getElementLabel(element)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {getTypeLabel(element.type)} • z:{zIndex}
                    </p>
                  </div>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, element.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-100 transition-all"
                    title="Excluir elemento"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500 hover:text-red-600" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      
      {/* Footer with element count */}
      {elements.length > 0 && (
        <div className="p-3 border-t border-slate-100 text-xs text-slate-400 text-center">
          {elements.length} elemento{elements.length !== 1 ? 's' : ''} no canvas
        </div>
      )}
    </div>
  );
}
