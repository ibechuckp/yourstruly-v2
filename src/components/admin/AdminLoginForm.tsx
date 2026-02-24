'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface AdminLoginFormProps {
  redirect?: string;
}

export default function AdminLoginForm({ redirect }: AdminLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/admin/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to sign in');
        setIsLoading(false);
        return;
      }

      // Redirect to admin dashboard
      router.push(redirect || '/admin');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-[#C35F33]/10 border border-[#C35F33]/20 text-[#C35F33] text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#2a1f1a] mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-white/80 border border-[#C35F33]/10 rounded-xl text-[#2a1f1a] placeholder:text-[#2a1f1a]/40 focus:outline-none focus:ring-2 focus:ring-[#406A56]/20 focus:border-[#406A56]/30 transition-all"
          placeholder="admin@yourstruly.love"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[#2a1f1a] mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/80 border border-[#C35F33]/10 rounded-xl text-[#2a1f1a] placeholder:text-[#2a1f1a]/40 focus:outline-none focus:ring-2 focus:ring-[#406A56]/20 focus:border-[#406A56]/30 transition-all pr-12"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#2a1f1a]/40 hover:text-[#2a1f1a] transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#406A56] to-[#4A3552] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#406A56]/20 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In to Admin Portal'
        )}
      </button>
    </form>
  );
}
