# Airport Stats - Redesign Guide

**Verzija:** 1.0
**Datum:** 21.11.2025
**Referentni dizajn:** UIX Design Lab Dashboard

---

## 🎨 Color Palette

### Primary Colors
```css
--brand-blue: #0EA5E9;           /* Primary brand color - buttons, links, highlights */
--brand-blue-hover: #0284C7;     /* Hover state */
--brand-blue-soft: #E0F2FE;      /* Soft backgrounds */
```

### Backgrounds
```css
--bg-main: #FFFFFF;              /* Main content background */
--bg-shell: #F8FAFC;             /* Page shell background */
--bg-sidebar: #F1F5F9;           /* Sidebar background */
--bg-card: #FFFFFF;              /* Card background */
--bg-hover: #F8FAFC;             /* Hover states */
```

### Text Colors
```css
--text-primary: #0F172A;         /* Primary headings and important text */
--text-secondary: #475569;       /* Secondary text */
--text-muted: #94A3B8;           /* Muted text, labels */
--text-light: #CBD5E1;           /* Very light text */
```

### Borders & Shadows
```css
--border-color: #E2E8F0;         /* Border color */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-card: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
```

### Accent Colors
```css
--success: #10B981;              /* Green for positive values */
--warning: #F59E0B;              /* Orange for warnings */
--error: #EF4444;                /* Red for errors */
--info: #3B82F6;                 /* Blue for info */
```

---

## 📐 Layout Structure

### Sidebar (Fixed Left - 280px)
- **Background:** `--bg-sidebar` (#F1F5F9)
- **Width:** 280px (fixed)
- **Padding:** 24px
- **Elements:**
  1. **Logo Section** (top)
     - Logo + App Name
     - Subtitle
  2. **Help Section**
     - "Hey, Need help?"
     - "Just ask me anything!"
  3. **Navigation Sections**
     - HOME (with items)
     - POCKET (with items)
     - Active item: dark background (#1E293B), white text
     - Inactive: gray text, transparent bg
  4. **CTA Section** (bottom)
     - "Unlock all features" card
     - "15 day free trial" button

### Header (Top - Fixed)
- **Background:** White
- **Height:** ~80px
- **Border Bottom:** 1px solid `--border-color`
- **Elements (Right aligned):**
  1. Search bar (centered-left)
  2. Notification bell icon
  3. Date display (21 Sat, November)
  4. Calendar icon
  5. User profile (avatar + name + role)

### Main Content Area
- **Margin Left:** 280px (sidebar width)
- **Padding:** 32px
- **Background:** `--bg-shell` (#F8FAFC)
- **Max Width:** Full width - sidebar

---

## 🎴 Card Design

### Standard Card
```css
background: white;
border-radius: 16px;
padding: 24px;
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
border: 1px solid #F1F5F9;
```

### Card Spacing
- **Gap between cards:** 20px
- **Grid columns:**
  - Large screens: 4 columns
  - Medium: 2 columns
  - Small: 1 column

### Card Header
- **Font Size:** 14px
- **Font Weight:** 600 (semibold)
- **Color:** `--text-secondary`
- **Margin Bottom:** 16px

### Card Value (Big Number)
- **Font Size:** 32px - 36px
- **Font Weight:** 700 (bold)
- **Color:** `--text-primary` or `--brand-blue`
- **Line Height:** 1.2

### Card Subtitle
- **Font Size:** 12px
- **Font Weight:** 400 (regular)
- **Color:** `--text-muted`

---

## 🔤 Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Sizes
```css
--text-xs: 12px;      /* Small labels */
--text-sm: 14px;      /* Body text, table text */
--text-base: 16px;    /* Default */
--text-lg: 18px;      /* Section headings */
--text-xl: 20px;      /* Card headings */
--text-2xl: 24px;     /* Page headings */
--text-3xl: 32px;     /* Large numbers in cards */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 🎯 Component Styles

### Buttons

**Primary Button:**
```css
background: #0EA5E9;
color: white;
padding: 10px 20px;
border-radius: 10px;
font-weight: 600;
font-size: 14px;
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
transition: all 0.2s;

&:hover {
  background: #0284C7;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**Secondary Button:**
```css
background: white;
color: #475569;
border: 1px solid #E2E8F0;
padding: 10px 20px;
border-radius: 10px;
font-weight: 600;
font-size: 14px;

&:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
}
```

### Input Fields
```css
border: 1px solid #E2E8F0;
border-radius: 10px;
padding: 10px 14px;
font-size: 14px;
background: white;

&:focus {
  outline: none;
  border-color: #0EA5E9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}
```

### Tables
```css
/* Table Header */
th {
  background: #F8FAFC;
  color: #64748B;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 1px solid #E2E8F0;
}

/* Table Body */
td {
  padding: 14px 16px;
  font-size: 14px;
  color: #1E293B;
  border-bottom: 1px solid #F1F5F9;
}

/* Hover State */
tr:hover {
  background: #F8FAFC;
}
```

---

## 📊 Charts & Visualizations

### Chart Colors (Recharts)
```javascript
const CHART_COLORS = {
  primary: '#0EA5E9',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
};

// Grid
stroke: '#E2E8F0',
strokeDasharray: '3 3',

// Axis
tick: { fontSize: 12, fill: '#94A3B8' },

// Tooltip
contentStyle: {
  backgroundColor: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  fontSize: '14px',
},
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* Hide sidebar, show hamburger menu */
  /* 1 column grid */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Collapsible sidebar */
  /* 2 column grid */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full sidebar visible */
  /* 4 column grid */
}
```

---

## 🎨 Dashboard Specific

### Stats Cards (Top Row)
- **4 cards in a row** (responsive)
- **Each card has:**
  - Small label (12px, muted color)
  - Large number (32-36px, bold, brand color)
  - Optional subtitle or trend indicator

### Chart Cards
- **White background**
- **Title:** 18px, semibold, dark color
- **Margin bottom:** 20px before chart
- **Chart height:** 300px
- **Responsive:** Full width

### Visualizations Style
- **Dot matrix:** Use small circles in grid pattern (similar to image)
- **Clean lines:** 2px stroke width
- **Smooth curves:** Use monotone or natural curve types
- **Colors:** Use brand blue as primary, green for positive metrics

---

## ✅ Implementation Checklist

### Phase 1: Global Styles
- [ ] Update Tailwind config with new color palette
- [ ] Add custom utilities for shadows and borders
- [ ] Set up Inter font
- [ ] Create reusable component classes

### Phase 2: Layout Structure
- [ ] Create new Sidebar component
- [ ] Create new Header component
- [ ] Update main layout wrapper
- [ ] Implement responsive behavior

### Phase 3: Dashboard Page
- [ ] Redesign stats cards (4-card grid)
- [ ] Update chart components styling
- [ ] Implement dot matrix visualizations
- [ ] Update tables with new styles

### Phase 4: Other Pages
- [ ] Reports pages
- [ ] Analytics pages
- [ ] Flights pages
- [ ] Forms

### Phase 5: Components
- [ ] Buttons
- [ ] Inputs
- [ ] Selects
- [ ] Tables
- [ ] Cards

---

## 🚀 Quick Start

1. **Install Inter font:**
```bash
# Add to layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
```

2. **Update tailwind.config.ts** with new color palette

3. **Create global components:**
   - `components/layout/Sidebar.tsx`
   - `components/layout/Header.tsx`
   - `components/layout/MainLayout.tsx`

4. **Start with Dashboard page** as reference implementation

---

**Napomena:** Ovaj dizajn zadržava svu funkcionalnost, mijenja samo vizuelni izgled da bude konzistentan sa referentnim dizajnom.
