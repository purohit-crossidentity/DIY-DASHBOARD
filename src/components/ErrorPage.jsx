/**
 * ErrorPage Component
 *
 * Displays styled error pages for different error scenarios:
 * - 404: Wrong URL / Page not found
 * - server_down: Server unavailable
 * - network_error: Connection issues
 * - missing_params: Missing tenant/subtenant parameters
 * - auth_failed: Authentication failed
 *
 * Matches the lavender/periwinkle theme with glass morphism effects.
 */

import '../styles/ErrorPage.css';

const ErrorPage = ({ type, message, onRetry }) => {
  const getErrorConfig = () => {
    switch (type) {
      case '404':
      case 'not_found':
        return {
          icon: (
            <svg className="error-icon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="3" strokeDasharray="8 4" />
              <path d="M40 45 L55 60 L40 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M80 45 L65 60 L80 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="60" cy="60" r="8" fill="currentColor" />
              <path d="M35 90 Q60 75 85 90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          ),
          title: 'Page Not Found',
          subtitle: '404 Error',
          defaultMessage: "Oops! The page you're looking for doesn't exist or has been moved.",
          showRetry: true,
          retryText: 'Go Back',
          retryAction: () => window.history.back(),
          showHome: true
        };

      case 'server_down':
      case 'server_unavailable':
        return {
          icon: (
            <svg className="error-icon server-icon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="25" y="20" width="70" height="25" rx="4" stroke="currentColor" strokeWidth="3" />
              <circle cx="38" cy="32.5" r="4" fill="currentColor" />
              <circle cx="50" cy="32.5" r="4" fill="currentColor" />
              <line x1="60" y1="32.5" x2="85" y2="32.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <rect x="25" y="50" width="70" height="25" rx="4" stroke="currentColor" strokeWidth="3" />
              <circle cx="38" cy="62.5" r="4" fill="currentColor" />
              <circle cx="50" cy="62.5" r="4" fill="currentColor" />
              <line x1="60" y1="62.5" x2="85" y2="62.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <rect x="25" y="80" width="70" height="25" rx="4" stroke="currentColor" strokeWidth="3" opacity="0.4" />
              <line x1="30" y1="115" x2="90" y2="75" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
              <line x1="30" y1="75" x2="90" y2="115" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            </svg>
          ),
          title: 'Server Unavailable',
          subtitle: 'Connection Failed',
          defaultMessage: 'Unable to connect to the server. Please check if the server is running and try again.',
          showRetry: true,
          retryText: 'Retry Connection',
          retryAction: onRetry || (() => window.location.reload()),
          showHome: false
        };

      case 'network_error':
        return {
          icon: (
            <svg className="error-icon network-icon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="85" r="8" fill="currentColor" />
              <path d="M35 70 Q60 50 85 70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M20 55 Q60 25 100 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M5 40 Q60 0 115 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5" />
              <line x1="95" y1="25" x2="115" y2="45" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
              <line x1="115" y1="25" x2="95" y2="45" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            </svg>
          ),
          title: 'Connection Error',
          subtitle: 'Network Issue',
          defaultMessage: 'Unable to establish a network connection. Please check your internet connection and try again.',
          showRetry: true,
          retryText: 'Retry Connection',
          retryAction: onRetry || (() => window.location.reload()),
          showHome: false
        };

      case 'missing_params':
        return {
          icon: (
            <svg className="error-icon auth-icon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="30" y="50" width="60" height="45" rx="6" stroke="currentColor" strokeWidth="3" />
              <circle cx="60" cy="35" r="20" stroke="currentColor" strokeWidth="3" />
              <circle cx="60" cy="72" r="6" fill="currentColor" />
              <line x1="60" y1="78" x2="60" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M45 25 L60 10 L75 25" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          title: 'Authentication Required',
          subtitle: 'Missing Parameters',
          defaultMessage: 'Tenant and subtenant parameters are required to access this application.',
          showRetry: false,
          hint: 'Access URL format: ?tenant=CODE&subtenant=CODE',
          showHome: false
        };

      case 'auth_failed':
        return {
          icon: (
            <svg className="error-icon auth-failed-icon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="30" y="50" width="60" height="45" rx="6" stroke="currentColor" strokeWidth="3" />
              <circle cx="60" cy="35" r="20" stroke="currentColor" strokeWidth="3" />
              <circle cx="60" cy="72" r="6" fill="currentColor" />
              <line x1="60" y1="78" x2="60" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <circle cx="90" cy="30" r="15" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
              <line x1="85" y1="25" x2="95" y2="35" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <line x1="95" y1="25" x2="85" y2="35" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ),
          title: 'Authentication Failed',
          subtitle: 'Invalid Credentials',
          defaultMessage: 'The provided tenant or subtenant credentials are invalid. Please verify and try again.',
          showRetry: true,
          retryText: 'Try Again',
          retryAction: onRetry || (() => window.location.reload()),
          showHome: false
        };

      default:
        return {
          icon: (
            <svg className="error-icon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="3" />
              <line x1="60" y1="35" x2="60" y2="70" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              <circle cx="60" cy="85" r="4" fill="currentColor" />
            </svg>
          ),
          title: 'Something Went Wrong',
          subtitle: 'Error',
          defaultMessage: 'An unexpected error occurred. Please try again.',
          showRetry: true,
          retryText: 'Try Again',
          retryAction: onRetry || (() => window.location.reload()),
          showHome: true
        };
    }
  };

  const config = getErrorConfig();

  const handleGoHome = () => {
    const currentUrl = new URL(window.location.href);
    const tenant = currentUrl.searchParams.get('tenant');
    const subtenant = currentUrl.searchParams.get('subtenant');

    if (tenant && subtenant) {
      window.location.href = `/?tenant=${tenant}&subtenant=${subtenant}`;
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="error-page">
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

      <div className="error-card">
        <div className={`error-icon-container ${type === 'server_down' || type === 'server_unavailable' ? 'server-error' : ''} ${type === 'network_error' ? 'network-error' : ''}`}>
          {config.icon}
        </div>

        <span className="error-subtitle">{config.subtitle}</span>
        <h1 className="error-title">{config.title}</h1>
        <p className="error-message">{message || config.defaultMessage}</p>

        {config.hint && (
          <div className="error-hint">
            <code>{config.hint}</code>
          </div>
        )}

        <div className="error-actions">
          {config.showRetry && (
            <button className="btn-retry" onClick={config.retryAction}>
              {config.retryText}
            </button>
          )}
          {config.showHome && (
            <button className="btn-home" onClick={handleGoHome}>
              Go to Dashboard
            </button>
          )}
        </div>

        <div className="error-decoration">
          <div className="decoration-line"></div>
          <div className="decoration-dot"></div>
          <div className="decoration-line"></div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
