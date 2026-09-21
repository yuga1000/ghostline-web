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

Images are already cut from the workshop capture, in `docs/patreon-assets/`:

| File | Where it goes |
|---|---|
| `patreon-banner-1600x400.jpg` | Page cover / banner |
| `patreon-avatar-512.jpg` | Profile picture |

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

Set it to match the site:

```
ghostline
```

If taken, in order of preference:

```
ghostlinesystem
ghostline_os
yugaghostline
```

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
- **Tier image**: a still from a different loop for each, so the three read as
  three different objects. Tell me which loop for which tier and I will export
  the stills.
- **Benefits**: if Patreon insists on a benefits list, keep it to one short line
  per tier, pulled from the block. Do not let the form talk you into inventing
  deliverables to fill the field. An empty benefits list is better than a
  dishonest one.

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
different tone anyway rather than a literal translation.

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
One person, no studio. LED panels that play hand-drawn animation, and a walking robot being built in the open. No bonus content, no schedule. You are funding the work itself.
```

---

## B2. About page

```
I make art objects that run on light.

The main one is an LED panel in a hand-made frame. It hangs on a wall and plays an animation I drew frame by frame, pixel by pixel. Every panel is built by hand, one at a time. The video on this page is the real object in the room it was built in, not a render.

The other one is MYSTRA. A walking robot. Six legs, eighteen actuators. It is not finished. I am building it in the open, which means you get to see it while it is still wrong.

I work alone and there is a great deal of it. Drawing, welding, soldering, cutting frames, writing the code, shooting the footage, answering the mail. No studio, no team, no publisher, no investor.

So here is the honest offer, and it is the whole offer:

There is no bonus content. No hidden extras, no members-only vault, no post every Tuesday. I do not think that is what this should be, and I would rather spend that time on the work.

What you are supporting is the development of art, and of a new form of life.

That is it. If it sounds worth something to you, put in whatever feels right. A patron at three dollars and a patron at twenty-five see exactly the same page, and both keep the same thing alive.

I post when there is something worth showing. Some months that is a lot. Some months I am just welding.

If you want an actual object, the panels are at ghostline.live/panels.html.
If you just want this to keep existing, you are already in the right place.

Thank you for being here. I mean that.
```

---

## B3. Tiers

### Tier 1. **SIGNAL** · $3/month
```
You are in.

No bonus content, no schedule, nothing owed. There is nothing here you are buying.

You are keeping the work alive, and that is the entire tier.
```

### Tier 2. **WITNESS** · $10/month
```
The same page, the same posts, the same nothing owed.

The difference is size. This is a real contribution to a month of work, and your name goes in the credits on ghostline.live so it is not invisible.
```

### Tier 3. **PATRON** · $25/month
```
The size that actually moves a build forward.

A month at this tier is a frame, or a run of LED strip, or a set of actuators that were not in the budget. Your name in the credits, and my genuine thanks.

Still no bonus content. Still nothing asked of you. You are funding art, and a new form of life.
```

---

## B4. The two launch posts

**Post 1, public.** Attach `assets/led-panels/video/panel-in-situ.mp4`.

```
Title: THE PANEL

This is the object.

42 by 42 centimetres. A frame carved as one full shape, an LED matrix behind it playing an animation I drew frame by frame.

Shot in the workshop where it was made. No post, no render, no set. The cable on the floor is where the cable was.

It hangs on a wall and does this all day.

If you want one: ghostline.live/panels.html
```

**Post 2, public.** Attach `lab/assets/mystra-rotate.gif`, or better, a photo of
the real build if you have one.

```
Title: MYSTRA

This is MYSTRA. A walking robot. Six legs, eighteen actuators, an IMU and a camera cluster.

It is not finished, and I am not going to pretend otherwise. I am building it in the open, so the failures go up here too.

I do not know when it will walk. I am going to keep going until it does.
```

---

## B5. Announce once, everywhere

Post to every social already linked on the front page: Instagram, X, TikTok,
Telegram, YouTube community, Pinterest, Zora.

```
I opened a Patreon.

I make LED panels that play animations I draw by hand, and I am building a walking robot. One person, no studio, no publisher, and a lot of work.

No bonus content, no tiers full of promises, no posting schedule. It is patronage, plain: you are funding the development of art, and of a new form of life.

patreon.com/<your url>

Panels, and every other way to support: ghostline.live/support.html
```

---

## B6. After Patreon is live

1. Mirror the same three tiers on **Boosty** for cards Patreon will not take. Ask
   me for the Russian copy, it should not be a literal translation.
2. Set up **Ko-fi**, two minutes, no tiers. It catches people who will never
   subscribe but would drop five dollars once.
3. **Gumroad or Lemon Squeezy** for a card checkout on the panels. This is the
   biggest conversion fix left on the site: a buyer currently has to already hold
   USDT on TRON.

All three appear on the site automatically once their `url` is filled in.
