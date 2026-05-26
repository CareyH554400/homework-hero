import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Service-role client bypasses RLS so we can update any user's profile
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  switch (event.type) {
    // Payment succeeded → unlock premium
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (userId) {
        await supabaseAdmin
          .from("ht_profile")
          .update({ is_premium: true })
          .eq("id", userId);
      }
      break;
    }

    // Subscription renewed — keep premium active (no action needed)
    case "invoice.payment_succeeded": {
      break;
    }

    // Subscription cancelled or payment failed → revoke premium
    case "customer.subscription.deleted":
    case "invoice.payment_failed": {
      const obj = event.data.object as { customer: string | { id: string } };
      const customerId =
        typeof obj.customer === "string" ? obj.customer : obj.customer.id;
      await supabaseAdmin
        .from("ht_profile")
        .update({ is_premium: false })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
