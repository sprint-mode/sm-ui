# @sprintmode/ui

Shared platform package for all Sprint Mode products. React components, CSS design tokens, worker auth helpers, and a login page with SSO + magic link.

## Install

```bash
npm install @sprintmode/ui --registry=https://npm.pkg.github.com
```

## Usage

### Components

```javascript
import { Layout, Card, CardBody, Button, StatCard, Stats, Tabs, PageHeader, Table, Badge, Pill, Progress, Empty, Spinner, ScoreRing } from '@sprintmode/ui'
```

### CSS

Import all three CSS files in your entry point:

```javascript
import '@sprintmode/ui/css'              // Design tokens, reset, variables
import '@sprintmode/ui/css/shell'        // Sidebar, layout, mobile
import '@sprintmode/ui/css/components'   // Card, button, table, etc.
```

### Icons

```javascript
import { IconCode, IconUsers, IconDollar, LogoStudios, ProductIcon } from '@sprintmode/ui'

// System icon
<IconCode width={20} height={20} />

// Product logo
<LogoStudios />

// Tinted product badge
<ProductIcon product="studios" size={40} />
```

### Layout Shell

```javascript
import { Layout } from '@sprintmode/ui'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Layout reads session from /api/auth/me, renders sidebar from session.products
<BrowserRouter>
  <Routes>
    <Route element={<Layout />}>
      <Route path="/client" element={<Dashboard />} />
    </Route>
  </Routes>
</BrowserRouter>
```

Extend sidebar nav by passing `navConfig`:

```javascript
<Layout navConfig={{
  myproduct: {
    label: 'My Product',
    items: [
      { to: '/client/myproduct', label: 'Home', icon: 'grid', exact: true },
      { to: '/client/myproduct/settings', label: 'Settings', icon: 'gear' },
    ]
  }
}} />
```

### Login Page

```javascript
import { Login } from '@sprintmode/ui'

// Renders Google SSO + Microsoft SSO + magic link fallback
<Login productName="Mode" logoSrc="/logo-mode-horizontal.png" />
```

### Worker Auth Helpers

For Cloudflare Workers (server-side only):

```javascript
import { verifyJWT, signJWT, requireAuth, generateToken, generateId } from '@sprintmode/ui/auth'

// In a Worker fetch handler:
var session = await requireAuth(request, env)
if (!session) return new Response('Unauthorized', { status: 401 })
```

### Product Theming

Override `--accent` in your CSS to theme all components:

```css
:root {
  --accent:       #f4930a;      /* Mode orange */
  --accent-hover: #d97f06;
  --accent-10:    rgba(244, 147, 10, 0.1);
  --accent-20:    rgba(244, 147, 10, 0.2);
  --accent-tint:  #fdf4e6;
}
```

## Architecture

This package is the frontend contract of the SM platform. Products import it — they never rebuild components, auth, or design tokens. See `_jockey/SM_PLATFORM_PRINCIPLES.md`.
