/**
 * Tests for ErrorBoundary component
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';

// Компонент который бросает ошибку
const ThrowError = () => {
  throw new Error('Test error');
};

// Нормальный компонент
const NoError = () => <div>No error</div>;

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <NoError />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    // Подавляем console.error для чистоты вывода теста
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
    expect(
      screen.getByText(/Произошла ошибка при отображении этой страницы/)
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should show "Try again" button in error state', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Попробовать снова')).toBeInTheDocument();
    expect(screen.getByText('Вернуться на главную')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
