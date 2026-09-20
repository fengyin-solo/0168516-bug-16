import { beforeEach, describe, expect, it, vi } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('promptTemplateStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('applies favorite, update and delete only to the selected template', async () => {
    const { usePromptTemplateStore } = await import('../../src/stores/promptTemplateStore');
    const store = usePromptTemplateStore.getState();

    store.initTemplates();

    const before = usePromptTemplateStore.getState();
    const [first, second] = before.templates;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) throw new Error('Default templates were not initialized');

    before.toggleFavorite(first.id);
    let state = usePromptTemplateStore.getState();
    let updatedFirst = state.templates.find((template) => template.id === first.id);
    let updatedSecond = state.templates.find((template) => template.id === second.id);
    expect(updatedFirst?.isFavorite).toBe(!first.isFavorite);
    expect(updatedSecond?.isFavorite).toBe(second.isFavorite);

    const favoriteIds = state.templates
      .filter((template) => (template.id === first.id ? !first.isFavorite : template.isFavorite))
      .map((template) => template.id);
    state.setShowFavoritesOnly(true);
    expect(state.getFilteredTemplates().map((template) => template.id)).toEqual(favoriteIds);
    expect(
      state.getFilteredTemplates().find((template) => template.id === second.id)
    ).toMatchObject({
      name: second.name,
      category: second.category,
      content: second.content,
    });
    state.setShowFavoritesOnly(false);

    state.setSearchQuery(first.name);
    state.updateTemplate(first.id, {
      name: '专属编辑内容',
      category: '其他',
      content: '只属于第一张卡片的内容',
      description: '只属于第一张卡片的描述',
    });
    state.setSearchQuery('');
    state = usePromptTemplateStore.getState();
    updatedFirst = state.templates.find((template) => template.id === first.id);
    updatedSecond = state.templates.find((template) => template.id === second.id);
    expect(updatedFirst).toMatchObject({
      name: '专属编辑内容',
      category: '其他',
      content: '只属于第一张卡片的内容',
    });
    expect(updatedSecond).toMatchObject({
      name: second.name,
      category: second.category,
      content: second.content,
    });

    const totalBeforeDelete = usePromptTemplateStore.getState().templates.length;
    usePromptTemplateStore.getState().deleteTemplate(first.id);
    state = usePromptTemplateStore.getState();
    expect(state.templates).toHaveLength(totalBeforeDelete - 1);
    expect(state.templates.some((template) => template.id === first.id)).toBe(false);
    expect(state.templates.some((template) => template.name === second.name)).toBe(true);
  });

  it('persists favorite state and preserves unchanged template content after reloading', async () => {
    const firstStoreModule = await import('../../src/stores/promptTemplateStore');
    firstStoreModule.usePromptTemplateStore.getState().initTemplates();

    const target = firstStoreModule.usePromptTemplateStore.getState().templates[0];
    expect(target).toBeDefined();
    if (!target) throw new Error('Target template was not initialized');

    const nextFavoriteState = !target.isFavorite;
    firstStoreModule.usePromptTemplateStore.getState().toggleFavorite(target.id);

    vi.resetModules();
    const secondStoreModule = await import('../../src/stores/promptTemplateStore');
    secondStoreModule.usePromptTemplateStore.getState().initTemplates();

    const reloaded = secondStoreModule.usePromptTemplateStore
      .getState()
      .templates.find((template) => template.id === target.id);

    expect(reloaded?.isFavorite).toBe(nextFavoriteState);
    expect(reloaded).toMatchObject({
      name: target.name,
      category: target.category,
      content: target.content,
    });
  });
});
