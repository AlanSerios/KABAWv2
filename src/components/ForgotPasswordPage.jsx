import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import anime from 'animejs';
import heroImage from '../assets/kabaw_login.jpg';
import textLogo from '../assets/kabaw_text_logo.png';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const formWrapperRef = useRef(null);
  const flashOverlayRef = useRef(null);

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
      }, '-=800');
    }
  }, []);

  const handleReset = (e) => {
    e.preventDefault();
    console.log(`Sending reset link to: ${email}`);
    setIsSent(true);
  };

  return (
    <div className="login-split-container">
      {/* Left Side: Form */}
      <div className="login-left">
        <div className="login-form-wrapper" ref={formWrapperRef}>
          <div className="login-brand anime-hidden">
            <img src={textLogo} alt="KABAW.net" className="login-text-logo" />
          </div>
          
          <h2 className="login-title anime-hidden">Reset Password</h2>
          <p className="login-subtitle anime-hidden">Enter your email to receive a reset link</p>

          {!isSent ? (
            <form onSubmit={handleReset} className="split-login-form">
              <div className="form-group anime-hidden">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@kabaw.net" 
                  pattern=".*@kabaw\.net"
                  title="Please enter a @kabaw.net email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <button type="submit" className="login-btn-primary anime-hidden">Send Reset Link</button>
            </form>
          ) : (
            <div className="split-login-form anime-hidden">
              <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-main)', marginBottom: '10px' }}>
                  A password reset link has been sent to <strong>{email}</strong>!
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Please check your inbox and follow the instructions to reset your password.
                </p>
              </div>
            </div>
          )}

          <div className="login-footer anime-hidden">
            <p>Remember your password? <Link to="/login">Sign in here.</Link></p>
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

export default ForgotPasswordPage;
