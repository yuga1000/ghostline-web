# Patreon launch pack — copy/paste ready

Page: https://www.patreon.com/Yuga1000

Claude cannot open Patreon (the extension blocks the domain — see
`MONETIZATION_PLAN.md` §2), so everything here is written to be pasted by hand.
Order below is the order to do it in. Budget ~40 minutes.

Images are generated from the workshop capture and sit in `docs/patreon-assets/`:

| File | Where it goes |
|---|---|
| `patreon-banner-1600x400.jpg` | Page cover / banner |
| `patreon-avatar-512.jpg` | Profile picture |

---

## 1. Page identity

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
One person. Framed LED panels built to order, the animation loops that run on them, and MYSTRA — a robotics prototype being rebuilt in the open.
```

---

## 2. About page

```
I make physical objects that run pixel signal.

The main one is a framed LED panel: a 42×42 cm body, a 31×31 cm matrix, a frame carved in metal, wood, or the full horned shape. It plays a loop I animate. It is built to order, one at a time, in a room full of cable conduit — there is no studio and no production line, and the footage on this page is the actual object, not a render.

The other one is MYSTRA — a robotics prototype I am rebuilding and documenting publicly. Its files, hex data and whitepaper go up as they get written, not after everything is finished.

Panels pay for the parts. This page pays for the time between panels — the animation work, the frame prototypes, the build logs, and putting the archive back online.

If you have ever wanted one of the panels but $659 is not a thing you do casually: the top tier here accrues as credit toward one. Twelve months covers it.

Everything, including the wallet if you would rather skip the platform:
ghostline.live/support.html
```

---

## 3. Tiers

### Tier 1 — **SIGNAL** · $3/month
```
The monthly dispatch.

· Every capture shot that month — panels, frames, failures, the stuff that does not make it to the site
· Access to the archive as pages come back online
· You are the reason the next panel gets built

No fluff, one post a month minimum, always something you have not seen.
```

### Tier 2 — **PANEL** · $10/month
```
Everything in SIGNAL, plus the loops themselves.

· The animation loops as downloadable files — MP4 and frame sequence — for your own screen, phone, or monitor
· A vote on what goes into the next capture set
· Early look at new loops before they go on the panels page

If you like the work but do not want a 42 cm object on your wall, this is the tier.
```

### Tier 3 — **LAB** · $25/month
```
Everything in PANEL, plus MYSTRA.

· Build logs from the prototype — what worked, what burned out, what got rebuilt
· Hex data, subsystem specs, DOF breakdowns
· Whitepaper drafts as they are written, not after
· Datasets: weights, logs, replays
· Your name in the site credits

This is the documentation the project owes itself. You get it first.
```

### Tier 4 — **OBJECT** · $50/month
```
Everything in LAB, plus the panel itself.

Every month at this tier accrues $50 of credit toward a GHOSTLINE LED panel. Twelve months covers a $659 panel in full — frame of your choice, loop of your choice, built to order.

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

## 4. Goals

Patreon goals are the soft crowdfund for MYSTRA — no delivery promise, no
penalty for missing them.

```
$200/mo — parts budget for the next MYSTRA subsystem
```
```
$500/mo — MYSTRA files go fully public instead of tier-locked
```
```
$1000/mo — full time on the lab
```

---

## 5. Three posts before you announce

Do not launch tiers into an empty page — a visitor checks whether anything is
behind each tier, and "nothing yet" reads as abandoned. One post per level so
each tier visibly has something.

**Post 1 — public** (attach `panel-in-situ.mp4`)
```
Title: THE PANEL IS A REAL OBJECT

Shot in the workshop, no post. 42×42 cm body, 31×31 cm matrix, the horned frame carved as one full shape around it. This is what it looks like in a room — matte black, the signal doing all the light.

Six loops exist so far. Each panel ships with the one you pick, or one made for you.

ghostline.live/panels.html
```

**Post 2 — SIGNAL tier and up** (attach 3–4 stills from the capture set)
```
Title: CAPTURE SET 01–06

The six loops currently running on the panels: DANCER, SANSARA, MOON RIDER, NIGHT WALKER, DARUMA, ORCA.

Stills below, including the frames that got cut. Next set starts after the current build queue clears — PANEL tier votes on what goes in it.
```

**Post 3 — LAB tier and up** (attach the MYSTRA render / rotate GIF)
```
Title: MYSTRA 01 — WHERE IT ACTUALLY IS

Honest status: the folders on the site say IN DEVELOPMENT because they are. Here is what exists right now and what does not.

[write 5–10 lines: what subsystem you are on, what is next, what is blocking]

This tier gets these as they happen, not after.
```

---

## 6. Announce once, everywhere

Post this to every social already linked in `index.html` — Instagram, X, TikTok,
Telegram, YouTube community, Pinterest, Zora.

```
The panels have a Patreon now.

Tiers from $3. Loops as downloadable files at $10. MYSTRA build logs at $25. At $50 it accrues as credit toward an actual panel.

patreon.com/Yuga1000

All the ways to support, wallet included: ghostline.live/support.html
```

---

## 7. After Patreon is live

1. Mirror the same four tiers on **Boosty** (RU cards get rejected by Patreon), then paste both URLs into `js/support-links.js`.
2. Set up **Ko-fi** — two minutes, no tiers needed, it catches the people who will never subscribe.
3. **Gumroad or Lemon Squeezy** for a card checkout. This is the biggest conversion fix left on the site: right now a panel buyer must already hold USDT on TRON.

All three appear on the site automatically once their `url` is filled in.
