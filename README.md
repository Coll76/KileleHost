# Kilele Host Checkout

A high-fidelity, interactive prototype of an end-to-end web hosting order flow. Customers pick a domain, configure hosting, choose a billing cycle and currency, sign up or log in inline, and pay. It takes three steps, and the cart is never lost along the way.

**Live demo:** _coming soon_

## The flow

1. **Configure.** Choose products and options while the order summary updates live.
2. **Account and billing.** Continue as a guest, sign up, log in, or use Google, GitHub or SSO, all on the same page.
3. **Payment and confirmation.** Review everything, including renewal prices, then pay by M-Pesa, card, PayPal or bank transfer.

## What it covers

**Domains**
- Search and register, transfer with an EPP code, or connect a domain you already own
- First-year and renewal prices shown side by side for every TLD
- Auto-renew and WHOIS privacy toggles, with registry limits explained (e.g. .ke and .co.ke)

**Hosting**
- **Shared hosting.** Web, WordPress and WooCommerce plans
- **VPS.** Managed or unmanaged, Ubuntu 24.04, AlmaLinux 9, Debian 12 or Windows Server 2022, presets plus CPU, RAM and NVMe sliders
- **Dedicated servers.** Hardware tiers, data center location and bandwidth packages
- **Cloud.** Instance sizes, autoscaling presets with the peak cost stated upfront, and a managed Kubernetes add-on

**Add-ons**
- Daily backups, SSL certificates, professional email, DDoS protection and CDN

**Pricing engine**
- Billing cycles of 1, 12, 24 and 36 months with savings badges
- Effective monthly price shown next to the total billed upfront
- Currency switcher (KES, USD, EUR, GBP) that recalculates every price, add-on, discount and tax line
- Tax estimate based on billing country, and promo codes

**Order summary**
- Sticky sidebar on desktop, fixed bottom bar with a bottom sheet on mobile
- Itemized lines with first-term and renewal prices, removal with undo, promo code, tax and total due today

## UX decisions

- **Don't make me think.** Sensible defaults (36-month term, KES, M-Pesa first), advanced options tucked away until needed, and one clear primary action per screen.
- **No hidden fees.** Every price appears with its renewal rate, and the pay button states the exact amount.
- **The cart is never lost.** Moving between steps, switching between login and guest checkout, or refreshing the page keeps the order intact.
- **Mobile first.** Stacked plan cards with the recommended plan first, touch targets of at least 44px, the right keyboard for each field, and 16px inputs to prevent iOS zoom.
- **Accessible.** WCAG AA contrast, visible focus states, keyboard navigation, labelled controls and inline errors linked to their fields.

Every interaction state is covered, including hover, pressed, focus, disabled, validation errors, skeleton loaders, empty states and the confirmation screen.

A **Desktop | Mobile** toggle renders the app inside a real 375 × 812 frame, so both breakpoints can be reviewed without resizing the browser.

## Design system

| Token | Value | Use |
|---|---|---|
| Primary | `#395AF4` | Actions, selected states, links, focus rings |
| Accent | `#E7A403` | Conversion buttons and savings badges, with navy text for AA contrast |
| Ink | `#091F53` | Headings and prices |
| Fonts | Outfit, Figtree | Headings and prices, body and UI |

## Try it

| What | Value |
|---|---|
| Promo codes | `KILELE10` (10% off), `WELCOME20` (20% off first term) |
| Existing customer login | any email with password `Password123!` |
| Card that succeeds | `4242 4242 4242 4242` |
| Card that is declined | `4000 0000 0000 0002` |
| Taken domain | a .com containing `google`, `safaricom` or `test` |
| Locked transfer | a domain containing `locked` |

## Run it locally

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. To build for production, run `npm run build`, which outputs static files to `dist/`.

All data is mocked, so no backend, database or API keys are needed.

## Deploy

The app is a static single-page app and deploys to Vercel or Netlify with default settings.

| Setting | Value |
|---|---|
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | none |

## Project structure

```
src/
  App.tsx              Checkout shell, step routing, desktop and mobile layouts
  components/          Steps, product tabs, order summary, mobile bar, toasts
  config/              Catalog, domain, hosting, add-on, billing, payment and currency data
  store/               Cart state (persisted to localStorage) and viewport context
  utils/pricing.ts     Pure pricing functions for terms, discounts, renewals and tax
  types/checkout.ts    Shared TypeScript types
```

## Tech

React 19, TypeScript, Tailwind CSS 4, Vite 8, Motion and Lucide icons. Designed and built with Google AI Studio.

## Notes

This is a design prototype. Payments, OAuth, domain availability and address lookup are simulated, and Kilele Host is a fictional brand.
