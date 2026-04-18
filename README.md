# HVT Dashboard

Frontend application for the HVT open-source authentication platform. This repo contains the public marketing site, the authenticated control-plane dashboard, and the runtime playground used to exercise HVT auth flows against a running API.

## What ships here

- Public landing pages for **https://hvts.app**
- Auth flows for signup, login, password reset, invitations, and email verification
- Organization dashboard for projects, members, API keys, webhooks, audit logs, and settings
- Runtime playground pages that exercise the HVT SDK against a configured backend

## Stack

- React 18
- Vite 5
- React Router 6
- Tailwind CSS 3
- TanStack Query 5
- React Hook Form + Zod
- Radix UI primitives
- Local vendored `@hvt/sdk` package from [`vendor/hvt-sdk-0.1.0.tgz`](./vendor/hvt-sdk-0.1.0.tgz)

## Prerequisites

- Node.js 20+
- npm 10+
- A running HVT API instance, typically the sibling backend repo on `http://localhost:8000`

## Quick Start

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The Vite dev server starts on `http://localhost:5173` by default.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Base origin for the HVT API. Use `http://localhost:8000` for local backend development. |
| `VITE_PUBLIC_DOCS_URL` | No | Overrides the docs link shown in the dashboard and landing pages. |
| `VITE_PUBLIC_STATUS_URL` | No | Overrides the status/health link shown in the UI. |
| `VITE_RUNTIME_API_KEY` | No | Public runtime key used only by the runtime playground flows. Do not commit real keys. |

## Available Scripts

- `npm run dev` starts the Vite development server

## Runtime Playground

The **Runtime Playground** is a built-in sandbox that lets you test authentication flows (Login, Registration, Social Auth, Session verification, etc.) against your running HVT API directly from the browser. 

You can access the Playground from the primary sidebar navigation inside the Dashboard, or directly at `/runtime-playground`. It uses the `VITE_RUNTIME_API_KEY` (if provided) and local browser storage to simulate a frontend client integrating with your HVT backend.

### Testing Roles and Permissions (RBAC)

Yes! You can also simulate and test Role-Based Access Control (RBAC) and permissions. Navigate to the **Commerce Demo** (`/runtime-demo`) to see a real-world example of how HVT evaluates permission slugs and role claims encoded directly inside your session tokens to gate UI components and features.
- `npm run build` creates a production build in `dist/`
- `npm run lint` runs ESLint across the repo
- `npm run preview` serves the built app locally

## Local Development Notes

- The app expects the backend to manage auth cookies and CSRF behavior.
- `vite.config.js` proxies `/api/*` traffic to the local backend during development.
- This repo stays `private: true` in `package.json` intentionally so the dashboard is not accidentally published to npm.

## Open Source
- License: [GNU Affero General Public License v3.0 only](LICENSE).
- Contributing guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Security policy: [SECURITY.md](./SECURITY.md)

## Related Repositories

- Backend/API: `../hvt`
- SDK: `../hvt-sdk`
- Docs site: `../hvt-docs`

## Public Endpoints

- Main app: [hvts.app](https://hvts.app)
- Direct API base URL: [api.hvts.app](https://api.hvts.app)
- Documentation: [docs.hvts.app](https://docs.hvts.app)