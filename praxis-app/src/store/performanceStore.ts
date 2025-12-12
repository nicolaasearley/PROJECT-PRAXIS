import { create } from 'zustand';
import {
  AutoRegSetInput,
  AutoRegContext,
  AutoRegRecommendation,
  DifficultyFlag,
} from '@/engine/autoregulation/autoRegTypes';

/**
 * Performance event for a completed set
 */
export type SetPerformanceEvent = {
  id: string; // Unique per event
  planDayId: string | null;
  blockId: string;
  setIndex: number;
  timestampISO: string;
  input: AutoRegSetInput;
  context: AutoRegContext;
  recommendation: AutoRegRecommendation | null;
};

/**
 * Suggestion for an upcoming set (for UI display)
 */
export interface SetSuggestion {
  id: string; // `${planDayId}-${blockId}-${setIndex}-${timestamp}`
  planDayId: string;
  blockId: string;
  setIndex: number; // the index of the UPCOMING set this suggestion applies to
  prevWeight: number | null;
  suggestedWeight: number | null;
  difficulty: DifficultyFlag | null;
  createdAtISO: string;
}

interface PerformanceStoreState {
  events: SetPerformanceEvent[];
  suggestions: SetSuggestion[];
  addEvent: (
    event: Omit<SetPerformanceEvent, 'id' | 'timestampISO'> & {
      recommendation?: AutoRegRecommendation | null;
    }
  ) => void;
  addSuggestion: (suggestion: SetSuggestion) => void;
  clearSuggestionForSet: (planDayId: string, blockId: string, setIndex: number) => void;
  clearSessionSuggestions: () => void;
  clearSession: () => void;
}

export const usePerformanceStore = create<PerformanceStoreState>((set) => ({
  events: [],
  suggestions: [],

  addEvent: (event) => {
    const id = `${event.blockId}-${event.setIndex}-${Date.now()}`;
    const timestampISO = new Date().toISOString();

    set((state) => ({
      events: [
        ...state.events,
        {
          ...event,
          id,
          timestampISO,
          recommendation: event.recommendation ?? null,
        },
      ],
    }));
  },

  addSuggestion: (suggestion) => {
    set((state) => {
      // Check if there's an existing suggestion for the same (planDayId, blockId, setIndex)
      const existingIndex = state.suggestions.findIndex(
        (s) =>
          s.planDayId === suggestion.planDayId &&
          s.blockId === suggestion.blockId &&
          s.setIndex === suggestion.setIndex
      );

      if (existingIndex >= 0) {
        // Replace existing suggestion
        const updated = [...state.suggestions];
        updated[existingIndex] = suggestion;
        return { suggestions: updated };
      } else {
        // Add new suggestion
        return { suggestions: [...state.suggestions, suggestion] };
      }
    });
  },

  clearSuggestionForSet: (planDayId, blockId, setIndex) => {
    set((state) => ({
      suggestions: state.suggestions.filter(
        (s) =>
          !(s.planDayId === planDayId && s.blockId === blockId && s.setIndex === setIndex)
      ),
    }));
  },

  clearSessionSuggestions: () => {
    set({ suggestions: [] });
  },

  clearSession: () => {
    set({ events: [], suggestions: [] });
  },
}));
