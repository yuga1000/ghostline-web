# Patreon: setup walkthrough + copy to paste

Account: https://www.patreon.com/Yuga1000

I cannot open Patreon (the browser extension blocks the domain), and I would not
touch the login or the payout details even if I could. So this is written as a
checklist you click through, with every piece of text already written out below.

**Part A** is the walkthrough, in the order the steps have to happen.
**Part B** is the copy. Keep both open, work top to bottom.

Budget about an hour, and it does not all have to be one sitting. A1 to A5 are
the page. A6 and A7 are money and tax, which have to clear before you can be
paid. A8 is publishing.

> **This page is patronage, not a subscription.** No content calendar, no bonus
> content, no hidden extras, nothing owed on a schedule. The offer is one line:
> you are funding the development of art, and of a new form of life. Every word
> below is written that way on purpose. A promise you make on launch day is a
> debt you carry every month after.

> **On button names:** Patreon reworked its creator UI (that is what the `/cw/`
> address is). Labels move around between releases, so each step says what you
> are looking for and what it does, not a pixel-perfect path. If a label reads
> differently on your screen, go by the description.

Everything the page needs is in `docs/patreon-assets/`. All of it is the actual
work, shot on the panel. Nothing here is drawn to stand in for it:

| File | Where it goes |
|---|---|
| `patreon-banner-1600x400.jpg` | **Page cover.** The horned frame with the horned figure lit on the matrix, cable on the left, workshop wall on the right |
| `patreon-avatar-512.jpg` | Profile picture, the lit panel |
| `tier-cover-1-sansara.jpg` | Tier cover, 920x400 for Patreon's 460x200 slot |
| `tier-cover-2-nightwalker.jpg` | Tier cover |
| `tier-cover-3-orca.jpg` | Tier cover |
| `tier-1-signal.jpg` | Square versions, if a square slot turns up |
| `tier-2-witness.jpg` | |
| `tier-3-patron.jpg` | |

The first pass at these was generated: black plates with the site's pixel face,
TIER 1 / SIGNAL / $3, three of them identical bar the word. It looked like what
it was. Your own frames carry LED grain, real colour and a visible matrix, and
no drawn substitute beats that on a page asking people to fund the work.

---

# PART A. The walkthrough

## A1. Get into the creator workspace

Sign in, then go to **patreon.com/cw** (that is where you already were when you
sent me the link). If Patreon drops you on a normal member feed, look for an
account or avatar menu with a "creator" or "my page" entry.

Take a minute to see what state the old page is in. Most likely: an account
exists, a draft exists, nothing is published. That matches what the URLs do from
outside, which is the whole reason the link was dead.

## A2. Claim the page address

First thing to fix, because everything else links to it.

Find the **custom URL / vanity URL / page address** field in the page settings.
Right now `patreon.com/Yuga1000` bounces to `/profile?u=184759122`, the fallback
for a page with no published address of its own.

**`ghostline` is already taken** by someone else, checked 2026-09-21. Free as of
that check:

```
ghostlineos        <- matches the GHOSTLINE_OS in the site header
ghostlinesystem    <- matches the contact address
yugaghostline
```

`ghostlineos` over `ghostline_os`: underscores are not reliably allowed in
vanity URLs, and it reads the same.

Set it once, now, before the address is announced anywhere. Changing it later
breaks every link already in the wild.

**Send me whichever one you get.** One line changes in `js/support-links.js` and
it propagates across the whole site by itself.

## A3. Page identity

From **Part B, section B1**:

- Page name
- The "is creating" line
- Profile picture: `patreon-avatar-512.jpg`
- Cover image: `patreon-banner-1600x400.jpg`
- About section: the long text in **B2**

If the uploader crops the images differently than you like, say so and I will
recut from the source footage at whatever ratio it wants.

## A4. Three tiers, and that is all

Membership section, add a tier, three times. Text is in **Part B, section B3**.

Three, not four, and none of them promise anything. The tiers exist to give
people a size of gesture to choose from, not to sell access to a content
library. **A patron at $3 and a patron at $25 see exactly the same page.** That
is stated openly in the copy, because hiding it would be the start of a debt.

For each tier set:

- **Name** and **monthly price** (3, 10, 25 USD)
- **Description**: paste the block
- **Tier image**: `tier-1-signal.jpg`, `tier-2-witness.jpg`, `tier-3-patron.jpg`.
  Three different loops on the real panel, so the tier row is three pieces of
  work rather than three price labels. **The tier editor asks for 460x200, not
  a square**, so use the `tier-cover-*.jpg` files. They are 920x400, double
  size, which keeps them sharp on a retina screen.

> **Free trials lock the price.** The tier editor shows the monthly price greyed
> out with "Tier price can't be changed while free trials are enabled and while
> any free trial is still active." Turn free trials off first if the number is
> wrong, then set it.
- **Benefits**: fill these in, they matter more than I first said. The bullets
  under "What's included" on the membership cards come from this field, not from
  the description. A card with an empty list next to other creators' full ones
  reads as unfinished. The lines are in **Part B, section B3a**, and none of
  them promise anything that is not already true.
- **Recommended**: Patreon lets you flag one tier as recommended, which puts a
  badge on it and makes it the middle card people look at first. Put it on
  WITNESS.

Leave member limits empty. No reason to cap anything.

> An earlier draft of this document had a fourth tier at $50 that accrued as
> credit toward a panel, and tiers stuffed with downloadable files and build
> logs. Good sales mechanics, bad promises: they make you a bookkeeper and put
> you on the hook every month. Dropped on purpose.

## A5. Skip the goals

Earlier draft had three funding goals. Skip them. A public goal is a promise with
a number attached, which is exactly what does not belong on this page.

## A6. Payouts

**Yours alone. I will not ask for, look at, or handle any of it.**

Settings, then payouts. You connect a bank account or PayPal and pick a payout
currency. Two things worth knowing first:

- Patreon pays out on a schedule, not instantly. First payout is usually the
  month after your first charge clears.
- Pick the payout currency you actually hold. Converting twice costs real money
  on a $3 pledge.

## A7. Tax details

Also yours, also unavoidable. Settings, then tax.

Outside the US you will be asked for a **W-8BEN**, a short form declaring you are
not a US taxpayer. Patreon holds payouts until it is filed, so do it now rather
than discovering it on payout day.

## A8. Two posts, then publish

Do not publish an empty page. A visitor checks whether anything is behind the
page at all, and "nothing yet" reads as abandoned.

Two posts is enough. Both **public**, both showing an object rather than
explaining a plan. Text is in **Part B, section B4**.

| Post | Attach | Audience |
|---|---|---|
| THE PANEL | `assets/led-panels/video/panel-in-situ.mp4` (2.5 MB) | Public |
| MYSTRA | `lab/assets/mystra-rotate.gif` or a workshop photo | Public |

Public on purpose. These two posts are the shop window: someone landing on the
page should see the actual work before deciding anything. Lock nothing.

Then find the **publish / launch page** action. Until you press it the page stays
a draft and the public URL keeps 404ing, exactly as it does today.

## A9. Tell the site

Send me the final public URL. One line in `js/support-links.js`, and it reaches
the support page, the panels page, the MYSTRA notice and the front-page social
panel on its own.

## A10. What Patreon keeps

Know this before you argue with yourself about prices.

Patreon takes a **platform cut plus payment processing**. The platform cut has
been 8 to 12 percent depending on plan and vintage, and processing is roughly 3
percent plus a fixed fee per charge. I am not stating today's exact number as
fact, because Patreon has changed it more than once and I cannot open the page to
check. **Read the fee line in your own billing settings and go by that.**

What matters in practice:

- The fixed per-charge fee hurts small pledges most. On $3 it is a real slice, on
  $25 it is noise.
- Annual billing, if you enable it, charges once a year instead of twelve times,
  so the fixed fee is paid once. Worth turning on.
- USDT direct on the site costs a TRON network fee and nothing else. That is why
  the support page says the cheapest route is the wallet. Keep saying it.

None of this is a reason not to launch. Predictable money minus 10 percent beats
unpredictable money.

## A11. Later, once posts pile up

Not launch day:

- **Collections** group posts into named sets. Two obvious ones: PANELS and
  MYSTRA. Turns a feed into an archive.
- **Scheduled posts** let you write several in one sitting and release them over
  weeks, which keeps the page alive in a month where you are welding instead of
  writing.

---

# PART B. The copy

Ready to paste. English, to match the site and the socials it gets announced on.
Say the word and I will write the Russian version for Boosty, which wants a
different tone, not a straight translation.

## B1. Page identity

**Page name**
```
GHOSTLINE
```

**The "is creating" line**
```
art that runs on light, and a new form of life
```

**Short intro under the banner**
```
Eighteen years of drawing by hand, now on LED panels. And a walking robot I am building in the open. One person, no studio.
```

---

## B2. About page

```
Hey. Thanks for being here.

I'll keep it short.

I've been drawing by hand for 18 years. Oil, acrylic, watercolour, and a long stretch of frame by frame animation, drawing every single frame.

Then I burned out. I thought I was done with art.

Nothing worked. Social media didn't work for me, commissions didn't come. I tried tattoos, videography, animation, paintings, custom clothing by hand. None of it went anywhere.

Then Threads started working. I have no idea why. I posted animation there and people watched. But it's animation on a phone, and I wanted to see it for real. So I put it on a P2.5 LED panel, and it clicked.

That's what this page is about. Two things.

The panels. A frame I make by hand with an LED matrix in it, playing animation I draw pixel by pixel. One at a time, in a room full of cable. The video up there is the real thing, where it was made.

And MYSTRA. A walking robot. Six legs, eighteen actuators. Nowhere near done. I'm building it out in the open so you'll see it while it's still wrong.

Why I'm making it I can't really say. Things tend to come out of the process itself, especially when there's no money pressure and nobody to please. I make art and I treat this as art too. If it doesn't sit right it's not done.

Nature is full of insects and everything comes out of nature anyway. I think these machines will surprise people the way the first train did.

I work alone and there's a lot of it. Drawing, welding, soldering, cutting frames, writing the code, shooting the video, answering mail. No studio, no team, nobody paying for any of it.

So this page is simple and I'll be straight with you.

There's no bonus content. No hidden vault, no post every Tuesday, no rewards made up to justify a price. I'd rather put that time into the work.

What you're backing is the art, and a new form of life.

I know it's a lot to ask. There are plenty of people making good things who probably deserve it more than me. Whatever you decide, or if you decide nothing, thanks for looking.

Panels are at ghostline.live/panels.html if you want an actual object.
If you just want this to keep going, you're already in the right place.
```

---

## B3. Tiers

Lead with the patronage, not with what the page does not do. The honest note
about no bonuses belongs second, where it reads as a condition rather than an
apology.

### **SUPPORT** · $5/month
```
This is patronage. The old kind, where someone pays so the art gets made.

I draw the animation by hand, build the panels by hand, and I am building a walking robot. On my own. Your money goes into materials and time.

Nothing is locked behind this, and there is no schedule. You are supporting the art itself.

Thank you.
```

If a second and third tier go up later, the text is the same and only the size
changes. Nothing is being sold, so there is nothing to differentiate.

---

## B3a. Tier benefits

The bullets on the membership cards. Flat and plain, the way a list reads.

**SIGNAL, $3**
```
All posts
No schedule, I post when there is something
```

**WITNESS, $10**
```
All posts
No schedule, I post when there is something
Your name in the credits on ghostline.live
```

**PATRON, $25**
```
All posts
No schedule, I post when there is something
Your name in the credits on ghostline.live
Buys actual parts: frames, LED strip, actuators
```

Patreon keeps a shared list, so a line written once can be attached to several
tiers instead of retyped.

---

## B4. The two launch posts

**Post 1, public.** The P2.5 panel clip.

```
Title: P2.5 PANEL

After 18 years of art I burned out. Properly. I thought I was done with it.

Nothing worked. Social media didn't work for me, commissions didn't come. I tried tattoos, videography, animation, paintings, custom clothing by hand. Everything I could think of. None of it went anywhere.

Then Threads started working. I have no idea why. I posted animation there and people watched.

But it's animation on a phone. I wanted to see it for real, so I put it on a P2.5 panel.

This is that. It clicked, so this is what I'm doing now.
```

**Post 2, public.** Attach `lab/assets/mystra-rotate.gif`, or better, a photo of
the real build if you have one.

```
Title: MYSTRA

This is MYSTRA. A walking robot. Six legs, eighteen actuators, an IMU and a camera cluster.

It's nowhere near done and I'm not going to pretend otherwise. I'm building it out in the open, so the failures go up here too.

I don't know when it'll walk. I'm going to keep going until it does.
```

---

## B5. Announce once, everywhere

Post to every social already linked on the front page: Instagram, X, TikTok,
Telegram, YouTube community, Pinterest, Zora.

```
I opened a Patreon.

I make LED panels that play animation I draw by hand, and I am building a walking robot. One person, no studio, and a lot of work.

No bonus content, no tiers full of promises, no posting schedule. If you want the work to keep running you can back it, and that is the whole thing.

patreon.com/<your url>

Panels and every other way to help: ghostline.live/support.html
```

---

## B6. After Patreon is live

**First thing once it is published:** go to `MONETIZATION_PLAN.md` section 5b,
selling the animations. That is the parked one, and it is the nearest money.

Then:


1. Mirror the same three tiers on **Boosty** for cards Patreon will not take. Ask
   me for the Russian copy, it should not be a literal translation.
2. Set up **Ko-fi**, two minutes, no tiers. It catches people who will never
   subscribe but would drop five dollars once.
3. **Gumroad or Lemon Squeezy** for a card checkout on the panels. This is the
   biggest conversion fix left on the site: a buyer currently has to already hold
   USDT on TRON.

All three appear on the site automatically once their `url` is filled in.
