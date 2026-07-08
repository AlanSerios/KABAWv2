import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import heroImage from '../assets/kabaw_login.jpg';
import textLogo from '../assets/kabaw_text_logo.png';
import { readOAuthCallback, saveAuthSession } from '../api/auth';

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    try {
      const authData = readOAuthCallback();
      saveAuthSession(authData);
      window.history.replaceState(null, '', '/oauth/callback');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(error.message || 'Unable to complete OAuth sign-in.');
    }
  }, [navigate]);

  return (
    <div className="login-split-container">
      <div className="login-left">
        <div className="login-form-wrapper">
          <div className="login-brand">
            <img src={textLogo} alt="KABAW.net" className="login-text-logo" />
          </div>
          <h2 className="login-title">Finishing sign in</h2>
          <p className="login-subtitle">
            {errorMessage ? 'We could not complete your social sign-in.' : 'Securing your session...'}
          </p>

          {errorMessage && (
            <>
              <div className="auth-message auth-message-error">{errorMessage}</div>
              <div className="login-footer">
                <p><Link to="/login">Return to sign in</Link></p>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="login-right" style={{ backgroundImage: `url(${heroImage})` }} />
    </div>
  );
};

export default OAuthCallbackPage;
