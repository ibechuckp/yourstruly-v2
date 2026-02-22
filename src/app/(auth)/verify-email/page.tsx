'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

interface PageProps {
  searchParams: { email?: string };
}

export default function VerifyEmailPage({ searchParams }: PageProps) {
  const email = searchParams.email || '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const supabase = createClient();

  const handleResend = async () => {
    if (!email) return;
    
    setResending(true);
    await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    setResending(false);
    setResent(true);
    setTimeout(() => setResent(false), 5000);
  };

  return (
    <div className="min-h-screen home-background flex items-center justify-center p-4">
      <div className="home-blob home-blob-1" />
      <div className="home-blob home-blob-2" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2d2d2d] mb-1 tracking-wider">YOURS</h1>
          <p className="text-2xl text-[#406A56] font-script italic -mt-1" style={{ fontFamily: 'Georgia, serif' }}>Truly</p>
        </div>

        <div className="glass-card glass-card-strong p-8 text-center">
          <div className="w-20 h-20 bg-[#D9C61A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-[#D9C61A]" />
          </div>

          <h2 className="text-2xl font-semibold text-[#2d2d2d] mb-3">Verify your email</h2>
          
          <p className="text-gray-600 mb-2">
            We&apos;ve sent a verification link to
          </p>
          <p className="font-semibold text-[#406A56] mb-6">
            {email || 'your email address'}
          </p>

          <p className="text-sm text-gray-500 mb-8">
            Click the link in the email to complete your registration. 
            If you don&apos;t see it, check your spam folder.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending || resent || !email}
              className="w-full py-3 bg-[#406A56]/10 text-[#406A56] font-semibold rounded-xl hover:bg-[#406A56]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resending...
                </>
              ) : resent ? (
                'Email resent!'
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend verification email
                </>
              )}
            </button>

            <a
              href="/login"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-[#406A56] font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
