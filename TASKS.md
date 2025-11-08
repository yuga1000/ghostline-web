# GHOSTLINE - Task List (Session 2025-11-07)

## ✅ DONE & TESTED
1. **Убрать задержку загрузки логов** (15 секунд → мгновенно)
   - Status: ✅ Working
   - File: stream.html (prefetch логов)

## ❌ NOT WORKING
2. **Цветочка появляется** - flower mode detection
   - Status: ❌ NOT WORKING (never appeared!)
   - File: stream.html:2892-2907 (detectRestPeriod with progress bar pattern)
   - Need: Debug why flower mode doesn't trigger

3. **Паук появляется** - spider web system
   - Status: ✅ Working (NOT reverted!)
   - File: stream.html:2600 (checkStreamSpiderMode every 30s)
   - Works: Spider appears during cooldown

4. **Пет прыгает после завершения генерации**
   - Status: ✅ Working (NOT reverted!)
   - File: stream.html:1403-1413
   - Works: excited-bounce on "GLVSF Image"

## 🚫 CANCELLED
5. **Увеличить частоту анимаций пета**
   - Status: 🚫 ОТМЕНЕНО - User wants VARIETY not hyperactivity
   - Note: "ultra active pet" was WRONG approach
   - Real need: Больше разнообразия (flowers, spider, different modes) - already implemented!

## ❌ NOT STARTED - Stream/UI
6. **Коричневая крыша** - roof appears brown on stream
   - Status: ❌ Not touched
   - File: stream.html (CSS/pixel colors for roof)
   - Need: Find and fix roof color

7. **Крышка логов без заглушки**
   - Status: ❌ Optional (User said "ладно")
   - Need: Add placeholder when no logs

## ❌ NOT STARTED - Agent/Python
8. **ASCII cooldown logs** - красивые терминальные логи
   - Status: ❌ Not started
   - File: art_agent_unified.py
   - Need: Add ASCII art cooldown messages

9. **Агент не просыпается после сна компа**
   - Status: ❌ Not started
   - File: art_agent_unified.py
   - Need:
     - Add macOS caffeinate to prevent sleep
     - Add clean shutdown (no background processes)

## ❌ NOT STARTED - Sales/Content
10. **Redbubble запуск** - PNG с прозрачным фоном
    - Status: ❌ Not started
    - Need: Prepare designs for upload

11. **Конвертировать дизайны агента в PNG** (прозрачный фон)
    - Status: ❌ Not started
    - Need: Convert existing art to PNG with transparency

12. **Game Assets Pack** на itch.io
    - Status: ❌ Not started
    - Need: Package assets for itch.io

13. **Gumroad wallpapers pack**
    - Status: ❌ Not started
    - Need: Create wallpaper pack

---

## 🔥 CRITICAL METHODOLOGY (from user preferences)

**WORK STEP-BY-STEP:**
1. ONE task at a time
2. Test locally BEFORE deploy
3. Deploy to Railway
4. Wait for user confirmation ✓
5. THEN next task

**NEVER:**
- ❌ Batch multiple changes
- ❌ Deploy without local test
- ❌ Move to next task without confirmation

---

## 📝 NOTES

### What went wrong:
- Pet sleep detection: Made 3 changes at once, broke status indicator
- Had to REVERT all changes (commits e90f7f6, 11a2581, 0f9f9fa)
- Back to stable version: 55d1f10

### Current version:
- Commit: 66793a4 (Revert pet sleep changes)
- Railway: Deployed stable version
- Pet: ✅ Sleeping correctly when agent offline
