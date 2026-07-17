import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', full_name: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.register({ email: form.email, full_name: form.full_name, password: form.password });
      const res = await authApi.login({ email: form.email, password: form.password });
      await login(res.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white">CareerForge</span>
            <span className="text-brand-400 font-bold"> AI</span>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
        <p className="text-white/50 mb-8">Start tracking your dream job applications</p>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-white/30" />
              <input type="text" name="full_name" value={form.full_name} onChange={handle}
                placeholder="Jane Smith" className="input-field pl-11" required />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-white/30" />
              <input type="email" name="email" value={form.email} onChange={handle}
                placeholder="you@example.com" className="input-field pl-11" required />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/30" />
              <input type="password" name="password" value={form.password} onChange={handle}
                placeholder="Min 8 characters" className="input-field pl-11" required />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/30" />
              <input type="password" name="confirm" value={form.confirm} onChange={handle}
                placeholder="Repeat password" className="input-field pl-11" required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading ? 'Creating account...' : (
              <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-white/40 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
