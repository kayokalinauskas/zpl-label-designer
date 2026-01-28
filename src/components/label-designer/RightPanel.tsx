'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Layers } from 'lucide-react';
import PropertiesPanel from './PropertiesPanel';
import LayersPanel from './LayersPanel';
import { useLabelStore } from '@/store/useLabelStore';

/**
 * RightPanel Component
 * 
 * Container for the right side panels with tabs:
 * - Properties: Edit properties of the selected element
 * - Layers: View and select elements by layer
 * 
 * Both panels share the same source of truth (useLabelStore),
 * ensuring bidirectional sync between canvas selection and layer selection.
 */
export default function RightPanel() {
  const { elements } = useLabelStore();

  return (
    <div className="w-100 border-l border-slate-100 bg-white flex flex-col h-full shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)] z-20">
      <Tabs defaultValue="properties" className="flex flex-col h-full">
        {/* Tab Headers */}
        <div className="border-b border-slate-100 px-2 pt-2 bg-white/50 backdrop-blur-sm shrink-0">
          <TabsList className="w-full grid grid-cols-2 h-10">
            <TabsTrigger 
              value="properties" 
              className="flex items-center gap-2 text-xs"
            >
              <Settings className="w-3.5 h-3.5" />
              Propriedades
            </TabsTrigger>
            <TabsTrigger 
              value="layers" 
              className="flex items-center gap-2 text-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              Camadas
              {elements.length > 0 && (
                <span className="ml-1 bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">
                  {elements.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Properties Tab Content */}
        <TabsContent value="properties" className="flex-1 m-0 overflow-hidden">
          <PropertiesPanel />
        </TabsContent>

        {/* Layers Tab Content */}
        <TabsContent value="layers" className="flex-1 m-0 overflow-hidden">
          <LayersPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
