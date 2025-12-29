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
        const authData = await initializeAuthFromURL();

        if (authData) {
          setIsAuthenticated(true);
          console.log('Authenticated for tenant:', authData.tenant, 'subtenant:', authData.subtenant);
        } else {
          setAuthError('Authentication failed. Please provide valid tenant and subtenant parameters.');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError('Authentication error occurred.');
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
    return (
      <div className="app-error">
        <h2>Authentication Required</h2>
        <p>{authError}</p>
        <p className="hint">
          Access URL format: <code>?tenant=CODE&subtenant=CODE</code>
        </p>
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
