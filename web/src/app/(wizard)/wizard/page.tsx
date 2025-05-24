"use client";

import { Suspense } from 'react';
import MainWizard from '@/components/wizard/MainWizard';
import { Toaster } from '@/components/ui/toaster';
// import { AuthProvider } from '@/components/auth/AuthProvider';

export default function WizardPage() {
  return (
    // <AuthProvider>
      <Suspense fallback={<div className="flex justify-center items-center">Loading wizard...</div>}>
        <div className="flex flex-col min-h-[100vh] items-center justify-center">
          <MainWizard />
          <Toaster />
        </div>
      </Suspense>
    // </AuthProvider>
  );
}
