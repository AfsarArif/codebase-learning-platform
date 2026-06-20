'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Check, Coins, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out the platform.',
    features: [
      '3 repository imports',
      'Full codebase analysis',
      'Learning path generation',
      'Chat tutor (limited)',
      'Flashcards & quizzes',
      'Interview mode (1 session)',
      'Community support',
    ],
    cta: 'Get Started',
    href: '/auth/signup',
    primary: false,
  },
  {
    name: 'Premium',
    price: '$10',
    period: 'per month',
    description: 'For developers who want unlimited learning.',
    features: [
      '30 credits per month',
      '1 credit = 1 repo import',
      '1 credit = 50 chat messages',
      '1 credit = 1 re-index',
      '2 credits = 1 interview session',
      'Bring your own API key',
      'Unused credits reset monthly',
      'Priority support',
    ],
    cta: 'Upgrade to Premium',
    href: '/api/stripe/checkout',
    primary: true,
  },
];

export default function PricingPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground">
          Start free. Upgrade when you need more.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-8 ${
              plan.primary
                ? 'border-primary shadow-lg ring-2 ring-primary/20'
                : 'bg-card'
            }`}
          >
            {plan.primary && (
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-4">
                RECOMMENDED
              </span>
            )}
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
            <div className="mb-2">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground">/{plan.period}</span>
            </div>
            <p className="text-muted-foreground mb-6">{plan.description}</p>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {plan.primary ? (
              session ? (
                <form
                  action="/api/stripe/checkout"
                  method="POST"
                >
                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="h-4 w-4" />
                    {plan.cta}
                  </button>
                </form>
              ) : (
                <Link
                  href="/auth/signin?callbackUrl=/pricing"
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Sign In to Upgrade
                </Link>
              )
            ) : (
              <Link
                href={plan.href}
                className="w-full py-3 rounded-lg border hover:bg-accent transition-colors flex items-center justify-center gap-2"
              >
                {plan.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border bg-card p-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Credit System Explained
        </h2>
        <p className="text-muted-foreground mb-6">
          Credits are how we meter usage. One credit roughly equals one repository analysis.
          If you bring your own API key (OpenAI, Anthropic, or DeepSeek), many actions cost
          zero credits — you only pay for the infrastructure.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { action: 'Repository import', cost: '1 credit' },
            { action: '50 chat messages', cost: '1 credit' },
            { action: 'Interview session', cost: '2 credits' },
            { action: 'Re-index repository', cost: '1 credit' },
            { action: 'Chat with own API key', cost: '0 credits' },
            { action: 'Interview with own API key', cost: '0 credits' },
          ].map((item) => (
            <div key={item.action} className="flex justify-between p-3 rounded-md bg-secondary/50">
              <span>{item.action}</span>
              <span className="font-medium">{item.cost}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
