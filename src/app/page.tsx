import Link from 'next/link';
import { Button } from '@/components/ui';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Header */}
      <header className="border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">JobTrainer</h1>
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-5xl font-bold text-surface-900 mb-6">
          Your Personal Job Application Trainer
        </h2>
        <p className="text-xl text-surface-600 mb-8 max-w-3xl mx-auto">
          Stop spending hours on applications. Let AI help you craft perfect CVs, 
          prepare for interviews, and land your dream job faster.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="primary" size="lg">
            <Link href="/signup">Start Free Trial</Link>
          </Button>
          <Button variant="secondary" size="lg">
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h3 className="text-3xl font-bold text-center text-surface-900 mb-12">
          Everything You Need to Land the Job
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Smart Profile Builder"
            description="Build a comprehensive profile once. AI remembers your skills, experience, and achievements for every application."
            icon="👤"
          />
          <FeatureCard
            title="AI-Powered Documents"
            description="Generate tailored CVs and cover letters for each job. Match keywords and stand out from the crowd."
            icon="📄"
          />
          <FeatureCard
            title="Interview Training"
            description="Practice with AI-powered mock interviews. Get feedback on your answers and improve your confidence."
            icon="🎯"
          />
          <FeatureCard
            title="Job Matching"
            description="Find positions that match your skills and goals. Get personalized recommendations."
            icon="🔍"
          />
          <FeatureCard
            title="Progress Tracking"
            description="Track your applications, interviews, and progress. Stay organized throughout your job search."
            icon="📊"
          />
          <FeatureCard
            title="Checklist Guidance"
            description="Never miss a step with AI-generated checklists for each application and interview."
            icon="✅"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Land Your Dream Job?
          </h3>
          <p className="text-primary-100 mb-8">
            Join thousands of job seekers who are using AI to accelerate their career.
          </p>
          <Button variant="secondary" size="lg">
            <Link href="/signup">Get Started Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-surface-500">
          <p>&copy; 2026 JobTrainer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-surface-200 hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h4 className="text-xl font-semibold text-surface-900 mb-2">{title}</h4>
      <p className="text-surface-600">{description}</p>
    </div>
  );
}