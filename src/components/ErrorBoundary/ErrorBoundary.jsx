import React from 'react';
import './ErrorBoundary.scss';

/**
 * ErrorBoundary - компонент для отлова ошибок React
 * 
 * Оборачивает дочерние компоненты и ловит ошибки рендеринга,
 * предотвращая падение всего приложения.
 * 
 * Использование:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние чтобы показать fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Логируем ошибку (можно отправить в Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Отправить ошибку в Sentry или другой сервис мониторинга
    // if (import.meta.env.VITE_SENTRY_DSN) {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <h1 className="error-boundary__title">Что-то пошло не так</h1>
            <p className="error-boundary__message">
              Произошла ошибка при отображении этой страницы.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary__details">
                <summary>Детали ошибки (только в development)</summary>
                <div className="error-boundary__error-info">
                  <strong>{this.state.error.toString()}</strong>
                  {this.state.errorInfo && (
                    <pre>{this.state.errorInfo.componentStack}</pre>
                  )}
                </div>
              </details>
            )}

            <div className="error-boundary__actions">
              <button 
                className="error-boundary__button"
                onClick={this.handleReset}
              >
                Попробовать снова
              </button>
              <button 
                className="error-boundary__button error-boundary__button--secondary"
                onClick={() => window.location.href = '/'}
              >
                Вернуться на главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
