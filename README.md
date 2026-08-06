# <img src="public/images/logo.png" alt="SourceNest Logo" height="42" align="center" style="vertical-align: middle;" /> SourceNest — B2B Marketplace Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.2.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=for-the-badge&logo=react-query)](https://tanstack.com/query)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Radix_UI-000000?style=for-the-badge)](https://ui.shadcn.com/)

---

## 📌 Executive Summary

**SourceNest** is a full-stack, enterprise-grade **B2B Marketplace Platform** engineered with **Next.js 16 (App Router)**, **React 19**, and **TypeScript**. It serves as a global procurement hub connecting industrial Buyers, verified Manufacturers/Suppliers, and System Administrators.

The platform consumes a high-performance **Laravel REST API** backend paired with **Laravel Echo & Pusher** for real-time WebSocket communications (chat, live notifications, order status updates).

---

## 📑 Table of Contents

- [📌 Executive Summary](#-executive-summary)
- [🧩 What is This Project?](#-what-is-this-project)
- [👥 Core User Roles & Portals](#-core-user-roles--portals)
- [🏗️ System Architecture & Data Flow](#️-system-architecture--data-flow)
- [💻 Technology Stack](#-technology-stack)
- [📂 Project Directory Structure](#-project-directory-structure)
- [🚀 Quick Start Guide for Developers](#-quick-start-guide-for-developers)
- [🔑 Environment Configuration](#-environment-configuration)
- [⚙️ Core Architecture & Development Guidelines](#️-core-architecture--development-guidelines)
  - [1. Centralized API Client](#1-centralized-api-client)
  - [2. Server State Management (TanStack Query v5)](#2-server-state-management-tanstack-query-v5)
  - [3. Authentication & Contexts](#3-authentication--contexts)
  - [4. Internationalization (i18n) \& RTL Support](#4-internationalization-i18n--rtl-support)
- [🛠️ Developer Workflows (How to Add Code)](#️-developer-workflows-how-to-add-code)
- [📜 Command Line Reference](#-command-line-reference)
- [⚠️ Important Team & Safety Rules](#️-important-team--safety-rules)
- [🩺 Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🧩 What is This Project?

SourceNest addresses B2B sourcing challenges by providing:

1. **Supplier Discovery & Verification**: Search by product, industry, country, or certification.
2. **RFQ (Request for Quote) Management**: Multi-vendor bidding, instant quote requests, and negotiation tracking.
3. **Order Processing**: Direct order placement, invoice generation, status tracking, and dispute management.
4. **Real-time Messaging**: Direct communication between buyers and suppliers with attachment support.
5. **Multi-Tenant Dashboards**: Custom interfaces tailored specifically to Buyers, Suppliers, and Admins.

---

## 👥 Core User Roles & Portals

```
                         ┌─────────────────────────────┐
                         │   SourceNest B2B Platform   │
                         └──────────────┬──────────────┘
                                        │
      ┌─────────────────────────────────┼─────────────────────────────────┐
      ▼                                 ▼                                 ▼
┌───────────┐                     ┌───────────┐                     ┌───────────┐
│   Public  │                     │   Buyer   │                     │ Supplier  │
│Marketplace│                     │ Portal    │                     │ Portal    │
└─────┬─────┘                     └─────┬─────┘                     └─────┬─────┘
      │                                 │                                 │
      ├─ Product Directory              ├─ Create & Manage RFQs           ├─ Product Catalog Management
      ├─ Supplier Profiles              ├─ Manage Purchase Orders         ├─ Certifications & Compliance
      ├─ Industry Sourcing              ├─ Supplier Conversations         ├─ RFQ Bidding & Responses
      ├─ Blog & Help Center             ├─ Saved Favorites                ├─ Sales Analytics & Orders
      └─ Public Search                  └─ Activity Logs                  └─ Storefront Configuration
                                        │
                                        ▼
                                 ┌───────────┐
                                 │   Admin   │
                                 │ Panel     │
                                 └─────┬─────┘
                                       │
                                       ├─ User & Supplier Verification
                                       ├─ Product Moderation
                                       ├─ Platform Analytics & Financials
                                       └─ Site Settings & CMS
```

---

## 🏗️ System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 16 FRONTEND (Client)                     │
│                                                                        │
│   ┌──────────────────┐    ┌──────────────────┐   ┌─────────────────┐   │
│   │ App Router Pages │    │ shadcn UI        │   │ React Contexts  │   │
│   │ (App Directory)  │    │ Components       │   │ (Auth, Favs)    │   │
│   └────────┬─────────┘    └────────┬─────────┘   └────────┬────────┘   │
│            │                       │                      │            │
│            └───────────────────────┼──────────────────────┘            │
│                                    ▼                                   │
│                        ┌──────────────────────┐                        │
│                        │  TanStack Query v5   │                        │
│                        │ (Server State Cache) │                        │
│                        └──────────┬───────────┘                        │
│                                   │                                    │
│                                   ▼                                    │
│                        ┌──────────────────────┐                        │
│                        │ Centralized Client   │                        │
│                        │ (lib/api/client.ts)  │                        │
│                        └──────────┬───────────┘                        │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │ HTTP REST (JSON)
                                    │ + WebSockets (Pusher/Echo)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        LARAVEL BACKEND (API)                           │
│                                                                        │
│  ┌────────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │ REST Controller    │    │ Auth (Sanctum/  │    │ Pusher WebSocket│  │
│  │ Endpoints (/v1/*)  │    │ JWT Tokens)     │    │ Broadcasting    │  │
│  └────────────────────┘    └─────────────────┘    └─────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

| Layer                      | Technologies Used                                               |
| :------------------------- | :-------------------------------------------------------------- |
| **Framework**              | Next.js 16.1.6 (App Router), React 19.2.4                       |
| **Language**               | TypeScript 5.7.3 (Strict Mode enabled)                          |
| **Styling**                | Tailwind CSS 4.2.0, PostCSS 8.5, Autoprefixer, `tw-animate-css` |
| **UI Components**          | shadcn/ui (Radix UI base primitives), Lucide Icons, React Icons |
| **Server State & Caching** | `@tanstack/react-query` v5.101.2                                |
| **Form & Validation**      | `react-hook-form` v7.54, `@hookform/resolvers`, `zod` v3.24     |
| **HTTP & Real-Time**       | `axios` v1.14, `laravel-echo` v2.3, `pusher-js` v8.5            |
| **Charts & Data Viz**      | `recharts` v2.15                                                |
| **Drag & Drop**            | `@dnd-kit/core`, `@dnd-kit/sortable`                            |
| **Notifications**          | `sonner` v1.7, `sweetalert2` v11.26                             |
| **Package Manager**        | `pnpm` (or `npm`)                                               |

---

## 📂 Project Directory Structure

```
readywithfixes/
├── app/                                  # Next.js App Router root
│   ├── (adminDashboard)/                 # Admin protected route group
│   │   └── admin/                        # Admin dashboard pages (users, products, orders, settings)
│   ├── (auth)/                           # Authentication routes
│   │   └── auth/                         # Login, Register, Forgot Password, Verification
│   ├── (manufacturerDashboard)/          # Supplier protected route group
│   │   └── dashboard/                    # Manufacturer panel (products, inquiries, orders, stats)
│   ├── (public)/                         # Public routes (SEO friendly)
│   │   ├── products/                     # Product catalog & details
│   │   ├── suppliers/                    # Supplier directory & storefronts
│   │   ├── rfq/                          # RFQ creation & list
│   │   ├── search/                       # Unified marketplace search
│   │   ├── blog/ & faq/ & help/          # Content & Knowledge base
│   │   └── page.tsx                      # Main Landing Page
│   ├── (userDashboard)/                  # Buyer protected route group
│   │   └── dashboard/                    # Buyer dashboard (orders, RFQs, activity)
│   ├── layout.tsx                        # Root layout (Providers, Fonts, Direction)
│   └── globals.css                       # Global Tailwind CSS import
│
├── components/                           # React UI Components
│   ├── ui/                               # shadcn/ui low-level primitive components
│   ├── admin/                            # Admin specific widgets & tables
│   ├── auth/                             # Login/register forms & modals
│   ├── chat/                             # Real-time chat & messaging UI
│   ├── home/                             # Landing page hero, features, CTA components
│   ├── layout/                           # Navbar, Header, Footer, Sidebar components
│   ├── products/                         # Product cards, grids, filters, detail views
│   └── suppliers/                        # Supplier cards, profile banners, badges
│
├── lib/                                  # Application Core Logic & API Utilities
│   ├── api/                              # Centralized API modules
│   │   ├── client.ts                     # Single HTTP Axios instance (Bearer token & language inject)
│   │   ├── auth.ts                       # Login, signup, logout API handlers
│   │   ├── admin-*.ts                    # Admin endpoints (users, reports, products)
│   │   ├── buyer-*.ts                    # Buyer API endpoints
│   │   ├── manufacturer-*.ts             # Supplier API endpoints
│   │   └── products.ts, rfqs.ts          # Public catalog APIs
│   ├── auth-context.tsx                  # User Auth State Provider
│   ├── query-provider.tsx                # TanStack Query Client Provider
│   ├── query-keys.ts                     # Query key factories for cache invalidation
│   ├── echo.ts                           # Laravel Echo + Pusher socket initialization
│   ├── i18n/                             # Dictionary loader for EN, AR, HE, ES
│   └── typzh.ts                          # Shared TypeScript interfaces & types
│
├── hooks/                                # Custom React hooks (mobile, toast, theme)
├── public/                               # Static assets (images, logos, flags)
├── styles/                               # Custom CSS rules
├── package.json                          # Dependencies & scripts
└── tsconfig.json                         # TypeScript compiler setup
```

---

## 🚀 Quick Start Guide for Developers

Follow these steps to set up the project locally on your machine.

### Prerequisites

- **Node.js**: `v18.17.0` or higher (Node 20+ recommended)
- **Package Manager**: `pnpm` (recommended) or `npm`
- **Git**: Installed on your system

---

### Step 1: Clone & Install Dependencies

```bash
# 1. Clone the repository
git clone <repository-url>
cd readywithfixes

# 2. Install dependencies (Using pnpm)
pnpm install
```

---

### Step 2: Configure Environment Variables

Copy the provided example environment file to `.env.local`:

```bash
cp .env.example .env.local
```

Open `.env.local` and set your local or staging backend API URL:

```env
# Laravel Backend API URL (Must end with /api/v1)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1

# Pusher / WebSockets Config (Required for real-time messaging & alerts)
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=mt1

# Google Client ID (Optional for OAuth login)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

---

### Step 3: Run Development Server

```bash
pnpm dev
```

The application will launch at **`http://localhost:3000`**.

---

### Step 4: Verify Compilation & Quality

Before submitting any code, verify TypeScript compilation and linting:

```bash
# Check TypeScript errors without emitting files
pnpm type-check

# Run ESLint check
pnpm lint
```

---

## 🔑 Environment Configuration

| Variable                       | Required | Description                                  | Default Value                  |
| :----------------------------- | :------: | :------------------------------------------- | :----------------------------- |
| `NEXT_PUBLIC_API_URL`          | **Yes**  | Base URL for backend Laravel API             | `http://127.0.0.1:8000/api/v1` |
| `NEXT_PUBLIC_PUSHER_KEY`       | Optional | App key for Pusher / Laravel Echo WebSockets | -                              |
| `NEXT_PUBLIC_PUSHER_CLUSTER`   | Optional | Cluster location for Pusher service          | `mt1`                          |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional | Client ID for Google OAuth login             | -                              |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Optional | PayPal client ID for payment test sandbox    | -                              |

---

## ⚙️ Core Architecture & Development Guidelines

### 1. Centralized API Client

**NEVER make raw `fetch()` or separate `axios.create()` calls.**  
All API requests must go through the centralized client defined at [`lib/api/client.ts`](file:///c:/dev/jawas/readywithfixes/lib/api/client.ts).

```typescript
import { apiClient } from "@/lib/api/client";

// GET Request Example
export async function getProducts(params: Record<string, any>) {
  const response = await apiClient.get("/products", { params });
  return response.data;
}

// POST Request Example
export async function createRFQ(payload: RFQPayload) {
  const response = await apiClient.post("/rfqs", payload);
  return response.data;
}
```

**Why?**

- Automatically attaches JWT/Bearer auth tokens from storage.
- Automatically injects current user locale header (`Accept-Language`).
- Intercepts `401 Unauthorized` responses and cleans up auth state.

---

### 2. Server State Management (TanStack Query v5)

We use **TanStack Query** for all server-side data fetching, caching, and cache invalidation.

- **Query Key Registry**: All query keys **MUST** be defined inside [`lib/query-keys.ts`](file:///c:/dev/jawas/readywithfixes/lib/query-keys.ts). Do **NOT** hardcode string keys in individual pages.

```typescript
// Query Key Factory Usage (lib/query-keys.ts)
export const queryKeys = {
  adminProducts: (page: number, search: string) =>
    ["admin-products", page, search] as const,
};

// Component / Page Usage
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getAdminProducts } from "@/lib/api/admin-products";

export function AdminProductsTable({
  page,
  search,
}: {
  page: number;
  search: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.adminProducts(page, search),
    queryFn: () => getAdminProducts(page, search),
    placeholderData: (prev) => prev, // Prevents layout flash on page change
  });
}
```

---

### 3. Authentication & Contexts

Auth state is managed globally by [`lib/auth-context.tsx`](file:///c:/dev/jawas/readywithfixes/lib/auth-context.tsx).

```typescript
import { useAuth } from "@/lib/auth-context";

export function ProfileHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <p>Please log in.</p>;

  return (
    <div>
      <h2>Welcome, {user?.name}</h2>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

---

### 4. Internationalization (i18n) & RTL Support

The project supports multiple languages including RTL (Right-To-Left) scripts like **Hebrew (`he`)** and **Arabic (`ar`)**.

- Translations are located in `/lib/i18n/dictionaries/`.
- Direction (`dir="rtl"` or `dir="ltr"`) is managed dynamically at the root layout level.

---

## 🛠️ Developer Workflows (How to Add Code)

### Creating a New Page

1. Determine the appropriate Route Group inside `app/`:
   - `(public)` for unauthenticated pages.
   - `(userDashboard)` for Buyer pages.
   - `(manufacturerDashboard)` for Supplier pages.
   - `(adminDashboard)` for Admin pages.
2. Create the folder: `app/(routeGroup)/your-feature/page.tsx`.
3. Use Next.js App Router standards (Server Components by default; add `"use client"` only when interactive state/hooks are required).

### Creating a Component

1. First, check [`components/ui/`](file:///c:/dev/jawas/readywithfixes/components/ui) to see if a `shadcn/ui` base component already exists (Button, Dialog, Select, Dropdown, Table, Input, etc.).
2. Create feature-specific components under `components/[feature]/[component-name].tsx`.
3. Strongly type all props with TypeScript interfaces.

---

## 📜 Command Line Reference

```bash
# Start local development server
pnpm dev

# Build the project for production
pnpm build

# Start production server after build
pnpm start

# Run ESLint validation
pnpm lint

# Check TypeScript compiler errors
pnpm type-check
```

---

## ⚠️ Important Team & Safety Rules

> [!IMPORTANT]
> **Client & Codebase Safety Notice**  
> The client requires strict adherence to quality and safety standards. Always adhere to the following permission-based workflows:

### ❌ Strict Prohibitions (Ask Permission Before Action)

1. **DO NOT** delete files, components, or API functions.
2. **DO NOT** install or uninstall npm/pnpm packages without prior approval.
3. **DO NOT** modify root configuration files (`package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`).
4. **DO NOT** alter the core auth context (`lib/auth-context.tsx`) or API client (`lib/api/client.ts`) without testing.
5. **DO NOT** commit `.env.local` or expose private secrets.

### ✅ Allowed & Encouraged Actions

- Fixing bugs and UI layout issues.
- Adding new feature components following existing patterns.
- Integrating backend API endpoints using `apiClient`.
- Improving accessibility, responsive design, and performance.
- Adding TypeScript type safety and documentation comments.

---

## 🩺 Troubleshooting & FAQs

### Q1: The dev server fails to fetch API data or returns CORS errors.

- **Fix**: Ensure your backend Laravel server is running and `NEXT_PUBLIC_API_URL` in `.env.local` points to `http://127.0.0.1:8000/api/v1` (including `/api/v1`).

### Q2: How do I clear Next.js build cache after making heavy route changes?

```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next

# Linux / macOS
rm -rf .next
```

### Q3: Styles or components look unstyled after adding Tailwind classes.

- **Fix**: Ensure your classes don't conflict with custom styles. Tailwind CSS v4 uses standard `@import "tailwindcss";` inside [`styles/globals.css`](file:///c:/dev/jawas/readywithfixes/styles/globals.css).

---

<p center align="center">
  Developed with ❤️ by the Senior Engineering Team for <strong>SourceNest</strong>.
</p>
