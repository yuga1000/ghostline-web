# Pixel Pet Tamagotchi - User Guide

## 🎮 What Was Added

Your pixel pet on `ghostline.live/stream.html` is now a **full tamagotchi**!

### Stats System
- **Hunger** (H): 0-100 - Decreases 3 per minute, dies at 0
- **Energy** (E): 0-100 - Decreases 1.2 per minute
- **Health** (HP): 0-100 - Decreases when hungry/unhappy, dies at 0
- **Happiness**: Affects mood display, decreases 1.8 per minute
- **Age**: Tracked in minutes

### Controls (4 Buttons)

| Button | Effect | Notes |
|--------|--------|-------|
| 🍕 Feed | +20 Hunger, +5 Happy | Basic care |
| 🎮 Play | +15 Happy, -10 Energy | Makes pet excited |
| 😴 Sleep | +30 Energy, +5 Health | 2 second animation |
| 💊 Heal | +25 Health, -5 Hunger | Medicine costs hunger |

## 🔄 How It Works

### Automatic Degradation
Stats decrease over time even when you're away:
```
Every minute:
- Hunger: -3
- Happiness: -1.8
- Energy: -1.2
- Health: -6 (only if hungry or unhappy)
```

### Log Integration
Your pet reacts to logs AND gets benefits:
- ✅ Success logs: +2 happiness, -1 energy
- ❌ Error logs: -1 happiness
- ℹ️ Other logs: +0.5 happiness

This means **active agent = happy pet!**

### Death & Revival
If Hunger or Health reaches 0:
- Pet shows `DEAD 💀` mood
- Becomes almost transparent
- Shows "SYSTEM_FAILURE" bubble
- **Auto-revives after 2 minutes**
- Or click any button to revive instantly

Revival resets stats:
```javascript
{
  hunger: 80,
  happiness: 80,
  health: 100,
  energy: 100,
  age: 0
}
```

### Persistence
State is saved to `localStorage` every 10 seconds:
- Survives page refresh
- Calculates time passed while away
- Applies degradation retroactively

**Example**: Leave for 30 minutes → Return to find:
- Hunger: 100 → 10 (90 decrease)
- Happiness: 100 → 46 (54 decrease)
- Might be dead if you were gone too long!

## 🎯 Gameplay Loop

1. **Check stats** (displayed as `H:95 E:87 HP:100 Age:15m`)
2. **Feed/Play/Heal** when stats get low
3. **Watch logs** - pet gets happy from activity
4. **Don't neglect** - pet dies if abandoned

### Optimal Care Schedule
- Feed every ~30 minutes (before hunger < 30)
- Play every hour (keeps happiness > 80)
- Sleep when energy < 40
- Heal only when health < 75

## 🧪 Advanced Features

### Mood System
Mood changes based on happiness:
- 80-100: `VERY HAPPY`
- 60-80: `HAPPY`
- 40-60: `OK`
- 20-40: `SAD`
- 0-20: `DEPRESSED`

### Health Mechanics
Health is **secondary stat**:
- Degrades only when neglected (hunger/happiness < 30)
- Slowly recovers when well-cared-for
- Critical for survival (death at 0)

### Console Commands
Open browser console and try:
```javascript
// Check stats
window.petModule.getStats()

// Manual actions
window.petModule.feed()
window.petModule.play()
window.petModule.sleep()
window.petModule.heal()

// Force revive
window.petModule.revive()
```

## 📊 Stats Balance

Designed for **casual care** (~3-4 times per day):

| Scenario | Result |
|----------|--------|
| Active monitoring (agent running) | Pet stays happy naturally |
| Check 3x per day | Feed + play each time = survives |
| Forget for 6+ hours | Likely dead, auto-revives |
| Forget for 1 day | Definitely dead, will revive |

Death is **not punishing** - just a reminder to check in!

## 🎨 Visual Feedback

- **Buttons light up** when stat is low (future feature)
- **Pet animations** match mood
- **Speech bubbles** show actions:
  - `> FOOD_RECEIVED`
  - `> PLAY_MODE`
  - `> SLEEP_MODE`
  - `> HEAL_APPLIED`
  - `> SYSTEM_FAILURE` (death)
  - `> REBOOT_SUCCESS` (revival)

## 🚀 Future Improvements (Optional)

Ideas for v2:
- [ ] Evolution stages (baby → adult → elder)
- [ ] Mini-games for happiness
- [ ] Achievements system
- [ ] Multiple pets
- [ ] Pet shop (cosmetics)
- [ ] Social features (visit friends' pets)
- [ ] Weather affects mood
- [ ] Day/night cycle

## 🐛 Troubleshooting

**Stats not updating?**
- Check browser console for errors
- Refresh page
- Clear localStorage: `localStorage.removeItem('ghostline-pet-stats')`

**Buttons not working?**
- Check console: `window.petModule` should exist
- Make sure pet.js loaded correctly

**Pet keeps dying?**
- It's working as intended!
- Feed more frequently
- Degradation rate: 3/min hunger is intentional

## 🎓 Design Philosophy

This tamagotchi is **intentionally forgiving**:
- Auto-revival (no permanent death)
- Stats visible (no guessing)
- Logs help naturally (active agent = happy pet)
- Death is feedback, not punishment

Goal: **Fun companion**, not stressful obligation!

---

Total code added: **~200 lines**
Dependencies: **0** (vanilla JS + localStorage)
Integration time: **15 minutes** (from scratch)

Enjoy your new pet! 🎮✨
