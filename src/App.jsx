/**
 * App Component
 *
 * Main entry point for Custom Dashboard application.
 * Handles authentication initialization and renders the dashboard page.
 */

import { useState, useEffect } from 'react';
import { initializeAuthFromURL } from './utils/auth';
import CustomDashboardPage from './components/CustomDashboardPage';
import ErrorPage from './components/ErrorPage';
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
    const handleRetry = () => {
      setAuthError(null);
      setIsLoading(true);
      window.location.reload();
    };

    return (
      <ErrorPage
        type={authError.type}
        message={authError.message}
        onRetry={handleRetry}
      />
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
