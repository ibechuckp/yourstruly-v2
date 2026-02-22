'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Camera, User, Calendar, ArrowRight, ArrowLeft, Check, Loader2, Upload, X } from 'lucide-react';

interface OnboardingData {
  fullName: string;
  dateOfBirth: string;
  photo: File | null;
  photoPreview: string | null;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    dateOfBirth: '',
    photo: null,
    photoPreview: null,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      // Pre-fill name from auth metadata
      setData(prev => ({
        ...prev,
        fullName: user.user_metadata?.full_name || '',
      }));
    };
    getUser();
  }, [router, supabase]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo must be less than 5MB');
        return;
      }
      setData(prev => ({
        ...prev,
        photo: file,
        photoPreview: URL.createObjectURL(file),
      }));
    }
  };

  const removePhoto = () => {
    setData(prev => ({
      ...prev,
      photo: null,
      photoPreview: null,
    }));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      let avatarUrl = null;

      // Upload photo if selected
      if (data.photo) {
        const fileExt = data.photo.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, data.photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          date_of_birth: data.dateOfBirth || null,
          avatar_url: avatarUrl,
          onboarding_completed: true,
          onboarding_step: 3,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return data.fullName.trim().length > 0;
    if (step === 2) return true; // Photo is optional
    if (step === 3) return true; // DOB is optional
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-[#2d2d2d]">What&apos;s your name?</h2>
              <p className="text-gray-500 mt-2">This is how you&apos;ll appear to family members</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2d2d2d] mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={data.fullName}
                onChange={(e) => setData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-[#2d2d2d] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 focus:border-[#406A56]/40 transition-all text-center text-lg"
                placeholder="Enter your name"
                autoFocus
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-[#2d2d2d]">Add a photo</h2>
              <p className="text-gray-500 mt-2">Help family recognize you (optional)</p>
            </div>

            <div className="flex justify-center">
              {data.photoPreview ? (
                <div className="relative">
                  <img
                    src={data.photoPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#406A56]/20"
                  />
                  <button
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 rounded-full border-4 border-dashed border-[#406A56]/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#406A56]/50 hover:bg-[#406A56]/5 transition-all">
                  <Upload className="w-8 h-8 text-[#406A56]/50" />
                  <span className="text-xs text-[#406A56]/50 mt-1">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-[#2d2d2d]">When were you born?</h2>
              <p className="text-gray-500 mt-2">This helps us personalize your experience (optional)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2d2d2d] mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={data.dateOfBirth}
                onChange={(e) => setData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-[#2d2d2d] focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 focus:border-[#406A56]/40 transition-all text-center"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen home-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#406A56]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen home-background flex items-center justify-center p-4">
      <div className="home-blob home-blob-1" />
      <div className="home-blob home-blob-2" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#406A56]">Step {step} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#406A56] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="glass-card glass-card-strong p-8">
          {renderStep()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(prev => prev - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-[#406A56] disabled:opacity-0 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#406A56] text-white rounded-xl font-medium hover:bg-[#355a48] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#406A56] text-white rounded-xl font-medium hover:bg-[#355a48] disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Skip option */}
        {step < 3 && (
          <button
            onClick={() => setStep(3)}
            className="block mx-auto mt-6 text-sm text-gray-400 hover:text-gray-600"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
