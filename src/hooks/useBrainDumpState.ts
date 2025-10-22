import { useReducer, useCallback } from 'react';

type BrainDumpState = {
  isQuickCaptureOpen: boolean;
  categorizingThoughts: Set<string>;
  connections: any[];
  isLoadingConnections: boolean;
  isSelectionMode: boolean;
  selectedThoughts: Set<string>;
  isPerformingBulkAction: boolean;
};

type BrainDumpAction =
  | { type: 'TOGGLE_QUICK_CAPTURE'; payload?: boolean }
  | { type: 'SET_CATEGORIZING'; payload: { thoughtIds: string[]; isCategorizing: boolean } }
  | { type: 'SET_CONNECTIONS'; payload: { connections: any[]; isLoading: boolean } }
  | { type: 'TOGGLE_SELECTION_MODE' }
  | { type: 'TOGGLE_THOUGHT_SELECTION'; payload: string }
  | { type: 'SELECT_ALL'; payload: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_BULK_ACTION_LOADING'; payload: boolean };

const initialState: BrainDumpState = {
  isQuickCaptureOpen: false,
  categorizingThoughts: new Set(),
  connections: [],
  isLoadingConnections: false,
  isSelectionMode: false,
  selectedThoughts: new Set(),
  isPerformingBulkAction: false,
};

function brainDumpReducer(state: BrainDumpState, action: BrainDumpAction): BrainDumpState {
  switch (action.type) {
    case 'TOGGLE_QUICK_CAPTURE':
      return { ...state, isQuickCaptureOpen: action.payload ?? !state.isQuickCaptureOpen };
    
    case 'SET_CATEGORIZING': {
      const next = new Set(state.categorizingThoughts);
      action.payload.thoughtIds.forEach(id => {
        action.payload.isCategorizing ? next.add(id) : next.delete(id);
      });
      return { ...state, categorizingThoughts: next };
    }
    
    case 'SET_CONNECTIONS':
      return { 
        ...state, 
        connections: action.payload.connections,
        isLoadingConnections: action.payload.isLoading 
      };
    
    case 'TOGGLE_SELECTION_MODE':
      return { 
        ...state, 
        isSelectionMode: !state.isSelectionMode,
        selectedThoughts: new Set() 
      };
    
    case 'TOGGLE_THOUGHT_SELECTION': {
      const next = new Set(state.selectedThoughts);
      next.has(action.payload) ? next.delete(action.payload) : next.add(action.payload);
      return { ...state, selectedThoughts: next };
    }
    
    case 'SELECT_ALL':
      return { ...state, selectedThoughts: new Set(action.payload) };
    
    case 'CLEAR_SELECTION':
      return { ...state, isSelectionMode: false, selectedThoughts: new Set() };
    
    case 'SET_BULK_ACTION_LOADING':
      return { ...state, isPerformingBulkAction: action.payload };
    
    default:
      return state;
  }
}

export function useBrainDumpState() {
  const [state, dispatch] = useReducer(brainDumpReducer, initialState);
  
  const actions = {
    toggleQuickCapture: useCallback((open?: boolean) => 
      dispatch({ type: 'TOGGLE_QUICK_CAPTURE', payload: open }), []),
    
    setCategorizingThoughts: useCallback((thoughtIds: string[], isCategorizing: boolean) =>
      dispatch({ type: 'SET_CATEGORIZING', payload: { thoughtIds, isCategorizing } }), []),
    
    setConnections: useCallback((connections: any[], isLoading: boolean) =>
      dispatch({ type: 'SET_CONNECTIONS', payload: { connections, isLoading } }), []),
    
    toggleSelectionMode: useCallback(() => 
      dispatch({ type: 'TOGGLE_SELECTION_MODE' }), []),
    
    toggleThoughtSelection: useCallback((thoughtId: string) =>
      dispatch({ type: 'TOGGLE_THOUGHT_SELECTION', payload: thoughtId }), []),
    
    selectAll: useCallback((thoughtIds: string[]) =>
      dispatch({ type: 'SELECT_ALL', payload: thoughtIds }), []),
    
    clearSelection: useCallback(() => 
      dispatch({ type: 'CLEAR_SELECTION' }), []),
    
    setBulkActionLoading: useCallback((isLoading: boolean) =>
      dispatch({ type: 'SET_BULK_ACTION_LOADING', payload: isLoading }), []),
  };
  
  return { state, actions };
}
