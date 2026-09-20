# Patreon: setup walkthrough + copy to paste

Account: https://www.patreon.com/Yuga1000

I cannot open Patreon (the browser extension blocks the domain), and I would not
touch the login or the payout details even if I could. So this is written as a
checklist you click through, with every piece of text already written out below.

**Part A** is the walkthrough, in the order the steps have to happen.
**Part B** is the copy. Keep both open, work top to bottom.

Budget about 90 minutes total, and it does not all have to be one sitting.
Steps A1 to A5 are the page. A6 and A7 are money and tax, which have to clear
before you can be paid. A8 is publishing.

> **On button names:** Patreon reworked its creator UI (that is what the `/cw/`
> address is). Labels move around between releases, so each step says what you
> are looking for and what it does, not a pixel-perfect path. If a label reads
> differently on your screen, go by the description.

Images for the page are already cut from the workshop capture, in
`docs/patreon-assets/`:

| File | Where it goes |
|---|---|
| `patreon-banner-1600x400.jpg` | Page cover / banner |
| `patreon-avatar-512.jpg` | Profile picture |

---

# PART A. The walkthrough

## A1. Get into the creator workspace

Sign in, then go to **patreon.com/cw** (that is where you already were when you
sent me the link). If Patreon drops you on a normal member feed instead, look
for an account or avatar menu with a "creator" or "my page" entry.

Take a minute here to see what state the old page is in. Most likely: an account
exists, a page draft exists, nothing is published. That matches what the URLs do
from outside, which is the whole reason the link was dead.

## A2. Claim the page address

This is the first thing to fix, because everything else links to it.

Look in the page settings for the **custom URL / vanity URL / page address**
field. Right now `patreon.com/Yuga1000` bounces to `/profile?u=184759122`, which
is the fallback for a page with no published address of its own.

Set it to something that matches the site:

```
ghostline
```

If that is taken, in order of preference:

```
ghostlinesystem
ghostline_os
yugaghostline
```

**Send me whichever one you get.** It goes into `js/support-links.js` and from
there onto every page of the site by itself.

## A3. Page identity

Fill these from **Part B, section B1** below:

- Page name
- The "is creating" line / tagline
- Profile picture: `patreon-avatar-512.jpg`
- Cover image: `patreon-banner-1600x400.jpg`
- About section: the long text in Part B

The banner is 1600x400 and the avatar 512x512, which is what Patreon asks for.
If the uploader crops them differently than you like, say so and I will recut
from the source footage at whatever ratio it wants.

## A4. Build the four tiers

Membership section, then add a tier, four times. Text for each is in
**Part B, section B3**.

For each tier set:

- **Name** and **monthly price** (3, 10, 25, 50 USD)
- **Description**: paste the block
- **Tier image**: use a still from a different capture per tier, so the four
  tiers read as four different objects. Tell me which loop you want for which
  tier and I will export the stills at the size Patreon wants.
- **Benefits**: if Patreon asks you to list benefits as separate short lines,
  pull them from the bullet lines in each tier block.

Leave member limits empty on all four. There is no reason to cap them yet.

**On the $50 OBJECT tier:** Patreon does not track credit toward a physical
object. Nothing in its system knows that twelve payments equal one panel. Keep
that ledger yourself, a spreadsheet with patron name, months paid, running
total. Patreon's own pledge history is the backup record if anything is ever
disputed.

## A5. Decide what happens to the goals

The three funding goals in **Part B, section B4** may or may not exist as a
feature in your UI. Patreon has added and removed public earnings goals more
than once, and I am not going to guess which build you have.

- If you find a **goals** section: put the three lines in.
- If you do not: paste the same three lines at the bottom of the About text, or
  pin a post with them. Same effect, and it costs nothing.

## A6. Payouts

**This one is yours alone. I will not ask for, look at, or handle any of it.**

Settings, then payouts. You connect a bank account or PayPal and pick a payout
currency. Two things worth knowing before you start:

- Patreon pays out on a schedule, not instantly. First payout is usually the
  month after your first charge clears.
- Pick the payout currency you actually hold. Converting twice costs real money
  on a $3 pledge.

## A7. Tax details

Also yours, also unavoidable. Settings, then tax.

As a creator outside the US you will be asked for a **W-8BEN**. It is a short
form declaring you are not a US taxpayer. Patreon will hold payouts until it is
filed, so do it now rather than discovering it on payout day.

## A8. Three posts, then publish

Do not publish an empty page. A visitor checks whether anything sits behind each
tier, and "nothing yet" reads as abandoned.

Write the three posts in **Part B, section B5** first, setting the audience on
each one:

| Post | Audience |
|---|---|
| THE PANEL IS A REAL OBJECT | Public |
| CAPTURE SET 01-06 | SIGNAL and up |
| MYSTRA 01, WHERE IT ACTUALLY IS | LAB and up |

Post 1 wants `assets/led-panels/video/panel-in-situ.mp4` attached. It is 2.5 MB,
well under any limit. Post 2 wants stills from the capture set, say the word and
I will export them.

Then find the **publish / launch page** action. Until you press it the page
stays a draft and the public URL keeps 404ing, exactly as it does today.

## A9. Tell the site

Send me the final public URL. One line changes in `js/support-links.js` and it
propagates to the support page, the panels page, the MYSTRA notice and the front
page social panel on its own.

## A10. What Patreon keeps

Know this before you argue with yourself about prices.

Patreon takes a **platform cut plus payment processing**. The platform cut has
been 8 to 12 percent depending on plan and vintage, and processing is roughly 3
percent plus a fixed fee per charge. I am not going to state today's exact
number as fact, because Patreon has changed it more than once and I cannot open
the page to check. **Look at the fee line on your own billing settings and go by
that.**

What matters for how you price:

- The fixed per-charge fee hurts small pledges most. On a $3 pledge the fixed
  part alone is a real slice; on $25 it is noise. That is an argument for making
  the $10 and $25 tiers the ones you actually promote.
- Annual billing, if you enable it, charges once a year instead of twelve times,
  so the fixed fee is paid once. Worth turning on.
- USDT direct on the site costs you a TRON network fee and nothing else. That is
  why the support page says the cheapest route for you is the wallet. Keep
  saying it. People who like the work will use it.

None of this is a reason not to launch. Predictable money at 10 percent off beats
unpredictable money at 0 percent.

## A11. Later, once posts pile up

Not launch day, but do not forget it exists:

- **Collections** group posts into named sets. Three obvious ones for you:
  CAPTURES, MYSTRA LOGS, BUILDS. It turns a feed into an archive, which is what
  you are actually selling at the LAB tier.
- **Scheduled posts** let you write three in one sitting and release them
  weekly, which keeps the page alive during a month where you are welding
  instead of writing.

---

# PART B. The copy

## B1. Page identity

**Page name**
```
GHOSTLINE
```

**Tagline / "is creating"**
```
LED panels that run pixel signal, and a robot called MYSTRA
```

**Intro (the short blurb under the banner)**
```
One person. Framed LED panels built to order, the animation loops that run on them, and MYSTRA, a robotics prototype being rebuilt in the open.
```

---

## B2. About page

```
I make physical objects that run pixel signal.

The main one is a framed LED panel: a 42×42 cm body, a 31×31 cm matrix, a frame carved in metal, wood, or the full horned shape. It plays a loop I animate. It is built to order, one at a time, in a room full of cable conduit. There is no studio and no production line, and the footage on this page is the actual object, not a render.

The other one is MYSTRA, a robotics prototype I am rebuilding and documenting publicly. Its files, hex data and whitepaper go up as they get written, not after everything is finished.

Panels pay for the parts. This page pays for the time between panels: the animation work, the frame prototypes, the build logs, and putting the archive back online.

If you have ever wanted one of the panels but $659 is not a thing you do casually: the top tier here accrues as credit toward one. Twelve months covers it.

Everything, including the wallet if you would rather skip the platform:
ghostline.live/support.html
```

---

## B3. Tiers

### Tier 1. **SIGNAL** · $3/month
```
The monthly dispatch.

· Every capture shot that month: panels, frames, failures, the stuff that does not make it to the site
· Access to the archive as pages come back online
· You are the reason the next panel gets built

No fluff, one post a month minimum, always something you have not seen.
```

### Tier 2. **PANEL** · $10/month
```
Everything in SIGNAL, plus the loops themselves.

· The animation loops as downloadable files, MP4 and frame sequence, for your own screen, phone, or monitor
· A vote on what goes into the next capture set
· Early look at new loops before they go on the panels page

If you like the work but do not want a 42 cm object on your wall, this is the tier.
```

### Tier 3. **LAB** · $25/month
```
Everything in PANEL, plus MYSTRA.

· Build logs from the prototype: what worked, what burned out, what got rebuilt
· Hex data, subsystem specs, DOF breakdowns
· Whitepaper drafts as they are written, not after
· Datasets: weights, logs, replays
· Your name in the site credits

This is the documentation the project owes itself. You get it first.
```

### Tier 4. **OBJECT** · $50/month
```
Everything in LAB, plus the panel itself.

Every month at this tier accrues $50 of credit toward a GHOSTLINE LED panel. Twelve months covers a $659 panel in full: frame of your choice, loop of your choice, built to order.

· Credit never expires and is yours whenever you want to redeem it
· Delivery quoted separately for your location
· Direct line to me on what goes on your panel

A layaway plan for an object that does not exist yet, from the person building it.
```

> **Before publishing OBJECT:** decide what happens if someone cancels at month
> 7. Simplest honest rule, and the one the copy above implies: credit is kept and
> redeemable at any time, it just does not buy a whole panel yet. Say that in the
> tier's fine print in your own words so there is no argument later.

---

## B4. Goals

Patreon goals are the soft crowdfund for MYSTRA. No delivery promise, no
penalty for missing them.

```
$200/mo  parts budget for the next MYSTRA subsystem
```
```
$500/mo  MYSTRA files go fully public instead of tier-locked
```
```
$1000/mo  full time on the lab
```

---

## B5. The three posts

Do not launch tiers into an empty page. A visitor checks whether anything is
behind each tier, and "nothing yet" reads as abandoned. One post per level so
each tier visibly has something.

**Post 1, public** (attach `panel-in-situ.mp4`)
```
Title: THE PANEL IS A REAL OBJECT

Shot in the workshop, no post. 42×42 cm body, 31×31 cm matrix, the horned frame carved as one full shape around it. This is what it looks like in a room: matte black, the signal doing all the light.

Six loops exist so far. Each panel ships with the one you pick, or one made for you.

ghostline.live/panels.html
```

**Post 2, SIGNAL tier and up** (attach 3 or 4 stills from the capture set)
```
Title: CAPTURE SET 01-06

The six loops currently running on the panels: DANCER, SANSARA, MOON RIDER, NIGHT WALKER, DARUMA, ORCA.

Stills below, including the frames that got cut. Next set starts after the current build queue clears. PANEL tier votes on what goes in it.
```

**Post 3, LAB tier and up** (attach the MYSTRA render / rotate GIF)
```
Title: MYSTRA 01, WHERE IT ACTUALLY IS

Honest status: the folders on the site say IN DEVELOPMENT because they are. Here is what exists right now and what does not.

[write 5 to 10 lines: what subsystem you are on, what is next, what is blocking]

This tier gets these as they happen, not after.
```

---

## B6. Announce once, everywhere

Post this to every social already linked in `index.html`: Instagram, X, TikTok,
Telegram, YouTube community, Pinterest, Zora.

```
The panels have a Patreon now.

Tiers from $3. Loops as downloadable files at $10. MYSTRA build logs at $25. At $50 it accrues as credit toward an actual panel.

patreon.com/Yuga1000

All the ways to support, wallet included: ghostline.live/support.html
```

---

## B7. After Patreon is live

1. Mirror the same four tiers on **Boosty** (RU cards get rejected by Patreon), then paste both URLs into `js/support-links.js`.
2. Set up **Ko-fi**, two minutes, no tiers needed, it catches the people who will never subscribe.
3. **Gumroad or Lemon Squeezy** for a card checkout. This is the biggest conversion fix left on the site: right now a panel buyer must already hold USDT on TRON.

All three appear on the site automatically once their `url` is filled in.
