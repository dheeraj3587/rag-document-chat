import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const POST = async (req: NextRequest) => {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');
  let event;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    event = stripe.webhooks.constructEvent(payload, sig!, endpointSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        console.log("checkout session completed");
        const sessionId = event.data.object.id;
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items', 'customer']
        });

        // Get customer email from session
        const customerEmail = session.customer_details?.email || session.customer_email;

        if (customerEmail) {
          // Update user in Convex
          await convex.mutation(api.user.upgradeUser, {
            email: customerEmail,
            upgrade: true,
          });
          console.log(`User ${customerEmail} upgraded successfully`);
        }
        break;

      case 'customer.subscription.deleted':
        console.log("customer subscription deleted");
        const subscription = event.data.object;
        
        // Get customer to find email
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('email' in customer && customer.email) {
          // Downgrade user
          await convex.mutation(api.user.upgradeUser, {
            email: customer.email,
            upgrade: false,
          });
          console.log(`User ${customer.email} downgraded successfully`);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ status: "success" });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: `Failed to trigger webhook: ${error}` },
      { status: 400 }
    );
  }
};