'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary-600">
            JobTrainer
          </Link>
          <h1 className="text-2xl font-bold text-surface-900 mt-4">Welcome Back</h1>
          <p className="text-surface-600 mt-2">Sign in to continue your job search journey</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-surface-200 p-8">
          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.24805 0.999985L13.748 0.999985L9.74805 10.5L7.24805 0.999985Z" fill="#F25022"/>
                <path d="M14.748 0.999985L21.248 0.999985L21.248 7.49999L14.748 7.49999L14.748 0.999985Z" fill="#7FBA00"/>
                <path d="M0.248047 7.99999L6.74805 7.99999L6.74805 14.5L0.248047 14.5L0.248047 7.99999Z" fill="#00A4EF"/>
                <path d="M7.24805 14.5L13.748 14.5L13.748 21L7.24805 21L7.24805 14.5Z" fill="#FFB900"/>
                <path d="M14.748 7.99999L21.248 7.99999L21.248 14.5L14.748 14.5L14.748 7.99999Z" fill="#F25022"/>
              </svg>
              Sign in with Microsoft
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-surface-500 text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-surface-400 text-sm mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}