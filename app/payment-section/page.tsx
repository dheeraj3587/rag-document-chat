'use client'

import { Elements } from '@stripe/react-stripe-js'
import CheckoutPage from '@/app/(dashboard)/components/checkout-page'
import convertToSubcurrency from '@/lib/convertToSubcurrency'
import { loadStripe } from '@stripe/stripe-js'
if (process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY === undefined) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not defined");
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const PaymentSection = () => {
  const amount = 20;
  return (
        <Elements
        stripe={stripePromise}
        options={{
          mode: "payment",
          amount: convertToSubcurrency(amount),
          currency: "usd",
        }}
      >
        <CheckoutPage amount={amount} />
      </Elements>
  )
}

export default PaymentSection