// ============================================================================
// Label Store
// ============================================================================
// Zustand store for managing label designer state.
// This is the single source of truth for all label data.
//
// Architecture Notes:
// - Element creation delegated to element-factory for consistency
// - Actions are atomic and explicit for future undo/redo support
// - State is persisted to localStorage (elements and settings only)
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LabelElement, LabelSettings, ElementType, ElementUpdate, CreateElementPayload } from '@/types';
import { createElement } from '@/lib/element-factory';

// ----------------------------------------------------------------------------
// State Interface
// ----------------------------------------------------------------------------

interface LabelState {
  // State
  elements: LabelElement[];
  selectedId: string | null;
  settings: LabelSettings;
  
  // Element Actions
  addElement: (type: ElementType, payload?: CreateElementPayload) => void;
  updateElement: (id: string, updates: ElementUpdate) => void;
  removeElement: (id: string) => void;
  clearAll: () => void;
  
  // Selection Actions
  selectElement: (id: string | null) => void;
  
  // Settings Actions
  setSettings: (settings: Partial<LabelSettings>) => void;
  
  // Computed Helpers (for convenience)
  getSelectedElement: () => LabelElement | undefined;
}

// ----------------------------------------------------------------------------
// Default Settings
// ----------------------------------------------------------------------------

const DEFAULT_SETTINGS: LabelSettings = {
  width: 110,   // 110mm default label width
  height: 30,   // 30mm default label height
  density: 8,   // 8 dpmm (203 dpi) - most common
};

// ----------------------------------------------------------------------------
// Store Implementation
// ----------------------------------------------------------------------------

export const useLabelStore = create<LabelState>()(
  persist(
    (set, get) => ({
      // Initial State
      elements: [],
      selectedId: null,
      settings: DEFAULT_SETTINGS,

      // ---------------------------------------------------------------------
      // Element Actions
      // ---------------------------------------------------------------------
      
      /**
       * Add a new element to the canvas.
       * Element creation is delegated to the factory for consistent defaults.
       */
      addElement: (type, payload) => set((state) => {
        const newElement = createElement(type, payload);
        
        return {
          elements: [...state.elements, newElement],
          selectedId: newElement.id, // Auto-select new element
        };
      }),

      /**
       * Update an existing element's properties.
       * Only the specified fields are updated (shallow merge).
       */
      updateElement: (id, updates) => set((state) => ({
        elements: state.elements.map((el) => 
          el.id === id ? { ...el, ...updates } : el
        ),
      })),

      /**
       * Remove an element from the canvas.
       * Clears selection if the removed element was selected.
       */
      removeElement: (id) => set((state) => ({
        elements: state.elements.filter((el) => el.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      })),

      /**
       * Clear all elements from the canvas.
       * Also clears selection.
       */
      clearAll: () => set({ 
        elements: [], 
        selectedId: null 
      }),

      // ---------------------------------------------------------------------
      // Selection Actions
      // ---------------------------------------------------------------------
      
      /**
       * Select an element by ID, or clear selection (null).
       */
      selectElement: (id) => set({ selectedId: id }),

      // ---------------------------------------------------------------------
      // Settings Actions
      // ---------------------------------------------------------------------
      
      /**
       * Update label settings (partial update supported).
       */
      setSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      // ---------------------------------------------------------------------
      // Computed Helpers
      // ---------------------------------------------------------------------
      
      /**
       * Get the currently selected element.
       * Returns undefined if nothing is selected.
       */
      getSelectedElement: () => {
        const state = get();
        return state.elements.find(el => el.id === state.selectedId);
      },
    }),
    {
      name: 'zpl-label-store',
      partialize: (state) => ({ 
        elements: state.elements, 
        settings: state.settings 
      }),
    }
  )
);
