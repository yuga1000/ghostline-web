# Agent Pet States - Visual Reference

Quick visual guide to understand what the pet looks like in each state.

---

## State 1: Sleeping (Initial State)

```
Pet Status:
  MOOD: Sleeping... ZZZ
  STAGE: 1 / 4

Visual:
  Color: GREEN (#00ff00)
  Legs: Hidden (opacity: 0)
  Eyes: Thin slits (1px high)
  Animation: Breathing (outer pixels pulse)
  Sleep pixels: "Z Z Z" floating above

Pet appears:
  ░░▓▓▓▓▓▓▓▓░░
  ░░▓░▓▓▓▓▓░░░
  ░░▓▓▓▓▓▓▓▓░░
  ░░▓▓▓▓▓▓▓▓░░
  ░░░░░░░░░░░░ (no legs visible)

  Z   Z   Z
```

---

## State 2: Awake & Active (Logs Arriving)

```
Pet Status:
  MOOD: Watching logs...
  STAGE: 1-4 (depending on log count)

Visual:
  Color: ORANGE-YELLOW (#ffbb00)
  Legs: Visible (2-5 pixels tall depending on stage)
  Eyes: Full open (4px tall)
  Animation: Idle breathing + random animations

Stage 1 (0-9 logs):
  ░░▓▓▓▓▓▓▓▓░░
  ░▓▓▓●▓▓▓●▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░
  ░░▓▓░░░░▓▓░░ (legs: 2px tall)

Stage 2 (10-24 logs):
  ░░▓▓▓▓▓▓▓▓░░
  ░▓▓▓●▓▓▓●▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░
  ░░▓▓░░░░▓▓░░ (legs: 3px tall)
  ░░▓▓░░░░▓▓░░

Stage 3 (25-49 logs):
  ░░▓▓▓▓▓▓▓▓░░
  ░▓▓▓●▓▓▓●▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░
  ░░▓▓░░░░▓▓░░ (legs: 4px tall)
  ░░▓▓░░░░▓▓░░
  ░░▓▓░░░░▓▓░░

Stage 4 (50+ logs):
  ▓░░▓▓▓▓▓▓▓▓░░▓
  ░▓░▓●▓▓▓▓▓●▓░▓ (extra eyes: ●)
  ░░▓▓▓●▓▓▓●▓▓░░ (main eyes: ●)
  ░░▓▓▓▓▓▓▓▓▓▓░░
  ░░░▓▓░░░░▓▓░░░ (legs: 5px tall)
  ░░░▓▓░░░░▓▓░░░
  ░░░▓▓░░░░▓▓░░░
  ░░░▓▓░░░░▓▓░░░
  ░░░▓▓░░░░▓▓░░░
  (extra arms: ▓)
```

---

## State 3: Walking Animation

```
Pet Status:
  MOOD: Walking around
  STAGE: Current stage maintained

Visual:
  Same as active state
  Animation: Legs alternate stepping

Frame 1:          Frame 2:
  ░░▓▓▓▓▓▓▓▓░░    ░░▓▓▓▓▓▓▓▓░░
  ░▓▓▓●▓▓▓●▓▓░    ░▓▓▓●▓▓▓●▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░    ░▓▓▓▓▓▓▓▓▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░    ░▓▓▓▓▓▓▓▓▓▓░
  ░░▓▓░░░░▓▓░░    ░░░░▓▓▓▓░░░
  (legs 1&4 down)  (legs 2&3 down)
```

---

## State 4: Waving Animation

```
Pet Status:
  MOOD: Celebrating!
  STAGE: Current stage maintained

Visual:
  Same as active state
  Animation: Arms move up and down

Frame 1:          Frame 2:
  ░░▓▓▓▓▓▓▓▓░░    ▓░▓▓▓▓▓▓▓▓░▓
  ░▓▓▓●▓▓▓●▓▓░    ░░▓▓●▓▓▓●▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░    ░▓▓▓▓▓▓▓▓▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░    ░▓▓▓▓▓▓▓▓▓▓░
  (arms down)      (arms up)
```

---

## State 5: Dancing Animation

```
Pet Status:
  MOOD: Dancing!
  STAGE: Current stage maintained

Visual:
  Same as active state
  Animation: Body sways, legs move side to side

Frame 1:          Frame 2:
  ░░▓▓▓▓▓▓▓▓░░    ░░▓▓▓▓▓▓▓▓░░
  ░▓▓▓●▓▓▓●▓▓░    ░▓▓▓●▓▓▓●▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░    ░▓▓▓▓▓▓▓▓▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░    ░▓▓▓▓▓▓▓▓▓▓░
  ░░▓▓░░░░▓▓░░    ░░░▓▓░░▓▓░░░
  (legs centered)  (legs shifted right)
```

---

## State 6: Playing Animation

```
Pet Status:
  MOOD: Playing with toy
  STAGE: Current stage maintained

Visual:
  Same as active state
  Pet on back, legs up
  Toy pixel bouncing above

       ⟡          (toy bouncing)
       |
  ░░▓▓▓▓▓▓▓▓░░
  ░▓▓▓●▓▓▓●▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░
  ░░▓▓░░░░▓▓░░ (legs wiggling)
```

---

## State 7: Blinking Animation

```
Pet Status:
  MOOD: Thinking...
  STAGE: Current stage maintained

Visual:
  Same as active state
  Eyes close briefly

Frame 1:          Frame 2:
  ░░▓▓▓▓▓▓▓▓░░    ░░▓▓▓▓▓▓▓▓░░
  ░▓▓▓●▓▓▓●▓▓░    ░▓▓▓─▓▓▓─▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░    ░▓▓▓▓▓▓▓▓▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░    ░▓▓▓▓▓▓▓▓▓▓░
  (eyes open: ●)   (eyes closed: ─)
```

---

## State 8: Resting (Countdown Active) - FLOWER MODE

```
Pet Status:
  MOOD: Blooming... 🌸
  STAGE: 4 (BLOOM)
  REST: 25:30 (countdown timer)

Visual:
  Color: GREEN (#00ff00)
  Legs: MAXIMUM HEIGHT (5 pixels = 20px)
  Eyes: Thin slits (sleeping)
  Extra arms: VISIBLE
  Extra eyes: VISIBLE

▓░░▓░▓▓▓▓▓▓▓▓░▓░░▓ (extra arms wide)
░░░▓░▓●▓▓▓▓▓●▓░▓░░ (extra eyes: ●)
░░░░░▓▓▓─▓▓▓─▓▓░░░ (main eyes closed: ─)
░░░░░▓▓▓▓▓▓▓▓▓▓░░░
░░░░░░▓▓░░░░▓▓░░░░ (legs: 5px tall)
░░░░░░▓▓░░░░▓▓░░░░
░░░░░░▓▓░░░░▓▓░░░░
░░░░░░▓▓░░░░▓▓░░░░
░░░░░░▓▓░░░░▓▓░░░░

Looks like a flower:
  - Tall "stem" (long legs)
  - Wide "petals" (spread arms)
  - "Antenna" (extra eyes at top)
  - Green "plant" color
```

**KEY FEATURE**: This state only appears during countdown timer!

---

## State 9: Excited (Cyan) - Special Color

```
Pet Status:
  MOOD: Excited! (temporary)
  STAGE: Current stage maintained

Visual:
  Color: CYAN (#00ffff) instead of orange
  Triggered by:
    - Stage upgrade
    - Image generation complete
    - Random wake-up (15% chance)
  Lasts 2-3 seconds then returns to orange

  ░░▓▓▓▓▓▓▓▓░░
  ░▓▓▓●▓▓▓●▓▓░ (cyan color)
  ░▓▓▓▓▓▓▓▓▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░
```

---

## State 10: Happy (Pink) - Special Color

```
Pet Status:
  MOOD: Happy! (temporary)
  STAGE: Current stage maintained

Visual:
  Color: PINK/MAGENTA (#ff00ff) instead of orange
  Triggered by:
    - Stage upgrade (alternates with cyan)
    - Random wake-up (15% chance)
  Lasts 2-3 seconds then returns to orange

  ░░▓▓▓▓▓▓▓▓░░
  ░▓▓▓●▓▓▓●▓▓░ (pink color)
  ░▓▓▓▓▓▓▓▓▓▓░
  ░▓▓▓▓▓▓▓▓▓▓░
```

---

## Image Preview Overlay

```
┌─────────────────────────────────┐
│  [AGENT_PET]              ┌────┐│
│                           │NEW!││
│                           │IMG ││
│      ░░▓▓▓▓▓▓▓▓░░        │────││
│      ░▓▓▓●▓▓▓●▓▓░        │████││
│      ░▓▓▓▓▓▓▓▓▓▓░        │████││
│      ░▓▓▓▓▓▓▓▓▓▓░        │████││
│      ░░▓▓░░░░▓▓░░        └────┘│
│                         (image  │
│  MOOD: Watching logs...  preview)
│  STAGE: 2 / 4                   │
└─────────────────────────────────┘

Image preview appears in top-right corner:
  - Green border (1px solid)
  - Label: "NEW IMAGE!"
  - Shows generated image
  - Fades in discretely
  - Stays 5 minutes
```

---

## Countdown Timer Display

```
┌─────────────────────────────────┐
│  MOOD: Blooming... 🌸           │
│  STAGE: 4 (BLOOM)               │
│  REST: 25:30  ← COUNTDOWN HERE  │
│        ^^^^^ (yellow color)     │
└─────────────────────────────────┘

Format:
  REST: MM:SS

Examples:
  REST: 45:00  (45 minutes)
  REST: 25:30  (25 min, 30 sec)
  REST: 00:45  (45 seconds)
  REST: 00:00  (about to resume)

Updates every second.
Hidden when agent is active.
```

---

## Stage Upgrade Animation

```
Stage 1 → Stage 2:
  Pet blinks rapidly (6 times)
  Legs grow from 2px to 3px
  Color changes to cyan or pink briefly
  Message: "Growing up! Stage 2"

Stage 2 → Stage 3:
  Pet blinks rapidly (6 times)
  Legs grow from 3px to 4px
  Color changes to pink or cyan briefly
  Message: "Getting bigger! Stage 3"

Stage 3 → Stage 4:
  Pet blinks rapidly (6 times)
  Legs grow from 4px to 5px
  Extra arms appear (slide in)
  Extra eyes appear (fade in)
  Color changes to cyan or pink briefly
  Message: "Fully grown! Stage 4"
  Pet dances for 4 seconds
```

---

## Progress Bar Indicator

```
Below pet (always visible):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░

Stage 1 → 2: 0-10 logs (0-100%)
Stage 2 → 3: 10-25 logs (0-100%)
Stage 3 → 4: 25-50 logs (0-100%)
Stage 4: Full bar (100%)

Bar glows when close to next stage:
  5 logs remaining: Subtle glow
  1 log remaining: Strong glow
```

---

## Color Legend

```
GREEN (#00ff00):
  - Sleeping state
  - Flower/bloom mode during rest
  - "Plant" aesthetic

ORANGE-YELLOW (#ffbb00):
  - Active/awake state
  - Normal working mode
  - Default color when logs arrive

CYAN (#00ffff):
  - Excited/special moment
  - Stage upgrades
  - Image generation complete
  - Temporary (2-3 seconds)

PINK/MAGENTA (#ff00ff):
  - Happy/celebratory
  - Stage upgrades (alternates with cyan)
  - Temporary (2-3 seconds)

YELLOW (#ffaa00):
  - Countdown timer text only
  - Not used for pet body
```

---

## Falling Stars Effect

```
Sleeping Mode:
  Stars fall diagonally every 3-7 seconds

  ⭐ ←starts here
   \
    \
     ⭐ ←moves down-left
      \
       ⭐ ←fades out

Active Mode:
  Occasional stars (30% chance every 10-20 sec)
  Less frequent than sleeping mode

  ★ ←single star appears
  \
   ★ ←falls diagonally
```

---

## Sleep Pixels (ZZZ)

```
Sleeping Mode Only:

Z Z Z  ←float upward
 | | |
Z Z Z  ←appear sequentially
 | | |
 Pet   ←sleeping below

3 pixels total
Animate in sequence:
  Pixel 1: Appears, floats up, fades
  Pixel 2: Appears (1s delay), floats up, fades
  Pixel 3: Appears (2s delay), floats up, fades
  (repeat)
```

---

## Comparison: Normal vs Flower Mode

```
NORMAL (Stage 4):          FLOWER MODE (Rest):

▓░░▓▓▓▓▓▓▓▓░▓              ▓░░▓░▓▓▓▓▓▓▓▓░▓░░▓
░▓░▓●▓▓▓▓▓●▓░▓             ░░░▓░▓●▓▓▓▓▓●▓░▓░░
░░▓▓▓●▓▓▓●▓▓░░             ░░░░░▓▓▓─▓▓▓─▓▓░░░
░░▓▓▓▓▓▓▓▓▓▓░░             ░░░░░▓▓▓▓▓▓▓▓▓▓░░░
░░░▓▓░░░░▓▓░░░             ░░░░░░▓▓░░░░▓▓░░░░
                            ░░░░░░▓▓░░░░▓▓░░░░
Color: ORANGE              Color: GREEN
Eyes: OPEN (●)             Eyes: CLOSED (─)
Arms: Normal position      Arms: SPREAD WIDE
                            Legs: SAME HEIGHT
                            Looks like: FLOWER
```

The key difference: Same stage 4 structure, but:
- Green color (sleeping)
- Eyes closed
- Arms spread wider
- Gives "blooming flower" impression

---

## Quick State Summary

| State | Color | Legs | Eyes | Extra Features | Mood Text |
|-------|-------|------|------|----------------|-----------|
| Sleeping | Green | Hidden | Slits | ZZZ pixels, stars | Sleeping... ZZZ |
| Active (Stage 1) | Orange | 2px | Open | - | Watching logs... |
| Active (Stage 2) | Orange | 3px | Open | - | Watching logs... |
| Active (Stage 3) | Orange | 4px | Open | - | Watching logs... |
| Active (Stage 4) | Orange | 5px | Open | Extra arms/eyes | Watching logs... |
| Walking | Orange | Animate | Open | - | Walking around |
| Waving | Orange | Normal | Open | Arms up | Celebrating! |
| Dancing | Orange | Sway | Open | - | Dancing! |
| Playing | Orange | Wiggle | Open | Toy pixel | Playing with toy |
| Blinking | Orange | Normal | Close | - | Thinking... |
| Flower (Rest) | Green | 5px | Slits | Arms spread, stars | Blooming... 🌸 |
| Excited | Cyan | Current | Open | - | [varies] |
| Happy | Pink | Current | Open | - | [varies] |

---

## Animation Timing Reference

```
Idle breathing:     2.25s cycle (continuous)
Walking legs:       1.6s cycle (alternating)
Dancing sway:       1.5s cycle (side to side)
Waving arms:        1.2s cycle (up and down)
Eye blink:          3s cycle (brief close)
Playing wiggle:     1.2s cycle (legs wiggle)
Toy bounce:         1.2s cycle (sync with wiggle)
Sleep breathing:    3s cycle (pulse)
Star fall:          2s animation (diagonal)
Sleep pixels:       3s cycle (sequential float)

Idle loop check:    5-10s random interval
Animation duration: 2-3s typical
Stage upgrade:      0.2s blink × 6 = 1.2s
Image display:      5 minutes (300s)
Countdown update:   1s interval
```

---

## State Transitions

```
SLEEPING
   ↓ (logs arrive)
AWAKE (Stage 1-4)
   ↓ (no logs for 10s)
SLEEPING

AWAKE
   ↓ ("Cooldown period" detected)
FLOWER MODE + COUNTDOWN
   ↓ (countdown reaches 0)
AWAKE (when logs resume)

STAGE 1 (0-9 logs)
   ↓ (10th log)
STAGE 2 (blink animation)
   ↓ (25th log)
STAGE 3 (blink animation)
   ↓ (50th log)
STAGE 4 (blink animation + dance)

IDLE
   ↓ (random 30%)
BLINKING (2s)
   ↓
IDLE
   ↓ (random 20%)
WAVING (2.5s)
   ↓
IDLE
   ↓ (random 15%)
WALKING (3s)
   ↓
IDLE
```

---

## Visual Size Comparison

```
Stage 1:  Height = Body(6px) + Legs(2px) = 8px tall
Stage 2:  Height = Body(6px) + Legs(3px) = 9px tall
Stage 3:  Height = Body(6px) + Legs(4px) = 10px tall
Stage 4:  Height = Body(6px) + Legs(5px) = 11px tall
Flower:   Height = Body(6px) + Legs(5px) = 11px tall
          Width = Body(12px) + Extra Arms(2px×2) = 16px wide

Pet body: 12 pixels wide × 6 pixels tall (constant)
Legs: 4 pixels wide × 2-5 pixels tall (grows with stage)
Arms: 1 pixel wide × 1 pixel tall each
Extra arms (stage 4): 1 pixel wide × 1 pixel tall each
Eyes: 1 pixel wide × 1 pixel tall each (or 1px high when sleeping)
Extra eyes (stage 4): 1 pixel wide × 1 pixel tall each
```

---

This visual reference shows exactly what the pet looks like in each state. Use this to verify the pet is working correctly during testing!
