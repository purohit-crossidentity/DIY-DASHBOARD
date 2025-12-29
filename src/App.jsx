/**
 * App Component
 *
 * Main entry point for Custom Dashboard application.
 * Handles authentication initialization and renders the dashboard page.
 */

import { useState, useEffect } from 'react';
import { initializeAuthFromURL } from './utils/auth';
import CustomDashboardPage from './components/CustomDashboardPage';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await initializeAuthFromURL();

        if (result.success) {
          setIsAuthenticated(true);
          console.log('Authenticated for tenant:', result.data.tenant, 'subtenant:', result.data.subtenant);
        } else {
          setAuthError({
            type: result.error,
            message: result.message
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError({
          type: 'unknown',
          message: 'An unexpected error occurred. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Initializing...</p>
      </div>
    );
  }

  if (authError) {
    const getErrorTitle = () => {
      switch (authError.type) {
        case 'server_unavailable':
          return 'Server Unavailable';
        case 'network_error':
          return 'Connection Error';
        case 'missing_params':
          return 'Authentication Required';
        case 'auth_failed':
          return 'Authentication Failed';
        default:
          return 'Error';
      }
    };

    const handleRetry = () => {
      setAuthError(null);
      setIsLoading(true);
      window.location.reload();
    };

    return (
      <div className="app-error">
        <h2 className={authError.type === 'server_unavailable' || authError.type === 'network_error' ? 'error-server' : ''}>
          {getErrorTitle()}
        </h2>
        <p>{authError.message}</p>
        {authError.type === 'missing_params' && (
          <p className="hint">
            Access URL format: <code>?tenant=CODE&subtenant=CODE</code>
          </p>
        )}
        {(authError.type === 'server_unavailable' || authError.type === 'network_error') && (
          <button className="retry-button" onClick={handleRetry}>
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      {/* Floating animated shapes background */}
      <div className="floating-shapes">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      {isAuthenticated && <CustomDashboardPage />}
    </div>
  );
}

export default App;
