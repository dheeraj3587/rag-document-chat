import { NextRequest, NextResponse } from "next/server";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export const POST = async (req: NextRequest) =>{
    try {
        const {amount} = await req.json();
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never",
            },
        });
        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { error: "Failed to create payment intent" },
            { status: 500 }
        );
    }
}