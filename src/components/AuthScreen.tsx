import React, { useState } from 'react';
import { Shield, User as UserIcon, Mail, Lock, Sparkles, ArrowRight, X, KeyRound } from 'lucide-react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  registeredUsers: User[];
}

export default function AuthScreen({ onLogin, registeredUsers }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your registered email address first.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await response.json();
      setIsSubmitting(false);

      if (!response.ok) {
        setError(data.error || 'Failed to request password reset OTP.');
        return;
      }

      setSuccessMessage(data.message || 'OTP has been generated and sent to your email.');
      setOtpRequested(true);
    } catch (err) {
      setIsSubmitting(false);
      setError('Error connecting to the server. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isForgotPassword) {
      if (!otpRequested) {
        await handleRequestOTP(e);
        return;
      }

      if (!resetEmail || !otp || !newPassword) {
        setError('Please fill in all fields.');
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, otp, newPassword })
        });
        const data = await response.json();
        setIsSubmitting(false);

        if (!response.ok) {
          setError(data.error || 'Failed to reset password.');
          return;
        }

        setSuccessMessage('Password reset successfully! You can now log in.');
        setIsForgotPassword(false);
        setOtpRequested(false);
        setOtp('');
        setEmail(resetEmail);
        setPassword('');
      } catch (err) {
        setIsSubmitting(false);
        setError('Error connecting to the server.');
      }
      return;
    }

    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields.');
      return;
    }

    const emailLower = email.toLowerCase().trim();
    const referralCode = !isLogin ? (localStorage.getItem('atfunding_referred_by') || undefined) : undefined;

    setIsSubmitting(true);
    try {
      if (isLogin) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailLower, password })
        });
        const data = await response.json();
        setIsSubmitting(false);

        if (!response.ok) {
          setError(data.error || 'Login failed.');
          return;
        }
        onLogin(data.user);
      } else {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailLower, name, password, referredBy: referralCode })
        });
        const data = await response.json();
        setIsSubmitting(false);

        if (!response.ok) {
          setError(data.error || 'Registration failed.');
          return;
        }
        onLogin(data.user);
      }
    } catch (err) {
      setIsSubmitting(false);
      setError('Server connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#05070B] text-gray-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-40 right-10 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand logo/header */}
      <div className="mb-8 text-center z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="font-sans font-bold text-black text-xl">AT</span>
          </div>
          <span className="font-sans text-2xl font-bold tracking-wider text-white">
            AT<span className="text-amber-400">Funding</span>
          </span>
        </div>
        <p className="text-xs font-mono text-amber-500/70 uppercase tracking-widest">Institutional Proprietary Trading & Brokerage</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-gradient-to-b from-[#111622] to-[#0A0D14] p-8 rounded-2xl border border-gray-800 shadow-2xl relative z-10 backdrop-blur-md">
        <h2 className="text-2xl font-sans font-medium text-white mb-1">
          {isForgotPassword 
            ? 'Reset Security Password' 
            : isLogin 
              ? 'Access Broker Portal' 
              : 'Create Broker Profile'}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {isForgotPassword 
            ? 'Set a new password for your account' 
            : isLogin 
              ? 'Sign in to access your Exness-style simplified trading terminal' 
              : 'Sign up to start your trading session'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isForgotPassword ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Your Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="email"
                    required
                    disabled={otpRequested}
                    placeholder="trader@atfunding.com"
                    className="w-full bg-[#0D1017] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
              </div>

              {otpRequested && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Enter OTP Verification Code</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        className="w-full bg-[#0D1017] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors tracking-widest font-mono text-amber-400"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase tracking-wider text-gray-400">New Security Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#0D1017] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-medium py-3 rounded-lg text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : otpRequested ? (
                  <>
                    Confirm OTP & Reset Password
                    <KeyRound className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Send OTP Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {otpRequested && (
                <div className="text-center mt-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleRequestOTP}
                    className="text-xs text-amber-500 hover:underline cursor-pointer disabled:opacity-50 font-mono"
                  >
                    Didn't receive code? Resend OTP
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Mercer"
                      className="w-full bg-[#0D1017] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="email"
                    placeholder="trader@atfunding.com"
                    className="w-full bg-[#0D1017] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Security Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setSuccessMessage('');
                        setResetEmail(email);
                      }}
                      className="text-[10px] text-amber-500 hover:underline cursor-pointer font-medium"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-[#0D1017] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-medium py-3 rounded-lg text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                {isLogin ? 'Access Terminal' : 'Register Profile'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setOtpRequested(false);
                setOtp('');
                setError('');
                setSuccessMessage('');
              }}
              className="text-amber-400 hover:underline cursor-pointer font-medium"
            >
              Back to Log In
            </button>
          ) : (
            <>
              <span>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-amber-400 hover:underline cursor-pointer font-medium"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-600 mt-8 font-mono">
        ATFunding Proprietary Trading Platform © 2026. All operations are simulated evaluations.
      </p>
    </div>
  );
}
