# Masmer AI — Pre-Demo Audit & Fix Plan

I fetched https://masmer.info and reviewed it as a senior product designer + conversion expert. Here's what I found and what I recommend we fix **before tomorrow's demo**.

---

## 1. First impression (5-second test)

**The good:** Strong dark theme, orange glow hero, confident headline ("The AI Brain Behind Your Business"). Logo + nav are clean.

**The problem:** The page sells **"Masmer AI agents that answer your phone"** but the product the user logs into is a **free contractor toolkit (estimates, projects, planner)**. There's a mismatch — visitors expect a paid AI receptionist, then land in a free internal app. This will confuse demo viewers.

---

## 2. Mixed message (the biggest issue)

The site has **two contradicting offers** on one page:

- Hero: "Free AI platform… No credit card required." → `/signup`
- Pricing: "$199/month Essentials, $399/month Full Suite" → `/#contact`

Pick one for the demo:
- **Option A — Free tool only (matches what you actually built):** remove the Pricing section, remove "$17K lost / month" pure-sales framing, focus on "free contractor OS."
- **Option B — Free tool + paid AI receptionist add-on:** keep both, but clearly label them as two products. Pricing CTAs should say "Join waitlist" not "Get Started" since checkout isn't built.

Recommendation for tomorrow: **Option A**. Cleanest story, matches the actual app.

---

## 3. Conversion friction

- Two competing primary CTAs in the hero ("Create Free Account" + "See How It Works"). Make **Create Free Account** the only orange button; make "See How It Works" a text link.
- Navbar has **"Try Estimating Bot"**, **"Sign in"**, AND **"Try Free"** — three CTAs in the header. Collapse to one: "Sign in" + "Try Free."
- Pricing CTAs link to `/#contact` which doesn't exist as a section — dead anchor. Remove or repoint.

---

## 4. Copy & tone

- Headline is strong. Subhead is okay but generic. Suggest: *"Answer every call, build estimates in minutes, and run your jobs — free for contractors."*
- "$17,000/Month in Missed Calls" stat has no source. Add "(industry avg)" or remove.
- Founder quote is good and humanizes the brand — keep it.

---

## 5. Mobile / responsiveness

Current viewport is 708px (tablet). Visible issues likely:
- Hero headline may break awkwardly on small phones
- Pricing cards stack but CTAs are dead anchors
Need to QA at 375px width.

---

## 6. SEO basics

- Title: "Masmer AI — The AI Brain Behind Your Business" ✓ good
- Description: ✓ present
- Single H1: ✓
- Missing: og:image, structured data (Organization + SoftwareApplication JSON-LD), canonical tag

---

## 7. Login / signup flow (already fixed)

Login was overhauled last turn — `/signup` works, `/dashboard` no longer blocks. We should **smoke-test it once before the demo** with a fresh email.

---

## Top 5 prioritized fixes for today

1. **Resolve the free-vs-paid mismatch.** Remove or rebrand the Pricing section so the site matches the free product.
2. **Fix dead `/#contact` anchors** in pricing CTAs (point to `/signup` or remove).
3. **Simplify the navbar** — one primary CTA ("Try Free"), keep "Sign in" subtle, drop "Try Estimating Bot" duplicate.
4. **Mobile QA pass** at 375px — fix any clipped headlines or overlapping cards.
5. **Smoke-test signup → dashboard** end-to-end with a brand new email so we know the demo path is bulletproof.

## Nice-to-have (after demo)

- Add og:image and JSON-LD structured data
- Add a real "Contact" / "Demo" route or remove the nav link
- Add a short product video or animated GIF in the hero
- Add testimonials with real names/photos once you have 2–3 users

---

## What I'll do if you approve

Switch to build mode and execute fixes **#1–#4** as code changes, then we run **#5** together in the browser. Estimated time: ~15 minutes of edits + 5 minutes of QA.

Reply **"go"** and I'll start.
