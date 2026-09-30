import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Sparkles,
  Headphones,
  ShieldCheck,
  AtSign,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || 'Invalid administrator login credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setErrorMessage('To reset your administrator credentials, please contact the system administrator.');
  };

  return (
    <>
      {/* ==================================================================== */}
      {/* DESKTOP / WEB LAYOUT (100% UNCHANGED, ACTIVE FOR SCREENS > 768px)    */}
      {/* ==================================================================== */}
      <div className="login-desktop-layout login-split-page">
        {/* Left Column: Mindfulness Brand Visual */}
        <div className="login-visual-column">
          <div
            className="login-visual-bg"
            style={{ backgroundImage: "url('/login-bg.jpg')" }}
          />
          <div className="login-visual-overlay" />

          <div className="login-visual-content">
            <div className="login-visual-top">
              <div className="login-visual-brand-badge">
                <img
                  src="/logo.png"
                  alt="Dr. Cubie Inspiration"
                  className="login-visual-badge-logo"
                />
                <span>Dr. Cubie Inspiration</span>
              </div>
            </div>

            <div className="login-visual-quote-box">
              <div className="login-visual-quote-tag">Mindfulness & Daily Contemplation</div>
              <h2 className="login-visual-quote-title">
                “Create moments that inspire meaningful change.”
              </h2>
              <p className="login-visual-quote-desc">
                Curate daily sparks, guided audio soundscapes, and contemplative media for members seeking calm, clarity, and growth.
              </p>

              <div className="login-visual-features">
                <div className="login-visual-feature-pill">
                  <Sparkles size={14} color="#93c5fd" />
                  <span>Daily Sparks</span>
                </div>
                <div className="login-visual-feature-pill">
                  <Headphones size={14} color="#6ee7b7" />
                  <span>Audio Soundscapes</span>
                </div>
                <div className="login-visual-feature-pill">
                  <ShieldCheck size={14} color="#bfdbfe" />
                  <span>Secure Console</span>
                </div>
              </div>
            </div>

            <div className="login-visual-footer">
              <span>© {new Date().getFullYear()} Dr. Cubie Inspiration Console. All rights reserved.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Modern Authentication Panel */}
        <div className="login-form-column">
          <div className="login-form-wrapper">
            <div className="login-form-panel">
              {/* Form Header */}
              <div className="login-form-header">
                <div className="login-form-logo-box">
                  <img
                    src="/logo.png"
                    alt="Dr. Cubie Inspiration"
                  />
                </div>
                <h1 className="login-form-heading">Dr. Cubie Inspiration</h1>
                <p className="login-form-subheading">
                  Sign in with verified administrator credentials
                </p>
              </div>

              {/* Error Feedback */}
              {(errorMessage || authError) && (
                <div className="login-error-alert" role="alert">
                  <AlertCircle size={18} className="login-error-icon" />
                  <span style={{ fontSize: '0.84rem' }}>{errorMessage || authError}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="login-auth-form">
                <Input
                  label="Administrator Email"
                  name="email"
                  type="email"
                  placeholder="admin@drcubie.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="login-submit-btn"
                >
                  <span>Sign In to Dashboard</span>
                  {!loading && <ArrowRight size={16} />}
                </Button>
              </form>

              {/* Restricted Access Information */}
              <div className="login-security-notice">
                <div className="login-security-badge">
                  <ShieldCheck size={13} />
                  <span>Authorized Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE LAYOUT (STITCH REFERENCE DESIGN, ACTIVE FOR SCREENS <= 768px) */}
      {/* ==================================================================== */}
      <div className="login-mobile-layout">
        {/* Abstract Background Layer */}
        <div className="stitch-mobile-bg-layer" />

        <div className="stitch-mobile-scroll-container">
          {/* Top Brand & Quote Banner */}
          <div className="stitch-mobile-header">
            <div className="stitch-mobile-brand-pill">
              <Sparkles size={15} className="stitch-pill-icon" />
              <span>Dr. Cubie Inspiration</span>
            </div>

            <div className="stitch-mobile-tagline">
              MINDFULNESS & DAILY CONTEMPLATION
            </div>

            <h1 className="stitch-mobile-quote-heading">
              “Create moments that <em>inspire meaningful change.</em>”
            </h1>

            <p className="stitch-mobile-quote-desc">
              Curate daily sparks, guided audio soundscapes, and contemplative media for members seeking calm, clarity, and growth.
            </p>
          </div>

          {/* Floating White Authentication Card */}
          <div className="stitch-mobile-card">
            {/* Centered Squircle Logo */}
            <div className="stitch-card-logo-box">
              <img
                src="/logo.png"
                alt="Dr. Cubie Inspiration"
                className="stitch-card-logo-img"
              />
            </div>

            <h2 className="stitch-card-heading">Dr. Cubie Inspiration</h2>
            <p className="stitch-card-subheading">
              Sign in with verified administrator credentials
            </p>

            {/* Error Feedback */}
            {(errorMessage || authError) && (
              <div className="stitch-card-error-alert" role="alert">
                <AlertCircle size={16} className="stitch-card-error-icon" />
                <span>{errorMessage || authError}</span>
              </div>
            )}

            {/* Mobile Auth Form */}
            <form onSubmit={handleSubmit} className="stitch-mobile-form">
              {/* Email Field */}
              <div className="stitch-form-group">
                <label htmlFor="stitch-mobile-email" className="stitch-form-label">
                  Administrator Email <span className="stitch-required-star">*</span>
                </label>
                <div className="stitch-input-container">
                  <AtSign size={18} className="stitch-input-icon" />
                  <input
                    id="stitch-mobile-email"
                    name="stitch-email"
                    type="email"
                    placeholder="testuser@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="stitch-text-input"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="stitch-form-group">
                <div className="stitch-form-label-row">
                  <label htmlFor="stitch-mobile-password" className="stitch-form-label">
                    Password <span className="stitch-required-star">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="stitch-forgot-link"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="stitch-input-container">
                  <Lock size={18} className="stitch-input-icon" />
                  <input
                    id="stitch-mobile-password"
                    name="stitch-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="stitch-text-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="stitch-password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="stitch-submit-btn"
              >
                <span>{loading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
                {!loading && <ArrowRight size={18} className="stitch-submit-icon" />}
                {loading && <span className="btn-spinner" />}
              </button>
            </form>

            {/* Security Verification Notice */}
            <div className="stitch-security-row">
              <ShieldCheck size={16} className="stitch-security-icon" />
              <span>Authorized Access</span>
              <span className="stitch-security-dot">•</span>
              <span>256-Bit SSL</span>
            </div>
          </div>

          {/* Mobile Footer */}
          <footer className="stitch-page-footer">
            <span>© {new Date().getFullYear()} Dr. Cubie Inspiration Inc. All rights reserved.</span>
          </footer>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
