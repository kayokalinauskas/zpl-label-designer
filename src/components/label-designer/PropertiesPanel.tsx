'use client';

import { useState } from 'react';
import { useLabelStore } from '@/store/useLabelStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trash2, Settings, Search } from 'lucide-react';
import { LABEL_VARIABLES } from '@/constants/variables';

export default function PropertiesPanel() {
  const { elements, selectedId, updateElement, removeElement } = useLabelStore();
  
  const selectedElement = elements.find(el => el.id === selectedId);

  if (!selectedElement) {
    return (
      <div className="w-80 border-l border-slate-100 bg-white flex flex-col items-center justify-center h-full text-slate-400 gap-3">
        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
          <Settings className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-sm font-medium">Nenhum elemento selecionado</p>
        <p className="text-xs text-slate-300 text-center max-w-[180px]">
          Clique em um elemento no canvas para editar suas propriedades
        </p>
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    updateElement(selectedElement.id, { [key]: value });
  };

  return (
    <div className="w-80 border-l border-slate-100 bg-white flex flex-col h-full shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)] z-20">
      <div className="p-5 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">Propriedades</h3>
          <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
            {selectedElement.type}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-5 space-y-8">
        
        {/* Common Properties */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>X</Label>
              <Input 
                type="number" 
                value={Math.round(selectedElement.x)} 
                onChange={(e) => handleChange('x', Number(e.target.value))} 
              />
            </div>
            <div>
              <Label>Y</Label>
              <Input 
                type="number" 
                value={Math.round(selectedElement.y)} 
                onChange={(e) => handleChange('y', Number(e.target.value))} 
              />
            </div>
            <div>
              <Label>Largura</Label>
              <Input 
                type="number" 
                value={Math.round(selectedElement.width)} 
                onChange={(e) => handleChange('width', Number(e.target.value))} 
              />
            </div>
            <div>
              <Label>Altura</Label>
              <Input 
                type="number" 
                value={Math.round(selectedElement.height)} 
                onChange={(e) => handleChange('height', Number(e.target.value))} 
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Specific Properties */}
        {(selectedElement.type === 'text' || selectedElement.type === 'variable') && (
          <div className="space-y-4">
            <div>
              <Label>Conteúdo</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs"
                value={selectedElement.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
              />
            </div>
            <div>
              <Label>Tamanho da Fonte</Label>
              <Input 
                type="number"
                value={selectedElement.fontSize || 24} 
                onChange={(e) => handleChange('fontSize', Number(e.target.value))} 
              />
            </div>
          </div>
        )}

        {selectedElement.type === 'rect' && (
          <div className="space-y-4">
             <div>
              <Label>Espessura da Borda</Label>
              <Input 
                type="number"
                value={selectedElement.strokeWidth || 0} 
                onChange={(e) => handleChange('strokeWidth', Number(e.target.value))} 
              />
            </div>
          </div>
        )}

        {selectedElement.type === 'barcode' && (
          <div className="space-y-4">
            <div>
              <Label>Valor EAN-13 (Preview)</Label>
              <Input 
                value={selectedElement.barcodeValue || ''} 
                onChange={(e) => handleChange('barcodeValue', e.target.value)} 
                maxLength={13}
              />
              <p className="text-[10px] text-slate-400 mt-1">Deve ter 12 ou 13 dígitos</p>
              <p className="text-[10px] text-amber-600 mt-1 font-medium">Nota: No ZPL final, este valor será substituído por {'${etiqueta.barra}'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="showText"
                checked={selectedElement.showHumanReadable} 
                onChange={(e) => handleChange('showHumanReadable', e.target.checked)} 
              />
              <Label htmlFor="showText">Exibir Texto</Label>
            </div>
          </div>
        )}

      </div>

      <div className="p-4 border-t">
        <Button 
          variant="destructive" 
          className="w-full"C
          onClick={() => removeElement(selectedElement.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir Elemento
        </Button>
      </div>
    </div>
  );
}
