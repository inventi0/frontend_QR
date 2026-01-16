/**
 * Tests for session utilities
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSession, setSession, clearSession } from '../../utils/session';

describe('Session Utils', () => {
  beforeEach(() => {
    // Очистка моков перед каждым тестом
    vi.clearAllMocks();
  });

  it('getSession should return parsed session from localStorage', () => {
    const mockSession = { accessToken: 'test-token', tokenType: 'bearer' };
    localStorage.getItem.mockReturnValue(JSON.stringify(mockSession));

    const result = getSession();

    expect(localStorage.getItem).toHaveBeenCalledWith('session');
    expect(result).toEqual(mockSession);
  });

  it('getSession should return null if no session exists', () => {
    localStorage.getItem.mockReturnValue(null);

    const result = getSession();

    expect(result).toBeNull();
  });

  it('getSession should return null on parse error', () => {
    localStorage.getItem.mockReturnValue('invalid-json');
    console.error = vi.fn(); // Mock console.error

    const result = getSession();

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it('setSession should store session in localStorage', () => {
    const mockSession = { accessToken: 'test-token', tokenType: 'bearer' };

    setSession(mockSession);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'session',
      JSON.stringify(mockSession)
    );
  });

  it('clearSession should remove session from localStorage', () => {
    clearSession();

    expect(localStorage.removeItem).toHaveBeenCalledWith('session');
  });
});
