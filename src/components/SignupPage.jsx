import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import anime from 'animejs';
import heroImage from '../assets/kabaw_login.jpg';
import textLogo from '../assets/kabaw_text_logo.png';
import { registerUser, saveAuthSession, startOAuthLogin } from '../api/auth';
import { validatePasswordStrength } from '../api/passwordValidation';

const SignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formWrapperRef = useRef(null);
  const flashOverlayRef = useRef(null);
  const stepContainerRef = useRef(null);

  useEffect(() => {
    const tl = anime.timeline({
      easing: 'easeOutExpo',
    });

    if (flashOverlayRef.current) {
      tl.add({
        targets: flashOverlayRef.current,
        opacity: [1, 0],
        duration: 1200,
        easing: 'easeInOutQuad',
      });
    }

    if (formWrapperRef.current) {
      tl.add({
        targets: formWrapperRef.current.querySelectorAll('.anime-hidden'),
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100),
        duration: 800,
        complete: (anim) => {
          // Remove anime-hidden so conditional renders don't break later
          anim.animatables.forEach(a => a.target.classList.remove('anime-hidden'));
        }
      }, '-=800');
    }
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !accountName.trim() || !pin || !password || !confirmPassword) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const normalizedAccountName = accountName.trim().toLowerCase();
    const passwordValidation = validatePasswordStrength(password, {
      username: normalizedAccountName,
      email: `${normalizedAccountName}@kabaw.net`,
    });
    if (!passwordValidation.isValid) {
      setErrorMessage(passwordValidation.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const authData = await registerUser({
        fullName: fullName.trim(),
        accountName: normalizedAccountName,
        pin,
        password,
        confirmPassword,
      });
      saveAuthSession(authData);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    setErrorMessage('');
    if (!fullName.trim() || !accountName.trim()) {
      setErrorMessage('Full name and account name are required.');
      return;
    }

    if (!stepContainerRef.current) return;
    anime({
      targets: stepContainerRef.current,
      opacity: [1, 0],
      translateX: [0, -20],
      duration: 300,
      easing: 'easeInQuad',
      complete: () => {
        setStep(2);
        anime({
          targets: stepContainerRef.current,
          opacity: [0, 1],
          translateX: [20, 0],
          duration: 300,
          easing: 'easeOutQuad',
        });
      }
    });
  };

  const prevStep = () => {
    if (!stepContainerRef.current) return;
    anime({
      targets: stepContainerRef.current,
      opacity: [1, 0],
      translateX: [0, 20],
      duration: 300,
      easing: 'easeInQuad',
      complete: () => {
        setStep(1);
        anime({
          targets: stepContainerRef.current,
          opacity: [0, 1],
          translateX: [-20, 0],
          duration: 300,
          easing: 'easeOutQuad',
        });
      }
    });
  };

  return (
    <div className="login-split-container">
      {/* Left Side: Form */}
      <div className="login-left">
        <div className="login-form-wrapper" ref={formWrapperRef}>
          <div className="login-brand anime-hidden">
            <img src={textLogo} alt="KABAW.net" className="login-text-logo" />
          </div>
          
          <h2 className="login-title anime-hidden">Create an account</h2>
          <p className="login-subtitle anime-hidden">Sign up to track your progress</p>

          <form 
            onSubmit={step === 1 ? (e) => { e.preventDefault(); nextStep(); } : handleSignup} 
            className="split-login-form anime-hidden"
          >
            {errorMessage && <div className="auth-message auth-message-error">{errorMessage}</div>}
            <div ref={stepContainerRef}>
            {step === 1 && (
              <>
                <div className="form-group">
                  <label>Full Name (as it appears in tracker)</label>
                  <input 
                    type="text" 
                    placeholder="Juan Dela Cruz" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Preferred Account Name</label>
                  <div className="account-name-input-wrapper">
                    <input 
                      type="text" 
                      placeholder="josedelacruz" 
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      required 
                    />
                    <span className="account-domain">@kabaw.net</span>
                  </div>
                </div>

                <button type="submit" className="login-btn-primary">Next</button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="form-group">
                  <label>4-Digit Security PIN</label>
                  <input 
                    type="password"
                    maxLength="4"
                    pattern="\d{4}"
                    placeholder="e.g. 2024" 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                    <button 
                      type="button" 
                      className="eye-icon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                        {showPassword && <line x1="2" y1="2" x2="22" y2="22"></line>}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Re-type Password</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={prevStep} className="login-btn-secondary" style={{ flex: 1 }}>Back</button>
                  <button type="submit" className="login-btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                    {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </div>
              </>
            )}
            </div>
          </form>

          {step === 1 && (
            <div className="social-login-wrapper anime-hidden">
              <div className="login-divider">
                or continue with
              </div>
              <div className="social-login">
                <button
                  type="button"
                  className="social-btn"
                  onClick={() => startOAuthLogin('google')}
                >
                  <svg className="social-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="social-btn"
                  onClick={() => startOAuthLogin('github')}
                >
                  <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>
            </div>
          )}

          <div className="login-footer anime-hidden">
            <p>Already have an account? <Link to="/login">Sign in here.</Link></p>
          </div>
        </div>
      </div>

      {/* Right Side: Image */}
      <div className="login-right" style={{ backgroundImage: `url(${heroImage})`, position: 'relative' }}>
        <div ref={flashOverlayRef} className="black-flash-overlay"></div>
      </div>
    </div>
  );
};

export default SignupPage;
