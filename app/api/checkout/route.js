import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const { montant, userId, email } = await request.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Cotisation annuelle Groupement de l\'Ille',
              description: `Cotisation ${new Date().getFullYear()}`,
            },
            unit_amount: montant * 100, // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/cotisation/succes?session_id={CHECKOUT_SESSION_ID}&user_id=${userId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cotisation/annulation`,
      customer_email: email,
      metadata: {
        user_id: userId,
        annee: new Date().getFullYear().toString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
