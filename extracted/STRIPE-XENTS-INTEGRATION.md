# $XENTS × STRIPE INTEGRATION — PRODUCTION SPEC

> **Goal:** Replace the UI-only Stripe tab in the Change Machine with a real Stripe Checkout flow that credits $XENTS atomically and irreversibly. This document is the implementation runbook — paste sections into Claude Code / Cursor / your IDE and execute step by step.

---

## ⟁ ARCHITECTURE OVERVIEW

```
┌────────────────────┐      ┌─────────────────────┐      ┌────────────────┐
│ xents-change-      │      │ Supabase Edge       │      │ Stripe         │
│ machine.html       │─────▶│ Function:           │─────▶│ Checkout       │
│ (browser)          │ POST │ /create-checkout    │      │ Session API    │
└────────────────────┘      └─────────────────────┘      └────────┬───────┘
         ▲                                                        │
         │ user redirected to Stripe-hosted Checkout              │
         │◄───────────────────────────────────────────────────────┘
         │
         │ on success, redirect to success_url=/xents-success
         ▼
┌────────────────────┐      ┌─────────────────────┐      ┌────────────────┐
│ xents-success.html │      │ Supabase Edge       │      │ Stripe         │
│ confirms credit    │◄─────│ Function:           │◄─────│ Webhook        │
│                    │ poll │ /stripe-webhook     │ POST │ Event          │
└────────────────────┘      └─────────────────────┘      └────────────────┘
                              writes to:
                              - xents_purchases table
                              - users table (balance)
                              - wc_xents_ledger via realtime
```

**Key principle:** the **webhook is the source of truth**, not the success URL. Never credit $XENTS based on the client returning to the success page — that's spoofable. The webhook arrives from Stripe's servers and is signed.

---

## ⟁ PHASE 1 — STRIPE ACCOUNT SETUP

### What you need

1. **Stripe account** at https://dashboard.stripe.com — free to create.
2. **Business categorization:** "Digital goods & services" → "Digital content / credits"
   - **Do NOT** categorize as "Cryptocurrency" or "Digital assets" — Stripe will reject crypto-adjacent merchants. $XENTS is utility credit, not a token in their meaning. Be precise.
3. **Submit business info** — Stripe requires real legal entity. If WIRED CHAOS isn't yet an LLC, this is the moment to file one. Use Stripe Atlas if you want it done in 48 hours ($500).
4. **Activate Stripe Tax** for automatic sales-tax handling (US states + EU VAT). Set up once, runs forever.

### Keys you'll need

From Stripe Dashboard → Developers → API Keys:
- **Publishable key** (`pk_live_...` or `pk_test_...`) — safe to expose in frontend
- **Secret key** (`sk_live_...` or `sk_test_...`) — server-only, NEVER ship to browser
- **Webhook signing secret** (`whsec_...`) — created when you register the webhook endpoint

Store in Supabase secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

Frontend keeps only the publishable key in a public env file.

---

## ⟁ PHASE 2 — SUPABASE SCHEMA

```sql
-- Track every $XENTS purchase
create table xents_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  stripe_session_id text unique not null,
  stripe_payment_intent text,
  rail text check (rail in ('stripe','apple_pay','usdc','x402')),
  usd_amount numeric(10,2) not null,
  xents_amount integer not null,
  status text check (status in ('pending','complete','failed','refunded')) default 'pending',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_xents_purchases_user on xents_purchases(user_id);
create index idx_xents_purchases_status on xents_purchases(status);

-- User balances (server-side source of truth, browser localStorage is a cache)
create table user_balances (
  user_id uuid primary key references auth.users(id),
  xents_balance integer not null default 0 check (xents_balance >= 0),
  lifetime_purchased integer not null default 0,
  lifetime_spent integer not null default 0,
  updated_at timestamptz default now()
);

-- Server-side ledger (mirrors wc_xents_ledger but authoritative)
create table xents_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  type text check (type in ('deposit','spend','bonus','refund')),
  label text,
  category text,
  rail text,
  usd_amount numeric(10,2),
  xents_delta integer not null,
  balance_after integer,
  reference_id text,
  ts timestamptz default now()
);

create index idx_xents_ledger_user on xents_ledger(user_id, ts desc);

-- RLS
alter table xents_purchases enable row level security;
alter table user_balances enable row level security;
alter table xents_ledger enable row level security;

create policy "own purchases" on xents_purchases
  for select using (auth.uid() = user_id);

create policy "own balance" on user_balances
  for select using (auth.uid() = user_id);

create policy "own ledger" on xents_ledger
  for select using (auth.uid() = user_id);

-- Atomic credit function — webhook calls this
create or replace function credit_xents(
  p_user_id uuid,
  p_xents integer,
  p_usd numeric,
  p_rail text,
  p_label text,
  p_reference text
) returns integer as $$
declare
  new_balance integer;
begin
  -- Upsert balance
  insert into user_balances (user_id, xents_balance, lifetime_purchased, updated_at)
  values (p_user_id, p_xents, p_xents, now())
  on conflict (user_id) do update
    set xents_balance = user_balances.xents_balance + p_xents,
        lifetime_purchased = user_balances.lifetime_purchased + p_xents,
        updated_at = now()
  returning xents_balance into new_balance;

  -- Append ledger
  insert into xents_ledger (user_id, type, label, rail, usd_amount, xents_delta, balance_after, reference_id)
  values (p_user_id, 'deposit', p_label, p_rail, p_usd, p_xents, new_balance, p_reference);

  return new_balance;
end;
$$ language plpgsql security definer;

-- Atomic debit function — called when user spends $XENTS
create or replace function debit_xents(
  p_user_id uuid,
  p_xents integer,
  p_label text,
  p_category text
) returns integer as $$
declare
  current_balance integer;
  new_balance integer;
begin
  select xents_balance into current_balance
  from user_balances where user_id = p_user_id for update;

  if current_balance is null then
    raise exception 'No balance record';
  end if;

  if current_balance < p_xents then
    raise exception 'Insufficient balance: have % need %', current_balance, p_xents;
  end if;

  update user_balances
  set xents_balance = xents_balance - p_xents,
      lifetime_spent = lifetime_spent + p_xents,
      updated_at = now()
  where user_id = p_user_id
  returning xents_balance into new_balance;

  insert into xents_ledger (user_id, type, label, category, xents_delta, balance_after)
  values (p_user_id, 'spend', p_label, p_category, -p_xents, new_balance);

  return new_balance;
end;
$$ language plpgsql security definer;
```

Save as `supabase/migrations/002_xents_stripe.sql` and run `supabase db push`.

---

## ⟁ PHASE 3 — EDGE FUNCTION: CREATE CHECKOUT

`supabase/functions/create-xents-checkout/index.ts`

```typescript
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// $XENTS rate is fixed at 100 per $1
const XENTS_PER_USD = 100;
const MIN_USD = 5;
const MAX_USD = 500;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { usd_amount, rail = "stripe" } = await req.json();

    // Validate amount
    const amount = Math.floor(Number(usd_amount));
    if (!amount || amount < MIN_USD || amount > MAX_USD) {
      return new Response(
        JSON.stringify({ error: `Amount must be $${MIN_USD}-$${MAX_USD}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const xentsAmount = amount * XENTS_PER_USD;
    const origin = req.headers.get("origin") ?? "https://wiredchaos.xyz";

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      // Note: apple_pay & google_pay are auto-detected by Stripe Checkout based on device
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `${xentsAmount.toLocaleString()} $XENTS Utility Credit`,
            description: "One-way utility credit for the WIRED CHAOS ecosystem. Non-refundable, non-tradeable.",
            images: ["https://wiredchaos.xyz/xents-icon.png"],
          },
          unit_amount: amount * 100, // Stripe wants cents
        },
        quantity: 1,
      }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        xents_amount: String(xentsAmount),
        rail,
      },
      success_url: `${origin}/xents-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/xents-change-machine.html?cancelled=1`,
      // Lock the price quote — Stripe Checkout sessions expire in 24h by default
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 min
    });

    // Insert pending purchase record
    await supabase.from("xents_purchases").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      rail,
      usd_amount: amount,
      xents_amount: xentsAmount,
      status: "pending",
    });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

Deploy:

```bash
supabase functions deploy create-xents-checkout
```

---

## ⟁ PHASE 4 — EDGE FUNCTION: STRIPE WEBHOOK

`supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("No signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature, webhookSecret, undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return new Response(`Webhook Error`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Idempotency: check if already processed
      const { data: existing } = await supabase
        .from("xents_purchases")
        .select("status")
        .eq("stripe_session_id", session.id)
        .single();

      if (existing?.status === "complete") {
        return new Response(JSON.stringify({ received: true, idempotent: true }), { status: 200 });
      }

      const userId = session.metadata?.user_id;
      const xentsAmount = parseInt(session.metadata?.xents_amount || "0", 10);
      const usdAmount = (session.amount_total || 0) / 100;
      const rail = session.metadata?.rail || "stripe";

      if (!userId || !xentsAmount) {
        console.error("Missing metadata on session", session.id);
        return new Response("Bad metadata", { status: 400 });
      }

      // Credit $XENTS atomically via RPC
      const { data: newBalance, error: creditError } = await supabase.rpc("credit_xents", {
        p_user_id: userId,
        p_xents: xentsAmount,
        p_usd: usdAmount,
        p_rail: rail,
        p_label: `DEPOSIT VIA ${rail.toUpperCase()}`,
        p_reference: session.id,
      });

      if (creditError) {
        console.error("Credit failed:", creditError);
        return new Response("Credit failed", { status: 500 });
      }

      // Mark purchase complete
      await supabase
        .from("xents_purchases")
        .update({
          status: "complete",
          stripe_payment_intent: session.payment_intent as string,
          completed_at: new Date().toISOString(),
        })
        .eq("stripe_session_id", session.id);

      console.log(`Credited ${xentsAmount} XENTS to ${userId}, new balance: ${newBalance}`);
      break;
    }

    case "charge.refunded":
    case "charge.dispute.created": {
      const charge = event.data.object as Stripe.Charge;
      // TODO: debit $XENTS, mark purchase as refunded
      // Be careful: if the user already spent the $XENTS, you need a clawback policy.
      // Recommended: pause user, manual review.
      console.warn("Refund/dispute received:", charge.id);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await supabase
        .from("xents_purchases")
        .update({ status: "failed" })
        .eq("stripe_session_id", session.id);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

Deploy and register webhook:

```bash
supabase functions deploy stripe-webhook --no-verify-jwt

# Register the URL with Stripe (do once, copy the signing secret)
# Stripe Dashboard → Developers → Webhooks → Add endpoint
# URL: https://[project].supabase.co/functions/v1/stripe-webhook
# Events: checkout.session.completed, checkout.session.expired,
#         charge.refunded, charge.dispute.created
```

**IMPORTANT:** `--no-verify-jwt` is required because Stripe doesn't send a Supabase JWT — we verify with Stripe's signature instead.

---

## ⟁ PHASE 5 — WIRE THE FRONTEND

Update `xents-widget.js` (and the standalone `xents-change-machine.html`) deposit handler:

```javascript
// REPLACE the existing simulated deposit handler with this:
async function deposit() {
  if (!modalState.rail || modalState.amount <= 0) return;
  const info = RAIL_INFO[modalState.rail];
  const btn = overlay.querySelector('#xw-deposit');
  btn.disabled = true;
  btn.textContent = '◉ REDIRECTING TO STRIPE...';

  try {
    // Get auth token from Supabase
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      toast('PLEASE LOG IN FIRST', 'err');
      // Redirect to login or open auth modal
      window.location.href = '/login.html?return=' + encodeURIComponent(location.pathname);
      return;
    }

    // Call edge function
    const response = await fetch(
      `${window.SUPABASE_URL}/functions/v1/create-xents-checkout`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usd_amount: modalState.amount,
          rail: modalState.rail,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Checkout creation failed');
    }

    const { url } = await response.json();

    // Redirect to Stripe-hosted Checkout
    window.location.href = url;
  } catch (err) {
    console.error('Deposit error:', err);
    toast(err.message.toUpperCase(), 'err');
    btn.disabled = false;
    updateBtn();
  }
}
```

For the USDC and x402 rails, you keep the existing in-browser flow (Web3 wallet sign + transaction). Only Stripe / Apple Pay route through the edge function.

---

## ⟁ PHASE 6 — SUCCESS PAGE

Create `xents-success.html` — user lands here after Stripe redirect.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>$XENTS CREDITED // WIRED CHAOS</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
  <style>
    body{background:#000;color:#00ffe6;font-family:'Share Tech Mono';text-align:center;padding:80px 30px;min-height:100vh;margin:0}
    h1{font-family:'Orbitron';color:#00ff88;font-size:42px;letter-spacing:.08em;text-shadow:0 0 30px rgba(0,255,136,.5);margin-bottom:20px}
    .amount{font-family:'Orbitron';color:#c2a633;font-size:64px;font-weight:900;text-shadow:0 0 30px rgba(194,166,51,.5);margin:24px 0}
    .status{font-size:13px;letter-spacing:.2em;margin-bottom:30px;opacity:.7}
    .btn{display:inline-block;padding:14px 28px;border:2px solid #00ffe6;color:#00ffe6;text-decoration:none;font-family:'Orbitron';letter-spacing:.25em;font-size:12px;margin:8px}
    .btn:hover{background:#00ffe6;color:#000}
  </style>
</head>
<body>
  <h1>◉ PAYMENT CONFIRMED</h1>
  <div class="status" id="status">// VERIFYING WITH WEBHOOK //</div>
  <div class="amount" id="amount">⟁ —</div>
  <a class="btn" href="33-3fm-mint.html">► MINT A TRACK</a>
  <a class="btn" href="33-3fm-broadcast.html">► RETURN TO BROADCAST</a>

  <script>
    const sessionId = new URLSearchParams(location.search).get('session_id');

    async function poll() {
      if (!sessionId) return;
      try {
        const { data: { session } } = await window.supabase.auth.getSession();
        const res = await fetch(`${window.SUPABASE_URL}/rest/v1/xents_purchases?stripe_session_id=eq.${sessionId}&select=*`, {
          headers: {
            'apikey': window.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          }
        });
        const [purchase] = await res.json();
        if (purchase?.status === 'complete') {
          document.getElementById('status').textContent = '// CREDITED · WELCOME BACK //';
          document.getElementById('amount').textContent = `⟁ ${purchase.xents_amount.toLocaleString()}`;
          // Sync localStorage balance
          await syncBalance();
          return;
        }
      } catch (e) { console.error(e); }
      setTimeout(poll, 2000);
    }

    async function syncBalance() {
      const { data: { session } } = await window.supabase.auth.getSession();
      const res = await fetch(`${window.SUPABASE_URL}/rest/v1/user_balances?select=xents_balance`, {
        headers: {
          'apikey': window.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        }
      });
      const [row] = await res.json();
      if (row) {
        localStorage.setItem('wc_xents_balance', String(row.xents_balance));
        // Trigger storage event so other tabs update
      }
    }

    poll();
  </script>
</body>
</html>
```

---

## ⟁ PHASE 7 — SECURITY CHECKLIST

Before going live:

- [ ] **Webhook signature verification active** — never trust a `checkout.session.completed` event without verifying the signature. Stripe replay attacks are real.
- [ ] **Idempotency on webhook handler** — if Stripe retries, don't double-credit. Check `xents_purchases.status` first.
- [ ] **Service role key never in browser** — only in Supabase secrets / edge function env. Frontend uses anon key + user JWT only.
- [ ] **RLS enabled on every table** — verify with `select * from auth.users` from frontend (should only see own row).
- [ ] **Min/max amount enforced server-side** — don't trust client `usd_amount`. The Supabase RPC has its own bounds.
- [ ] **Currency mismatch defense** — always create sessions in USD; reject if Stripe returns a different currency.
- [ ] **CSP headers** on the success page to prevent XSS from harvesting localStorage.
- [ ] **Rate limit** the create-checkout endpoint — Supabase has per-IP limits, but you may want per-user too (max 10 pending sessions per hour).
- [ ] **Dispute response policy documented** — when Stripe sends a `charge.dispute.created`, what happens? Recommended: freeze user account, manual review, document outcome.
- [ ] **Tax handling** — Stripe Tax must be enabled and configured for the states/countries you sell to. The US has 50 different state rules. Don't try to handle this yourself.

---

## ⟁ PHASE 8 — REGULATORY FOOTWORK

This is the boring but critical part.

### Terms of Service must include

1. **$XENTS is non-refundable** once credited (unless required by law).
2. **$XENTS has no monetary value outside the platform** — explicit, multiple times.
3. **$XENTS cannot be exchanged for cash or other tokens.**
4. **Account closure does not refund $XENTS** (unless local law requires it — most US states don't, but California / EU may require pro-rated refund of unused credit).
5. **You reserve the right to refuse transactions** for fraud / chargeback risk.

### Required disclosures on Change Machine page

Already present in your build, but worth confirming:
- "ONE-WAY UTILITY CREDIT"
- "NOT A SECURITY · NOT TRADABLE"
- "NO CASH-OUT · NO SECONDARY MARKET"

### FinCEN / state money-transmitter exemption

A platform that sells utility credit redeemable only for its own services on its own platform is generally **exempt from money-transmitter licensing** under FinCEN guidance (31 CFR 1010.100(ff)(5)(i)(A)). This is the "stored value" carve-out. **HOWEVER:**

- If a user can ever transfer $XENTS to another user, you're a money transmitter. **Keep $XENTS strictly non-transferable.**
- If $XENTS can be cashed out, you're a money transmitter. **Keep one-way.**
- If $XENTS can buy a third-party's goods/services, you may be. **Keep it tied to your ecosystem.**

The current $XENTS model satisfies all three. **Don't change any of these.** Tipping an artist works because the artist is your platform participant, not an arms-length third party.

### Sales tax

In most US states, the sale of utility credit / digital gift cards is **not taxed at purchase** — the tax is collected on the underlying digital good when redeemed (e.g. when the $XENTS is spent on a mint, that mint may be a taxable digital service). Stripe Tax handles this automatically once configured.

EU VAT is more complex: digital services to EU consumers are taxed at the consumer's country VAT rate. Stripe Tax handles this with one-stop-shop (OSS) registration. Set it up once.

---

## ⟁ PHASE 9 — TESTING

### Stripe test mode

Use test keys (`sk_test_...`) and these card numbers:
- `4242 4242 4242 4242` — always succeeds
- `4000 0000 0000 9995` — declined (insufficient funds)
- `4000 0000 0000 0259` — chargeback after settlement
- `4000 0027 6000 3184` — 3DS authentication required

Test the full loop:
1. Create checkout for $25
2. Complete payment with test card
3. Verify webhook fired (Stripe Dashboard → Webhooks → recent events)
4. Verify `xents_purchases.status = 'complete'`
5. Verify `user_balances.xents_balance` incremented by 2500
6. Verify `xents_ledger` has new row
7. Refresh frontend, verify chip shows new balance

### Load test

Before launch, simulate 100 concurrent checkouts. Stripe's API can handle it; your edge function quotas might not. Upgrade Supabase to Pro before launch ($25/mo).

---

## ⟁ DEPLOYMENT CHECKLIST

- [ ] Stripe account activated (live mode)
- [ ] Business verification complete
- [ ] Stripe Tax configured for your jurisdictions
- [ ] Webhook endpoint registered + signing secret saved to Supabase
- [ ] Edge functions deployed (`create-xents-checkout`, `stripe-webhook`)
- [ ] Migration `002_xents_stripe.sql` applied
- [ ] RLS policies verified
- [ ] `xents-success.html` deployed
- [ ] `xents-widget.js` updated with real deposit handler
- [ ] Privacy Policy + Terms of Service published
- [ ] Test transactions in production mode (small real charges, refund yourself)
- [ ] Monitoring: Sentry on edge functions, Stripe Dashboard alerts on dispute rate >0.5%

---

## ⟁ AFTERWARD: APPLE PAY, GOOGLE PAY, KLARNA

Stripe Checkout auto-detects these on supported devices once you've:
1. Verified your Stripe-hosted Checkout domain (for Apple Pay JS — auto-handled by hosted Checkout)
2. Enabled them in Stripe Dashboard → Settings → Payment Methods

No code changes needed. They appear as payment options on the Checkout page based on browser/device.

Klarna (Buy Now Pay Later) on $XENTS top-ups is a *moral* question — letting users finance utility credit purchases creates risk. Recommend keeping it off for credit purchases.

---

## ⟁ FINAL NOTES

- **Stripe takes 2.9% + $0.30 per US card transaction.** On a $50 top-up that's $1.75. Your platform fee math should account for this.
- **Chargeback fee is $15** even if you win the dispute. Keep your dispute rate under 0.5% (Stripe will threaten account closure above 1%).
- **Stripe Connect** could let you pay out artists directly via Stripe instead of running your own payout system. Worth considering for v2 — Connect Express handles KYC, 1099 generation, and ACH transfers for ~0.25% additional fee.
- **For international expansion**, Stripe supports 47 countries on the seller side; cards work from everywhere. EU customers buying USD $XENTS get charged in USD with auto-conversion shown.

This integration takes **a focused 2-day sprint** with someone who knows Stripe + Supabase. Allow 1 more day for thorough testing.

`// END SPEC //`
`// PASTE PHASES INTO YOUR IDE AND EXECUTE SEQUENTIALLY //`
