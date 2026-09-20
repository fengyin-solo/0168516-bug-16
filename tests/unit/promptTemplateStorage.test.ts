import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PromptTemplate } from '../../src/types';

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

const buildTemplate = (overrides: Partial<PromptTemplate> = {}): PromptTemplate => ({
  id: 'template-1',
  name: '模板一',
  content: '内容一',
  category: '通用',
  description: '描述一',
  isFavorite: false,
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

describe('prompt template storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('repairs duplicate ids without changing visible name, category or favorite state', async () => {
    const first = buildTemplate();
    const second = buildTemplate({
      name: '模板二',
      content: '内容二',
      category: '编程',
      isFavorite: true,
      createdAt: 2000,
      updatedAt: 2000,
    });
    localStorage.setItem('react-chat-prompt-templates', JSON.stringify([first, second]));

    const { loadPromptTemplates } = await import('../../src/services/storage');
    const templates = loadPromptTemplates();

    expect(templates).toHaveLength(2);
    expect(new Set(templates.map((template) => template.id)).size).toBe(2);
    expect(templates[0]).toMatchObject({ name: '模板一', category: '通用', isFavorite: false });
    expect(templates[1]).toMatchObject({ name: '模板二', category: '编程', isFavorite: true });

    const persisted = JSON.parse(localStorage.getItem('react-chat-prompt-templates') ?? '[]') as PromptTemplate[];
    expect(new Set(persisted.map((template) => template.id)).size).toBe(2);
  });

  it('uses stable default ids independent of array position', async () => {
    const { loadPromptTemplates } = await import('../../src/services/storage');
    localStorage.removeItem('react-chat-prompt-templates');

    const defaults = loadPromptTemplates();

    expect(defaults.every((template) => template.id.startsWith('default-'))).toBe(true);
    expect(new Set(defaults.map((template) => template.id)).size).toBe(defaults.length);
    expect(defaults.some((template) => template.id === 'default-0')).toBe(false);
  });
});
