import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Stripe checkout — requires STRIPE_SECRET_KEY and STRIPE_PREMIUM_PRICE_ID
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;

    if (!stripeKey || !priceId) {
      return NextResponse.json(
        { success: false, error: 'Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PREMIUM_PRICE_ID in .env.' },
        { status: 500 },
      );
    }

    // Dynamic import to avoid bundling stripe in client
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/pricing`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create checkout session' }, { status: 500 });
  }
}
