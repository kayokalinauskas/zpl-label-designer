'use client';

import { useState } from 'react';
import { useLabelStore } from '@/store/useLabelStore';
import { generateZPL } from '@/lib/zpl-generator';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Download, Copy, FileCode, Check, Trash2, AlertTriangle } from 'lucide-react';
import { PrintDensity } from '@/types';

export default function Header() {
  const { settings, elements, setSettings, clearAll } = useLabelStore();
  const [zplOutput, setZplOutput] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const handleExport = () => {
    const code = generateZPL(elements, settings);
    setZplOutput(code);
    setIsExportOpen(true);
    setHasCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(zplOutput);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleClearCanvas = () => {
    clearAll();
    setIsClearDialogOpen(false);
  };

  return (
    <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-30 relative">
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
          <FileCode className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-slate-900 leading-tight">ZPL Designer</h1>
          <p className="text-[10px] text-slate-500 font-medium">v1.0.0</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Clear Canvas Button with Confirmation */}
        <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
              disabled={elements.length === 0}
              title="Limpar Canvas"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Limpar Canvas
              </DialogTitle>
              <DialogDescription className="pt-2">
                Esta ação irá remover <strong>todos os {elements.length} elemento{elements.length !== 1 ? 's' : ''}</strong> do canvas.
                <br />
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                onClick={handleClearCanvas}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sim, limpar tudo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-slate-200 hover:bg-slate-50 text-slate-700">
              <Settings className="w-4 h-4 mr-2 text-slate-500" />
              Configurações da Etiqueta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configuração da Etiqueta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Largura (mm)</Label>
                  <Input 
                    type="number" 
                    value={settings.width} 
                    onChange={(e) => setSettings({ width: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Altura (mm)</Label>
                  <Input 
                    type="number" 
                    value={settings.height} 
                    onChange={(e) => setSettings({ height: Number(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Densidade de Impressão</Label>
                <Select 
                  value={String(settings.density)} 
                  onValueChange={(val) => setSettings({ density: Number(val) as PrintDensity })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a densidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 dpmm (152 dpi)</SelectItem>
                    <SelectItem value="8">8 dpmm (203 dpi)</SelectItem>
                    <SelectItem value="12">12 dpmm (300 dpi)</SelectItem>
                    <SelectItem value="24">24 dpmm (600 dpi)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Alterar a densidade afetará a resolução do canvas (pontos).
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleExport} className="h-9 bg-slate-900 hover:bg-slate-800 shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar ZPL
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Saída ZPL</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs h-64 overflow-auto whitespace-pre border border-slate-800 shadow-inner">
                {zplOutput}
              </div>
              <Button onClick={copyToClipboard} className="w-full h-10" disabled={hasCopied}>
                {hasCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar para Área de Transferência
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
