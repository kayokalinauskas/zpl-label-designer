'use client';

import { useLabelStore } from '@/store/useLabelStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Trash2, Settings } from 'lucide-react';

/**
 * PropertiesPanel Component
 * 
 * Displays and allows editing of properties for the selected canvas element.
 * This component is designed to be used within a tab panel (RightPanel),
 * so it doesn't include its own outer container styling.
 * 
 * The component reads from and writes to useLabelStore, ensuring
 * single source of truth for all element state.
 */
export default function PropertiesPanel() {
  const { elements, selectedId, updateElement, removeElement } = useLabelStore();
  
  const selectedElement = elements.find(el => el.id === selectedId);

  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 p-4">
        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
          <Settings className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-sm font-medium">Nenhum elemento selecionado</p>
        <p className="text-xs text-slate-300 text-center max-w-45">
          Clique em um elemento no canvas ou selecione na aba Camadas
        </p>
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    updateElement(selectedElement.id, { [key]: value });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with element type */}
      <div className="p-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">Propriedades</h3>
          <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
            {selectedElement.type}
          </span>
        </div>
      </div>
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        
        {/* Common Properties - Position & Size */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">X (dots)</Label>
              <Input 
                type="number" 
                min={0}
                value={Math.round(selectedElement.x)} 
                onChange={(e) => handleChange('x', Math.max(0, Number(e.target.value)))} 
              />
            </div>
            <div>
              <Label className="text-xs">Y (dots)</Label>
              <Input 
                type="number"
                min={0}
                value={Math.round(selectedElement.y)} 
                onChange={(e) => handleChange('y', Math.max(0, Number(e.target.value)))} 
              />
            </div>
            <div>
              <Label className="text-xs">Largura</Label>
              <Input 
                type="number"
                min={1}
                value={Math.round(selectedElement.width)} 
                onChange={(e) => handleChange('width', Math.max(1, Number(e.target.value)))} 
              />
            </div>
            <div>
              <Label className="text-xs">Altura</Label>
              <Input 
                type="number"
                min={1}
                value={Math.round(selectedElement.height)} 
                onChange={(e) => handleChange('height', Math.max(1, Number(e.target.value)))} 
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Text & Variable Properties */}
        {(selectedElement.type === 'text' || selectedElement.type === 'variable') && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Conteúdo</Label>
              <textarea
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs mt-1"
                value={selectedElement.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Tamanho da Fonte (dots)</Label>
              <Input 
                type="number"
                min={1}
                value={selectedElement.fontSize || 24} 
                onChange={(e) => handleChange('fontSize', Math.max(1, Number(e.target.value)))} 
              />
            </div>
          </div>
        )}

        {/* Rectangle Properties */}
        {selectedElement.type === 'rect' && (
          <div className="space-y-3">
             <div>
              <Label className="text-xs">Espessura da Borda (dots)</Label>
              <Input 
                type="number"
                min={0}
                value={selectedElement.strokeWidth || 0} 
                onChange={(e) => handleChange('strokeWidth', Math.max(0, Number(e.target.value)))} 
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Se a espessura for maior que largura/altura, será preenchido.
              </p>
            </div>
          </div>
        )}

        {/* Line Properties */}
        {selectedElement.type === 'line' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Orientação</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={selectedElement.lineOrientation === 'horizontal' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const currentWidth = selectedElement.width;
                    const currentHeight = selectedElement.height;
                    handleChange('lineOrientation', 'horizontal');
                    if (selectedElement.lineOrientation === 'vertical') {
                      handleChange('width', currentHeight);
                      handleChange('height', currentWidth);
                    }
                  }}
                >
                  Horizontal
                </Button>
                <Button
                  variant={selectedElement.lineOrientation === 'vertical' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const currentWidth = selectedElement.width;
                    const currentHeight = selectedElement.height;
                    handleChange('lineOrientation', 'vertical');
                    if (selectedElement.lineOrientation === 'horizontal') {
                      handleChange('width', currentHeight);
                      handleChange('height', currentWidth);
                    }
                  }}
                >
                  Vertical
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Comprimento (dots)</Label>
              <Input 
                type="number"
                min={1}
                value={selectedElement.lineOrientation === 'horizontal' ? selectedElement.width : selectedElement.height} 
                onChange={(e) => {
                  const value = Math.max(1, Number(e.target.value));
                  if (selectedElement.lineOrientation === 'horizontal') {
                    handleChange('width', value);
                  } else {
                    handleChange('height', value);
                  }
                }} 
              />
            </div>
            <div>
              <Label className="text-xs">Espessura (dots)</Label>
              <Input 
                type="number"
                min={1}
                value={selectedElement.lineOrientation === 'horizontal' ? selectedElement.height : selectedElement.width} 
                onChange={(e) => {
                  const value = Math.max(1, Number(e.target.value));
                  if (selectedElement.lineOrientation === 'horizontal') {
                    handleChange('height', value);
                  } else {
                    handleChange('width', value);
                  }
                }} 
              />
            </div>
          </div>
        )}

        {/* Barcode Properties */}
        {selectedElement.type === 'barcode' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Valor EAN-13 (Preview)</Label>
              <Input 
                value={selectedElement.barcodeValue || ''} 
                onChange={(e) => handleChange('barcodeValue', e.target.value)} 
                maxLength={13}
                className="font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Deve ter 12 ou 13 dígitos</p>
              <p className="text-[10px] text-amber-600 mt-1 font-medium">
                Nota: No ZPL final, será substituído por {'${etiqueta.barra}'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="showText"
                className="rounded"
                checked={selectedElement.showHumanReadable} 
                onChange={(e) => handleChange('showHumanReadable', e.target.checked)} 
              />
              <Label htmlFor="showText" className="text-xs cursor-pointer">Exibir Texto</Label>
            </div>
          </div>
        )}

      </div>

      {/* Delete Button Footer */}
      <div className="p-3 border-t border-slate-100 shrink-0">
        <Button 
          variant="destructive" 
          size="sm"
          className="w-full"
          onClick={() => removeElement(selectedElement.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir Elemento
        </Button>
      </div>
    </div>
  );
}
