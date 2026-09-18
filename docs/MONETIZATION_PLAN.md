# GHOSTLINE — Monetization & Crowdfunding Plan

Last updated: 2026-09-18

This replaces the idea-dump in `monetization-strategies.md` with a plan tied to
what actually exists in this repo today. Nothing here assumes new product lines —
every item below is something already built, half-built, or sitting in `assets/`.

---

## 0. What is actually sellable right now

| Asset | Where | State | Sellable as |
|---|---|---|---|
| LED panel 42×42, METAL / WOOD / HORNED frame | `panels.html` | **Shipping** — 659 USDT, made to order | Physical object |
| 6 animation loops (CAPTURE_01–06) | `assets/led-panels/video/` | Done | Panel content, and as standalone loop files |
| In-situ capture of the real panel | `assets/led-panels/video/panel-in-situ.mp4` | Done | Proof shot — the single best conversion asset on the site |
| MYSTRA 01 robotics prototype | `lab/` | **In development** — folders are placeholders | Build logs, whitepaper, datasets |
| PixelTap | `apps/PixelTap.apk` + cover art | Android build only | Game — itch.io now, Steam later |
| Pixel editor / lab builder | `demos/pixel-editor.html`, `lab/builder*.html` | Working tools | Tool, or a subscriber perk |
| Gallery / polaroids / bandanas / market / stream | hidden from nav | Archived, needs restoration | Back-catalogue, subscriber content |
| Agent pet / tamagotchi | `pet/`, `js/agent-pet-*.js` | Working | Site feature — retention, not revenue |

The honest read: **one product ships (panels), one product is a prototype
(MYSTRA), one product is finished but unpublished (PixelTap), and a large
back-catalogue is offline.** The plan is ordered around that.

---

## 1. The four layers

Money should arrive through four channels with different sizes and different jobs.

```
  LAYER          CHANNEL                  TICKET      JOB
  ──────────────────────────────────────────────────────────────────────
  DIRECT         panels.html (USDT)       $659        pays for parts
                 card checkout            $659        removes the crypto wall
  RECURRING      Patreon / Boosty         $3–$50/mo   pays for the time between panels
  MICRO          Ko-fi                    $3–$20      converts a passing viewer
  CATALOGUE      itch.io / Gumroad        $0–$15      sells what is already made
  PLATFORM       Steam                    $5–$15      the only one with its own audience
```

All of these are wired to a single config file: **`js/support-links.js`**.
Paste a URL there and the channel appears on `support.html`, `panels.html` and
in the MYSTRA notice. Channels with an empty URL are hidden everywhere, so
nothing half-finished ever ships.

---

## 2. Patreon — https://www.patreon.com/c/Yuga1000

The account exists but is dormant. It is the highest-leverage thing to fix,
because it is the only channel that produces **predictable** money, and because
panel buyers are a tiny audience while panel *watchers* are a large one.

### Why it fits this project specifically
Panels are a $659 object — most people who like the work will never buy one.
Patreon is the price point for those people. And the work already generates the
content a tier needs: every panel build produces footage, every animation
produces frames, every MYSTRA step produces a log.

### Proposed tiers

| Tier | Price | What the patron gets | Cost to produce |
|---|---|---|---|
| **SIGNAL** | $3/mo | Monthly post: the raw captures from whatever got built that month. Access to the archive as pages come back online. | Zero — you already shoot this |
| **PANEL** | $10/mo | Everything above + the animation loops as downloadable files (MP4 + frame sequence) for personal screens. Vote on the next loop in the capture set. | Low — export what exists |
| **LAB** | $25/mo | Everything above + MYSTRA build logs, hex data, the whitepaper drafts as they are written, datasets. Name in the site credits. | Low — this is the documentation you owe the project anyway |
| **OBJECT** | $50/mo | Everything above + $50/mo accrues as credit against a panel order. Twelve months = $600 off a $659 panel. | Real cost, but it converts subscribers into buyers |

The OBJECT tier is the important one: it turns Patreon from a tip jar into a
**layaway plan for the panels**, which is the actual product.

### Starting condition
Do not launch tiers into an empty page. Before announcing: three posts up
(one per tier level, so each tier visibly has something behind it), the banner
and avatar set from the panel in-situ frames, and the about text pointing back at
`ghostline.live/support.html`.

---

## 3. Crowdfunding MYSTRA

MYSTRA is the natural crowdfunding object — a physical robot being rebuilt in
the open. But **it is not ready for a campaign**, and launching early is how
these fail.

### What a Kickstarter/Boomstarter campaign needs that does not exist yet
- A working prototype on video doing something (currently: a render and a rotating GIF)
- A bill of materials and a real unit cost
- A delivery date you would bet money on
- 500–2000 people who already follow the project and will convert on day one

### Therefore: two stages

**Stage 1 — Patreon goals (now).** Patreon has built-in funding goals. Use them
as a soft crowdfund with no delivery obligation:
- `$200/mo` → parts budget for the next MYSTRA subsystem
- `$500/mo` → MYSTRA files published publicly instead of tier-locked
- `$1000/mo` → full-time on the lab

This builds the audience a real campaign needs, and costs nothing if it misses.

**Stage 2 — Kickstarter (when Stage 1 clears ~$500/mo and the prototype walks).**
Not before. A failed campaign is worse than no campaign because the page stays
up forever.

### Meanwhile: crowdfund the panels instead
Panels are already made-to-order, which is structurally identical to
crowdfunding — money up front, object later. A **limited numbered run**
("PANEL_42 — edition of 10, each with a different loop") is a campaign you can
run today on the existing checkout, with no platform and no fees.

---

## 4. Steam and the game platforms

`apps/PixelTap.apk` is a finished Android game with cover art, and it is
published nowhere. That is free money sitting still.

| Platform | Cost to enter | Effort | Realistic outcome | Verdict |
|---|---|---|---|---|
| **itch.io** | Free | Hours — upload APK + a WebGL/HTML build, write a page | Small revenue, but a live storefront link today, and a place to sell art packs too | **Do first** |
| **Steam** | $100 per app (Steam Direct, recoupable) | Weeks — needs a **desktop build**, store page, capsule art, trailer, 30-day review | Real audience, real discovery | **Do second** — blocked on the desktop build |
| **Google Play** | $25 one-time | Days — the APK exists; needs store listing, privacy policy, content rating | Direct fit for what already exists | **Do in parallel with itch** |
| **Epic / GOG** | Curated, invite-ish | High | Not worth it at this stage | Skip |

### The Steam blocker, stated plainly
Steam does not take APKs. PixelTap needs a Windows (and ideally Linux) build
before a Steam page is possible. Whether that is a week or a month depends on
what it was built in — that is the first thing to check, and it decides whether
Steam is a Q1 item or a "someday" item.

### The other Steam angle
The panel loops and the pixel-art pipeline are sellable on **Steam Workshop-adjacent**
stores as wallpaper content — **Wallpaper Engine** (Steam, huge install base) accepts
animated wallpapers, and the CAPTURE_01–06 loops are already exactly that format.
That is a Steam presence with no game build required. Lowest effort / highest
fit of anything in this table.

---

## 5. Every other platform worth touching

**Do these (low effort, real fit):**
- **Boosty** — the RU-facing Patreon. Same tiers, same posts, cross-post. Necessary because Patreon rejects a lot of RU cards.
- **Ko-fi** — one-off tips, no subscription friction. Two minutes to set up.
- **Gumroad / Lemon Squeezy** — sells the animation loops and art packs as files, and gives you a **card checkout for panels**, which is the single biggest conversion fix on the site (right now a buyer must already hold USDT on TRON).
- **Displate / Redbubble** — the pixel art as metal prints, zero inventory. Not much money, but it is the same art with no extra work.

**Consider later:**
- **Zora** — already linked in the site's social panel. Mint the loops as editions. Fits the existing crypto-native audience, near-zero setup.
- **Twitch/YouTube** — `stream.html` and `stream_server/` already exist for a 24/7 generative stream. Revenue is thin until the audience is there, but it is a *discovery* channel that feeds Patreon.
- **Etsy** — panels would sell there, but the fee structure and shipping rules on a $659 made-to-order electronic object are painful. Only if direct sales stall.

**Skip:**
- NFT drops as a primary strategy. The old doc leans on this; the market no longer supports it as a base layer. Zora as a side channel, fine. As the plan, no.
- API-as-a-service, Discord bots, texture-pack farms. All real ideas, all require building a second business. There is one person here.

---

## 6. Sequence

**Next 30 days — remove friction, start the recurring layer**
1. Fill `js/support-links.js`: Boosty, Ko-fi, and a Gumroad/Lemon Squeezy card link. *(Patreon and USDT are already live.)*
2. Patreon: write the four tiers above, post three backlog posts, set the banner from the in-situ capture, announce once on every social already in `index.html`.
3. itch.io page for PixelTap. Upload the APK, write the page.
4. Set Patreon goals at $200 / $500 / $1000.

**30–90 days — publish the catalogue**
5. Google Play listing for PixelTap.
6. Wallpaper Engine submission of the six capture loops.
7. Gumroad: the loop pack as a paid download; the same files free at the PANEL tier.
8. Bring `gallery.html` / `polaroids.html` back online — they are the proof the archive is real.
9. Run the limited numbered panel edition.

**90+ days — the platform layer**
10. Decide the PixelTap desktop build. If feasible: Steam Direct, store page, launch.
11. Re-assess MYSTRA against the Stage 2 checklist in §3. Campaign only if it clears.

---

## 7. Where the links live on the site

Already wired as of this change:

| Surface | What is there |
|---|---|
| `index.html` | SUPPORT button in the nav grid; Patreon in the SOCIAL panel |
| `support.html` | The money hub — all channels, USDT wallet + QR, and what the money unlocks |
| `panels.html` | SUPPORT in the topbar; REAL OBJECT in-situ section; SUPPORT THE LINE strip above the footer |
| `lab/` (MYSTRA) | RECONSTRUCTION IN PROGRESS notice above the folders, with PATREON and USDT buttons; SUPPORT in the topbar |
| `js/support-links.js` | **The one file to edit.** Every surface above reads it. |

Rule to keep: a channel with an empty `url` is hidden everywhere. Never ship a
dead payment link — a broken checkout costs more than a missing one.
