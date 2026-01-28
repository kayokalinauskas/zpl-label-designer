'use client';

import { useState } from 'react';
import { useLabelStore } from '@/store/useLabelStore';
import { Button } from '@/components/ui/button';
import { Type, Square, Barcode, Database, Search, Minus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { LABEL_VARIABLES } from '@/constants/variables';

export default function Sidebar() {
  const { addElement } = useLabelStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVariables = LABEL_VARIABLES.filter(v => 
    v.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-18 border-r border-slate-100 bg-white flex flex-col items-center py-6 space-y-6 shrink-0 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => addElement('text')} 
          title="Adicionar Texto"
          className="h-10 w-10 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors"
        >
          <Type className="w-5 h-5" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => addElement('rect')} 
          title="Adicionar Retângulo"
          className="h-10 w-10 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors"
        >
          <Square className="w-5 h-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => addElement('line')} 
          title="Adicionar Linha"
          className="h-10 w-10 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors"
        >
          <Minus className="w-5 h-5" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => addElement('barcode')} 
          title="Adicionar Código de Barras EAN-13"
          className="h-10 w-10 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors"
        >
          <Barcode className="w-5 h-5" />
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              title="Adicionar Variável"
              className="h-10 w-10 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors"
            >
              <Database className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[400px] sm:w-[540px] ml-18 p-0 gap-0">
             <div className="p-6 border-b border-slate-100">
                <SheetHeader>
                  <SheetTitle>Variáveis de Dados</SheetTitle>
                </SheetHeader>
                <div className="mt-4 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar variáveis..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
             </div>
             <div className="overflow-y-auto h-[calc(100vh-140px)] p-4">
                <div className="grid gap-2">
                  {filteredVariables.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => addElement('variable', v.value)} // Sheet closes automatically? Usually not, user might want to add multiple. Add visual feedback or close manually? Let's keep it open.
                      className="flex flex-col items-start p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left"
                    >
                      <span className="font-semibold text-sm text-slate-900">{v.label}</span>
                      <span className="text-xs font-mono text-slate-500 mt-1 bg-slate-100 px-1.5 py-0.5 rounded">{v.value}</span>
                    </button>
                  ))}
                  {filteredVariables.length === 0 && (
                    <p className="text-center text-slate-400 py-10">Nenhuma variável encontrada para "{searchTerm}"</p>
                  )}
                </div>
             </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
