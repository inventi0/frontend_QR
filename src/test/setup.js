/**
 * Vitest Setup File
 * 
 * Настройка окружения для тестирования.
 */
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Автоматическая очистка после каждого теста
afterEach(() => {
  cleanup();
});

// Mock для localStorage (для тестирования session.js)
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

globalThis.localStorage = localStorageMock;

// Mock для import.meta.env
globalThis.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:8000',
      DEV: true,
    },
  },
};
