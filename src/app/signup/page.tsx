'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button, Card } from '@/components/ui';
import Link from 'next/link';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Basic profile', '1 CV template', 'Limited AI chat'],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/month',
    features: ['Unlimited CVs', 'All templates', 'Unlimited AI chat', 'Interview training', 'Job matching'],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    features: ['Everything in Pro', 'Priority support', 'Custom branding', 'Team features'],
    highlighted: false,
  },
];

export default function SignupPage() {
  const [selectedPlan, setSelectedPlan] = useState('pro');

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary-600">
            JobTrainer
          </Link>
          <h1 className="text-3xl font-bold text-surface-900 mt-4">Choose Your Plan</h1>
          <p className="text-surface-600 mt-2">Start your job search journey today</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'ring-2 ring-primary-500 shadow-lg'
                  : 'hover:shadow-md'
              } ${plan.highlighted ? 'border-primary-500' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="p-6">
                {plan.highlighted && (
                  <span className="inline-block bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded mb-3">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-surface-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-surface-900">{plan.price}</span>
                  <span className="text-surface-500">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-surface-600">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-surface-200 p-8">
          <h2 className="text-xl font-bold text-surface-900 mb-6">Create Your Account</h2>
          
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
              Continue with Microsoft
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
              Continue with Google
            </Button>
          </div>

          <p className="text-center text-surface-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}