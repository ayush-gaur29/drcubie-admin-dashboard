import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Sparkles,
  Headphones,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  return (
    <div className="login-split-page">
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
              <div className="login-badge-pill">
                <ShieldCheck size={13} className="login-badge-icon" />
                <span>Administrator Access Portal</span>
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
  );
};

export default LoginPage;
