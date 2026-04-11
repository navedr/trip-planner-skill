# PWA Mobile Native UI — Konsta UI Hybrid

**Date**: 2026-04-11
**Status**: Draft

## Context

The Voyager travel planner PWA works on iPhone 15 Pro but doesn't feel like a native app. Issues:
- Horizontal and vertical scroll overflow on mobile
- Top navigation bar (desktop pattern) instead of bottom tab bar
- No iOS-style page transitions
- Chat panel is a floating button + partial bottom sheet, not a full-screen experience

**Goal**: Make the mobile PWA feel like a native iOS app — bottom tab bar, slide-in page transitions, full-screen chat sheet — while keeping the existing dark glassmorphism design language and all desktop behavior unchanged.

**Approach**: Konsta UI hybrid — use Konsta UI v5 (Tailwind-native, iOS components) for the mobile shell (tab bar, full-screen popup), framer-motion for page transitions (Konsta doesn't provide these), and the existing Radix UI + Tailwind stack for everything else.

## Architecture

### Responsive Shell

```
main.tsx
├── KonstaProvider (theme="ios", dark=true, touchRipple=false)
│   └── BrowserRouter → AuthProvider → App
│       ├── Guest routes (login/register) — unchanged
│       └── Protected routes → AppShell
│           ├── DESKTOP (lg+): TopNav + content + ChatPanel sidebar — UNCHANGED
│           └── MOBILE (<lg): content area + BottomTabBar (Konsta Tabbar)
│               └── Chat opens as Konsta Popup (full-screen)
```

- `KonstaProvider` wraps at root level in `main.tsx` — provides theme context only, no DOM changes
- Desktop layout is completely unchanged
- Mobile breakpoint: `lg` (1024px) — same as existing responsive breakpoints in the app

### Component Boundaries

| Component | Library | Scope |
|-----------|---------|-------|
| Bottom tab bar | Konsta UI `Tabbar` + `TabbarLink` | Mobile only |
| Full-screen chat | Konsta UI `Popup` + `Navbar` | Mobile only |
| Page transitions | framer-motion `AnimatePresence` | Mobile only |
| Navigation direction | React Router `useNavigationType()` | Shared hook |
| Top nav bar | Existing Tailwind + Lucide | Desktop only |
| Chat sidebar | Existing framer-motion `motion.aside` | Desktop only |
| All page content | Existing Radix UI + Tailwind | Both |

## Bottom Tab Bar

New file: `web/src/components/layout/BottomTabBar.tsx`

Uses Konsta UI's `Tabbar` and `TabbarLink` components. Fixed at the bottom with safe-area padding via Konsta's built-in `pb-safe` class.

**4 tabs**: Trips (Map icon) | Search (Search icon) | Chat (MessageSquare icon) | Settings (Settings icon)

**Routing**: Wired to React Router's `useNavigate()` and `useLocation()` for active state. Trips, Search, and Settings tabs navigate to their respective routes. The Chat tab doesn't navigate — it calls `openPanel()` from `ChatContext` to open the Popup.

**Active state for Chat tab**: Always `false` — chat is an overlay, not a route. The tab that was active before opening chat stays highlighted.

**Content padding**: Main content area on mobile gets bottom padding equal to `var(--k-tabbar-height) + env(safe-area-inset-bottom)` to prevent tab bar overlap.

**Visibility**: `lg:hidden` — only shown on mobile. TopNav gets the inverse: `hidden lg:flex`.

## Page Transitions

### Direction Detection

New file: `web/src/hooks/useNavigationDirection.ts`

Uses React Router's `useNavigationType()`:
- `PUSH` → `'forward'` (slide from right)
- `POP` → `'back'` (slide from left)
- `REPLACE` → `'forward'` (no visual back-navigation for replacements)

### Transition Variants

Added to `web/src/lib/motion.ts`:

```ts
export const pageSlide = {
  enter: (direction: 'forward' | 'back') => ({
    x: direction === 'forward' ? '100%' : '-30%',
    opacity: direction === 'forward' ? 0 : 0.5,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: 'forward' | 'back') => ({
    x: direction === 'forward' ? '-30%' : '100%',
    opacity: direction === 'forward' ? 0.5 : 0,
  }),
};
```

Forward navigation: current page slides 30% left with fade, new page slides in from right.
Back navigation: current page slides out to right, previous page slides in from left.

### Integration in AppShell

The `<Outlet />` wrapper in `AppShell.tsx` uses a responsive approach:
- **Mobile**: `AnimatePresence` with `pageSlide` variants, keyed on `location.pathname`
- **Desktop**: Existing fade-up animation (unchanged)

Use a `useIsMobile()` hook (uses `window.matchMedia('(max-width: 1023px)')` with a resize listener, returns boolean) to choose the animation variant.

Transition timing: `duration: 0.3s`, easing: `[0.32, 0.72, 0, 1]` (iOS-like spring approximation).

## Chat Full-Screen Sheet

Modified file: `web/src/components/chat/ChatPanel.tsx`

### Mobile (replacing MobileSheet)

Replace the current partial bottom sheet and floating button with Konsta UI's `Popup`:

```tsx
<Popup opened={isPanelOpen} onBackdropClick={closePanel}>
  <Navbar
    title="Chat"
    left={<NavbarBackLink text="Close" onClick={closePanel} />}
  />
  <div className="flex flex-1 flex-col overflow-hidden">
    <MessageList />
    <ChatInput />
  </div>
</Popup>
```

- `Popup` slides up from bottom, covers full screen
- Konsta `Navbar` at top with iOS-style "Close" back link
- Existing `MessageList` and `ChatInput` render inside — no changes to those components
- `ChatHeader` is replaced by Konsta's `Navbar` on mobile (which provides iOS-native styling)

**Swipe-down dismiss**: Add a framer-motion `drag="y"` handle at the top of the Popup content. When drag distance exceeds 100px or velocity exceeds 500px/s downward, call `closePanel()`. The drag handle visual is a 40px × 4px rounded bar (same as existing MobileSheet).

### Desktop (unchanged)

The glassmorphism sidebar (`motion.aside`) and collapse button continue to work exactly as they do now.

### Floating button removal

The current floating `MessageSquare` button in the bottom-right corner (`MobileSheet`'s FAB) is removed on mobile — chat is now accessible from the bottom tab bar. The notification dot (gold indicator for active messages) moves to the Chat tab icon in the Tabbar.

## Theme Integration

### Konsta CSS Import

In `globals.css`:
```css
@import 'konsta/konsta.css';
```

This must come after the Tailwind import but before custom overrides.

### Color Overrides

Override Konsta's iOS dark theme variables to match the existing design system:

```css
.dark .k-ios,
.k-ios.k-dark {
  /* Surface colors → our dark navy/slate */
  --k-ios-bars-bg: hsla(222.2, 47.4%, 11.2%, 0.85);
  --k-ios-bars-border: hsl(217 25% 22%);
  --k-ios-content-bg: hsl(222.2, 47.4%, 11.2%);

  /* Active/inactive tab colors → our palette */
  --k-ios-tabbar-active: hsl(24 52% 50%);      /* terracotta primary */
  --k-ios-tabbar-inactive: hsl(215 20.2% 65.1%); /* muted-foreground */

  /* Popup background */
  --k-ios-popup-bg: hsl(222.2, 47.4%, 11.2%);
  --k-ios-navbar-bg: hsla(222.2, 47.4%, 11.2%, 0.85);
}

/* NOTE: The exact Konsta v5 CSS variable names above are based on research.
   Verify against node_modules/konsta/konsta.css after install — variable names
   may differ slightly (e.g., --k-color-ios-bars-bg-ios vs --k-ios-bars-bg).
   Inspect the installed CSS to confirm the correct override targets. */
```

### Glassmorphism on Tab Bar

Apply the existing `.glass` backdrop-filter to the tab bar for visual consistency:

```css
.k-ios .k-tabbar {
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
}
```

### Font Override

Konsta uses system fonts. Override via:
```css
.k-ios {
  --k-font-family: 'Outfit', 'Helvetica Neue', sans-serif;
}
```

## Scroll Fixes

### Root Cause

1. `TabsList` in `TripDetailPage.tsx:135` has `overflow-x-auto` — this creates a horizontal scrollable area that can leak if not contained
2. No `overflow-x: hidden` on the body in standalone PWA mode
3. Missing `viewport-fit=cover` for safe-area support

### Fixes

1. **`web/index.html`**: Update viewport meta tag:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
   ```

2. **`web/src/globals.css`**: Add root overflow control:
   ```css
   html, body {
     overflow-x: hidden;
     -webkit-overflow-scrolling: touch;
   }
   ```

3. **`web/src/components/layout/AppShell.tsx`**: Add `overflow-x-hidden` to the main content area:
   ```tsx
   <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
   ```

4. **Safe-area padding**: Konsta's components handle `env(safe-area-inset-*)` automatically via the `pb-safe`, `pt-safe` classes. The main content area on mobile gets matching padding.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `web/package.json` | Modify | Add `konsta` dependency |
| `web/src/main.tsx` | Modify | Wrap with `KonstaProvider` |
| `web/src/globals.css` | Modify | Import Konsta CSS, theme overrides, scroll fixes |
| `web/index.html` | Modify | Add `viewport-fit=cover` |
| `web/src/components/layout/AppShell.tsx` | Modify | Responsive shell: desktop unchanged, mobile gets page transitions + bottom padding |
| `web/src/components/layout/BottomTabBar.tsx` | **Create** | Konsta Tabbar with 4 tabs wired to React Router |
| `web/src/components/layout/TopNav.tsx` | Modify | Add `hidden lg:flex` to hide on mobile |
| `web/src/components/chat/ChatPanel.tsx` | Modify | Replace MobileSheet with Konsta Popup, remove floating button |
| `web/src/hooks/useNavigationDirection.ts` | **Create** | Detect PUSH/POP for transition direction |
| `web/src/hooks/useIsMobile.ts` | **Create** | Media query hook for responsive animation selection |
| `web/src/lib/motion.ts` | Modify | Add `pageSlide` direction-aware variants |

**No changes to**: Any page components (TripsPage, TripDetailPage, SearchPage, SettingsPage), trip-detail components, search components, UI primitives, or the desktop experience.

## Verification

1. **Install & build**: `cd web && npm install && npm run build` — no TypeScript or build errors
2. **Desktop regression**: Open at `lg+` width — TopNav, ChatPanel sidebar, all pages should work identically to before
3. **Mobile tab bar**: Open at `<lg` width — bottom tab bar appears, TopNav hidden, tabs navigate correctly
4. **Page transitions**: Navigate between tabs — pages slide from right. Hit browser back — pages slide from left.
5. **Chat popup**: Tap Chat tab — full-screen popup slides up. Swipe down on drag handle — popup dismisses. Chat messages and input work inside popup.
6. **Scroll fixes**: On iPhone 15 Pro (or simulator), no horizontal scroll on any page. TripDetailPage tab strip scrolls horizontally within its container without causing page-level horizontal scroll.
7. **PWA standalone**: Add to home screen on iOS — bottom tab bar respects safe area, no content behind the home indicator.
8. **Theme consistency**: Tab bar, popup navbar, and popup background match the dark glassmorphism aesthetic (same navy backgrounds, terracotta active color, glass blur effect).
