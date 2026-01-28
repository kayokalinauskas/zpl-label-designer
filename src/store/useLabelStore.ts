import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LabelElement, LabelSettings, ElementType } from '@/types';

interface LabelState {
  elements: LabelElement[];
  selectedId: string | null;
  settings: LabelSettings;
  
  addElement: (type: ElementType, payload?: string) => void;
  updateElement: (id: string, updates: Partial<LabelElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setSettings: (settings: Partial<LabelSettings>) => void;
  clearAll: () => void;
}

export const useLabelStore = create<LabelState>()(
  persist(
    (set) => ({
      elements: [],
      selectedId: null,
      settings: {
        width: 110, // 110mm default
        height: 30, // 30mm default
        density: 8, // 8 dpmm (203 dpi) default
      },

      addElement: (type, payload) => set((state) => {
        const id = crypto.randomUUID();
        // Center logic could be improved, but 0,0 is fine for now
        const baseElement = {
          id,
          x: 10,
          y: 10,
        };

        let newElement: LabelElement;

        const density = state.settings.density;

        switch (type) {
          case 'text':
            newElement = {
              ...baseElement,
              type: 'text',
              text: 'New Text',
              fontSize: 24, // approx 12pt at 203dpi? No, dots.
              width: 200,
              height: 30,
              isBold: true, // approximate
            };
            break;
          case 'variable':
            newElement = {
              ...baseElement,
              type: 'variable',
              text: payload || '${variable}',
              fontSize: 24,
              width: 300,
              height: 30,
              fill: '#2563eb', // Make variables blue to distinguish them
            };
            break;
          case 'rect':
            newElement = {
              ...baseElement,
              type: 'rect',
              width: 100,
              height: 100,
              stroke: 'black',
              strokeWidth: 2, // Border thickness in dots
            };
            break;
          case 'line':
            newElement = {
              ...baseElement,
              type: 'line',
              width: 100, // Length of the line
              height: 2,  // Thickness of the line
              lineOrientation: 'horizontal',
              stroke: 'black',
            };
            break;
          case 'barcode':
            const d = state.settings.density;
            newElement = {
              ...baseElement,
              type: 'barcode',
              barcodeValue: '1234567890128', // Valid 13-digit EAN example
              // Set width to 190 dots (95 modules * 2 dots/module) to match ^BY2 default
              width: 190, 
              height: 100, // Initial height set to 100 dots as requested
              showHumanReadable: true,
            };
            break;
        }

        return {
          elements: [...state.elements, newElement],
          selectedId: id,
        };
      }),

      updateElement: (id, updates) => set((state) => ({
        elements: state.elements.map((el) => 
          el.id === id ? { ...el, ...updates } : el
        ),
      })),

      removeElement: (id) => set((state) => ({
        elements: state.elements.filter((el) => el.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      })),

      selectElement: (id) => set({ selectedId: id }),

      setSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      clearAll: () => set({ 
        elements: [], 
        selectedId: null 
      }),
    }),
    {
      name: 'zpl-label-store', // localStorage key
      partialize: (state) => ({ 
        elements: state.elements, 
        settings: state.settings 
      }), // Don't persist selectedId
    }
  )
);
