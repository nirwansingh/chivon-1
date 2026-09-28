# Chivon CRM/ERP — Design Language

> **Rule**: Every component, page, and new screen MUST follow this document.  
> No hard-coded colors, fonts, spacing, or ad-hoc animations. Use the tokens below.  
> Every new screen includes: loading (skeleton), empty, error, and entrance-motion states.

---

## 1. Identity

**Precision engineering meets modern SaaS.** Not a default template.  
Dense, readable, fast. Enterprise confidence with polished motion.

---

## 2. Color Palette (CSS Custom Properties)

All colors are defined as CSS custom properties in `globals.css` using `oklch()`.  
Reference them via Tailwind utilities or `var(--token-name)`. Never use raw hex in components.

| Token | Hex Approx | Use |
|---|---|---|
| `--color-navy` | `#0A1F44` | Sidebar background |
| `--color-primary` | `#0B4F9E` | Primary actions, links, focus rings |
| `--color-sky` | `#0EA5E9` | Accent highlights, info states, active pills |
| `--color-surface-blue` | `#EAF3FF` | Light blue card surfaces, hover backgrounds |
| `--background` | `#F5F8FC` | Page background |
| `--border` | `#E3EAF3` | Borders, dividers |
| `--foreground` | `#0F1B2D` | Primary text |
| `--muted-foreground` | `#5B6B82` | Secondary/muted text, placeholders |
| `--color-success` | `#16A34A` | Success states, positive KPIs |
| `--color-warning` | `#F59E0B` | Warning, caution |
| `--color-danger` | `#DC2626` | Errors, destructive actions |
| `--color-card` | `#FFFFFF` | Card backgrounds |
| `--sidebar` | `#0A1F44` | Sidebar (navy) |
| `--sidebar-foreground` | `#E2E8F0` | Sidebar text |
| `--sidebar-muted` | `#94A3B8` | Sidebar muted/secondary text |
| `--sidebar-active-bg` | `#0B4F9E` | Active nav pill |
| `--sidebar-hover-bg` | `rgba(255,255,255,0.08)` | Sidebar hover |

### Status Colors (for badges only, never for backgrounds)
| Status group | Color token |
|---|---|
| Success (WON, PAID, APPROVED, etc.) | `--color-success` (#16A34A) |
| Warning (PENDING, IN_PROGRESS, etc.) | `--color-warning` (#F59E0B) |
| Danger (CANCELLED, OVERDUE, LOST, etc.) | `--color-danger` (#DC2626) |
| Info (SENT, CONFIRMED, CONTACTED, etc.) | `--color-sky` (#0EA5E9) |
| Neutral (DRAFT, NEW, TODO) | `--muted-foreground` (#5B6B82) |

---

## 3. Typography

Loaded via `next/font/google`. Applied as CSS variables and Tailwind classes.

| Role | Font | Variable | Tailwind class |
|---|---|---|---|
| **Headings** | Plus Jakarta Sans | `--font-heading` | `font-heading` |
| **Body / UI** | Inter | `--font-sans` | `font-sans` |
| **Document numbers** | JetBrains Mono | `--font-mono` | `font-mono` |

### Type Scale
| Name | Size | Weight | Line height | Use |
|---|---|---|---|---|
| `display` | 2rem (32px) | 700 | 1.2 | Page hero, greeting |
| `h1` | 1.5rem (24px) | 700 | 1.3 | Page title, modal title |
| `h2` | 1.25rem (20px) | 600 | 1.35 | Section heading |
| `h3` | 1.125rem (18px) | 600 | 1.4 | Card title, group label |
| `body` | 0.875rem (14px) | 400 | 1.5 | Default body text |
| `body-sm` | 0.8125rem (13px) | 400 | 1.5 | Table cells, secondary info |
| `label` | 0.75rem (12px) | 500 | 1.4 | Form labels, uppercase tracking |
| `caption` | 0.6875rem (11px) | 400 | 1.4 | Footnotes, timestamps |
| `mono` | 0.875rem (14px) | 500 | 1.5 | Document numbers (tabular) |

**Tabular numerals**: All money amounts and document numbers use `font-feature-settings: "tnum"`.  
Money: always right-aligned, 2 decimal places, AED prefix.

---

## 4. Spacing & Layout

Base unit: 4px (Tailwind default).

| Usage | Value |
|---|---|
| Card padding | `p-5` (20px) or `p-6` (24px) for hero cards |
| Section gap | `gap-6` (24px) |
| Form field gap | `gap-4` (16px) |
| Inner element gap | `gap-2` or `gap-3` |
| Page padding | `px-6 py-5` (desktop), `px-4 py-4` (mobile) |

---

## 5. Border Radius

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 4px | Badges, chips |
| `rounded-md` | 8px | Inputs, buttons |
| `rounded-lg` | 12px | Cards, modals |
| `rounded-xl` | 16px | Hero cards, featured sections |
| `rounded-2xl` | 20px | Login panel, large overlays |
| `rounded-full` | 50% | Avatars, icon chips |

---

## 6. Shadows

| Token | CSS | Use |
|---|---|---|
| `shadow-sm` | `0 1px 3px rgba(10,31,68,0.08)` | Default card |
| `shadow-md` | `0 4px 12px rgba(10,31,68,0.10)` | Elevated card, dropdown |
| `shadow-lg` | `0 8px 24px rgba(10,31,68,0.12)` | Modal, drawer |
| `shadow-glow` | `0 0 0 3px rgba(14,165,233,0.25)` | Focus ring on primary elements |

---

## 7. Motion System

### Core Rules
- Animate **transform and opacity only** — never width/height/padding/margin directly.
- Durations: 150–350ms. Interactive: 150–200ms. Entrances: 250–350ms.
- Springs for interactive elements; `ease-out` for entrances; `ease-in-out` for layout shifts.
- `prefers-reduced-motion`: honor via `MotionConfig reducedMotion="user"`.
- Never re-play entrance animation on data refresh. Never block interaction with animation.
- Per-row animation only for first 12 rows of a table (stagger). Large tables: no row animation.

### Shared Variants (from `lib/motion.ts`)
```ts
fadeUp:     { hidden: { opacity: 0, y: 12 },    visible: { opacity: 1, y: 0 } }
fadeIn:     { hidden: { opacity: 0 },            visible: { opacity: 1 } }
scaleIn:    { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }
slideInLeft:{ hidden: { opacity: 0, x: -16 },   visible: { opacity: 1, x: 0 } }
staggerContainer: { visible: { transition: { staggerChildren: 0.05 } } }
staggerItem: fadeUp variant
```

### Spring Tokens
```ts
spring.snappy:  { type: "spring", stiffness: 400, damping: 30 }  // buttons, toggles
spring.smooth:  { type: "spring", stiffness: 260, damping: 24 }  // sidebar pill, modals
spring.gentle:  { type: "spring", stiffness: 180, damping: 20 }  // page transitions
```

### Animation Inventory
| Element | Animation |
|---|---|
| Page entrance | `fadeUp` (y: 12→0, opacity 0→1, 250ms ease-out) via `template.tsx` |
| Sidebar nav pill | `layoutId="active-nav-pill"` spring slide |
| Sidebar collapse | spring width transition |
| Cards (list entrance) | stagger `fadeUp` (first 12 only) |
| Table rows | stagger `fadeIn` (first 12 only) |
| Card hover | `whileHover: { y: -2, shadow: elevated }` |
| Button press | `whileTap: { scale: 0.97 }` |
| Modal/drawer open | `scaleIn` + backdrop `fadeIn` |
| Dropdown/popover | `scaleIn` from origin |
| Toast | `slideInLeft` from edge |
| KPI count-up | CSS `counter()` or JS count-up on mount |
| Chart draw-in | staggered path animation on mount |
| Tab underline | `layoutId="tab-underline"` slide |
| Status badge | color transition 150ms |
| Skeleton shimmer | CSS `@keyframes shimmer` (not JS) |
| Login bg | slow gradient drift (CSS `@keyframes`, 8s) |
| Form error | `fadeUp` inline reveal |
| Success check | scale pop animation |
| Kanban card lift | `whileDrag` scale + shadow |

---

## 8. Component Standards

### Buttons
- **Primary**: navy→primary gradient, white text, `rounded-md`, `shadow-sm`, `whileTap: scale(0.97)`
- **Secondary**: white bg, `border-border`, primary text, hover `bg-surface-blue`
- **Ghost**: transparent, hover `bg-surface-blue`, primary text
- **Destructive**: danger bg, white text
- **Icon**: `rounded-md`, 36×36px, ghost variant, aria-label required
- All buttons: `transition-all duration-150`, disabled state reduces opacity to 60%, shows spinner

### Inputs & Selects
- Height: 36px (compact) / 40px (default)
- Border: `border-border`, focus: `ring-2 ring-sky/40 border-primary`
- Bg: white, placeholder: muted-foreground
- Error state: `border-danger ring-danger/20`, red inline message with `fadeUp`

### Cards
- Bg: white, `rounded-lg shadow-sm border border-border`
- Hover (interactive cards): `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`
- KPI hero cards: `rounded-xl shadow-md` with accent left border or gradient header

### DataTable
- Header: sticky, `bg-background/95 backdrop-blur-sm`
- Row hover: `bg-surface-blue/60`
- Row animation: `fadeIn` stagger first 12 rows; no animation after
- Money cells: right-aligned, `font-mono font-medium tabular-nums`
- Status cells: `StatusBadge` component only

### Sidebar
- Background: `--color-navy`
- Active item: sliding pill with `layoutId="active-nav-pill"`, bg `--sidebar-active-bg`
- Hover: `--sidebar-hover-bg` (8% white)
- Group labels: `text-xs font-semibold tracking-widest text-sidebar-muted uppercase`
- Collapsed: icon-only with Tooltip

### StatusBadge
- Small pill: `rounded-sm px-2 py-0.5 text-xs font-medium`
- Color: bg at 10% opacity, text at full color, no border (clean look)
- Dot indicator variant for inline use

### EmptyState
- Centered, illustration (or icon chip), heading, subtext, optional CTA button
- Subtle blueprint-grid bg pattern on the illustration area

### LoadingState
- Skeleton: CSS shimmer only — `bg-gradient-to-r from-border via-surface-blue to-border animate-shimmer`
- Match the shape of the real content (card skeletons, row skeletons, etc.)

### ErrorState
- Icon chip (danger), heading, message, Retry button
- Never show raw error messages to users

---

## 9. Page Layout Template

```
┌─ Sidebar (240px / 64px collapsed) ──────────────────────────────┐
│  Brand block (logo + name)                                       │
│  Nav groups with sliding pill                                     │
│  Coming Soon section (muted)                                      │
│  Footer (version)                                                 │
└──────────────────────────────────────────────────────────────────┘
┌─ Main area ──────────────────────────────────────────────────────┐
│  [DEV MODE bar — 32px amber, full width, z-50, above everything] │
│  TopBar (64px sticky, translucent blur, breadcrumbs, search, avatar) │
│  ┌─ Page content (flex-1, overflow-auto) ──────────────────────┐ │
│  │  PageHeader (title, subtitle, action buttons)               │ │
│  │  Content area (cards, table, form)                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

The DEV MODE bar sits at the very top (z-50). The sidebar starts below the DEV MODE bar when active. The main content area shifts down by the DEV MODE bar height (`32px`) — achieved via a CSS variable `--dev-bar-height`.

---

## 10. Not-Blank Checklist

Before marking any screen done, verify all of these are true at desktop AND mobile:

- [ ] Clear hierarchy and consistent spacing
- [ ] Brand fonts loaded (Plus Jakarta Sans headings, Inter body, JetBrains Mono numbers)
- [ ] No default serif/browser-styled controls
- [ ] Entrance motion present (at least `fadeUp` for main content)
- [ ] Hover, focus, and pressed states on every interactive element
- [ ] Designed loading state (skeleton shimmer matching content shape)
- [ ] Designed empty state (icon, heading, subtext, optional CTA)
- [ ] Designed error state (icon, message, retry)
- [ ] Consistent icon style (Lucide, 1 stroke width, 16–20px)
- [ ] Consistent badge style (StatusBadge component only)
- [ ] Money: tabular numerals, right-aligned, AED prefix, 2dp
- [ ] Document numbers: JetBrains Mono
- [ ] No clipped or overlapping elements (DEV bar, sidebar, topbar, content)
- [ ] WCAG AA contrast on all text
- [ ] Reduced motion respected (`MotionConfig reducedMotion="user"`)
