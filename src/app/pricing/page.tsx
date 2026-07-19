import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      { name: 'Basic profile builder', included: true },
      { name: '1 CV template', included: true },
      { name: 'Limited AI chat (10/day)', included: true },
      { name: 'Job search', included: true },
      { name: 'Unlimited CVs', included: false },
      { name: 'Interview training', included: false },
      { name: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For serious job seekers',
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Unlimited CVs & cover letters', included: true },
      { name: 'All premium templates', included: true },
      { name: 'Unlimited AI chat', included: true },
      { name: 'Interview training', included: true },
      { name: 'Job matching', included: true },
      { name: 'Progress tracking', included: true },
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    description: 'For teams and organizations',
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Priority support', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Team collaboration', included: true },
      { name: 'API access', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom integrations', included: true },
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="border-b border-surface-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            JobTrainer
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-surface-600 hover:text-surface-900">
              Sign In
            </Link>
            <Button variant="primary" size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl font-bold text-surface-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-surface-600 max-w-2xl mx-auto">
          Choose the plan that fits your job search needs. Upgrade or downgrade anytime.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.highlighted ? 'ring-2 ring-primary-500 shadow-lg' : ''}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="primary">Most Popular</Badge>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-surface-900">{plan.name}</h3>
                <p className="text-surface-500 text-sm mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-surface-900">{plan.price}</span>
                  <span className="text-surface-500">{plan.period}</span>
                </div>
                <Button
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  className="w-full mt-6"
                >
                  <Link href={`/signup?plan=${plan.id}`}>{plan.cta}</Link>
                </Button>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      {feature.included ? (
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-surface-300 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={feature.included ? 'text-surface-700' : 'text-surface-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold text-center text-surface-900 mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <FAQItem
            question="Can I change plans later?"
            answer="Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
          />
          <FAQItem
            question="Is there a free trial?"
            answer="Yes! The Pro plan comes with a 14-day free trial. No credit card required."
          />
          <FAQItem
            question="What payment methods do you accept?"
            answer="We accept all major credit cards, PayPal, and bank transfers for Enterprise plans."
          />
          <FAQItem
            question="Can I cancel anytime?"
            answer="Absolutely. There are no long-term contracts. Cancel anytime from your account settings."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-surface-500">
          <p>&copy; 2026 JobTrainer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-surface-200">
      <h3 className="font-semibold text-surface-900">{question}</h3>
      <p className="text-surface-600 mt-2">{answer}</p>
    </div>
  );
}