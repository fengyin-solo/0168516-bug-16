import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  PromptTemplate,
  CreatePromptTemplateParams,
  UpdatePromptTemplateParams,
} from '../types';
import {
  loadPromptTemplates,
  savePromptTemplates,
  resetPromptTemplates,
} from '../services/storage';

interface PromptTemplateState {
  templates: PromptTemplate[];
  selectedCategory: string | null;
  searchQuery: string;
  showFavoritesOnly: boolean;
  initialized: boolean;
}

interface PromptTemplateActions {
  initTemplates: () => void;
  addTemplate: (params: CreatePromptTemplateParams) => string;
  updateTemplate: (id: string, params: UpdatePromptTemplateParams) => void;
  deleteTemplate: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  setShowFavoritesOnly: (show: boolean) => void;
  resetToDefaults: () => void;
  getFilteredTemplates: () => PromptTemplate[];
  getCategories: () => string[];
}

type PromptTemplateStore = PromptTemplateState & PromptTemplateActions;

const persistTemplates = (templates: PromptTemplate[]) => {
  try {
    savePromptTemplates(templates);
  } catch (error) {
    console.error('Failed to save prompt templates:', error);
  }
};

export const usePromptTemplateStore = create<PromptTemplateStore>((set, get) => ({
  templates: [],
  selectedCategory: null,
  searchQuery: '',
  showFavoritesOnly: false,
  initialized: false,

  initTemplates: () => {
    const templates = loadPromptTemplates();
    set({ templates, initialized: true });
  },

  addTemplate: (params) => {
    const id = uuidv4();
    const now = Date.now();

    const newTemplate: PromptTemplate = {
      id,
      name: params.name,
      content: params.content,
      category: params.category,
      description: params.description,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };

    const templates = [newTemplate, ...get().templates];
    set({ templates });
    persistTemplates(templates);

    return id;
  },

  updateTemplate: (id, params) => {
    const templates = get().templates.map((template) => {
      if (template.id !== id) return template;
      return {
        ...template,
        ...params,
        updatedAt: Date.now(),
      };
    });

    set({ templates });
    persistTemplates(templates);
  },

  deleteTemplate: (id) => {
    const templates = get().templates.filter((template) => template.id !== id);
    set({ templates });
    persistTemplates(templates);
  },

  toggleFavorite: (id) => {
    const templates = get().templates.map((template) => {
      if (template.id !== id) return template;
      return {
        ...template,
        isFavorite: !template.isFavorite,
        updatedAt: Date.now(),
      };
    });

    set({ templates });
    persistTemplates(templates);
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setShowFavoritesOnly: (show) => {
    set({ showFavoritesOnly: show });
  },

  resetToDefaults: () => {
    const templates = resetPromptTemplates();
    set({ templates, selectedCategory: null, searchQuery: '', showFavoritesOnly: false });
  },

  getFilteredTemplates: () => {
    const { templates, selectedCategory, searchQuery, showFavoritesOnly } = get();

    return templates.filter((t) => {
      if (selectedCategory && t.category !== selectedCategory) {
        return false;
      }

      if (showFavoritesOnly && !t.isFavorite) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(query) ||
          (t.description?.toLowerCase().includes(query)) ||
          t.content.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
        );
      }

      return true;
    });
  },

  getCategories: () => {
    const { templates } = get();
    const categories = new Set<string>();
    templates.forEach((t) => categories.add(t.category));
    return Array.from(categories).sort();
  },
}));
