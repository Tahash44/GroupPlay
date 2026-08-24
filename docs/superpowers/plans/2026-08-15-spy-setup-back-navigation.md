# Spy Setup Back Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** حذف پیام تأیید بازگشت فقط از صفحه تنظیم اولیه بازی جاسوس و حفظ آن در صفحه‌های بعدی بازی.

**Architecture:** رفتار دکمه بازگشت در `SpyNewGamePage` مستقیماً به مسیر `/dashboard` متصل می‌شود. تست صفحه با بررسی ناوبری مستقیم و عدم فراخوانی `window.confirm` رفتار مورد انتظار را تثبیت می‌کند.

**Tech Stack:** React، TypeScript، React Router، Vitest، Testing Library، Vite.

## Global Constraints

- فقط صفحه تنظیم اولیه بازی جاسوس تغییر می‌کند.
- هشدار بازگشت صفحه‌های نقش، زمان‌سنج و رأی‌گیری حفظ می‌شود.
- هیچ تغییری در API یا وضعیت Backend ایجاد نمی‌شود.

---

### Task 1: Direct navigation from Spy setup

**Files:**
- Modify: `frontend/src/features/games/spy/pages/SpyNewGamePage.tsx`
- Test: `frontend/src/features/games/spy/pages/SpyNewGamePage.test.tsx`

**Interfaces:**
- Consumes: `useNavigate` و دکمه بازگشت موجود در صفحه تنظیم.
- Produces: رفتار بازگشت مستقیم به `/dashboard` بدون تأیید.

- [ ] **Step 1: Write the failing test**

در تست صفحه تنظیم، `window.confirm` را با یک تابع شکست‌خورده جایگزین کنید، دکمه دارای برچسب `بازگشت به فهرست بازی‌ها` را کلیک کنید و انتظار داشته باشید مسیر به `/dashboard` تغییر کند. این تست قبل از تغییر باید به دلیل فراخوانی تأیید شکست بخورد.

- [ ] **Step 2: Run test to verify it fails**

Run:

```text
cd frontend
npm run test -- src/features/games/spy/pages/SpyNewGamePage.test.tsx
```

Expected: تست جدید به دلیل فعال‌بودن `window.confirm` شکست بخورد.

- [ ] **Step 3: Write minimal implementation**

در `SpyNewGamePage.tsx` تابع `confirmExit` را حذف کنید و handler دکمه بازگشت را مستقیماً به این رفتار تغییر دهید:

```tsx
onClick={() => navigate('/dashboard')}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```text
cd frontend
npm run test -- src/features/games/spy/pages/SpyNewGamePage.test.tsx
npm run build
```

Expected: تست صفحه و ساخت تولیدی موفق باشند.

- [ ] **Step 5: Run the complete frontend verification**

Run:

```text
cd frontend
npm run test
npm run lint
npm run build
```

Expected: همه تست‌ها، lint و build بدون خطا موفق شوند و هشدار صفحه‌های دیگر بدون تغییر باقی بماند.
