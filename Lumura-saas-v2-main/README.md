# ERP Commerce Platform

Enterprise-grade ERP + eCommerce platform built with Next.js 15, MongoDB, NextAuth.js v5, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 15 (App Router + Turbopack)
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB + Mongoose
- **Auth**: NextAuth.js v5 (JWT strategy)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Validation**: Zod + React Hook Form
- **Charts**: Recharts
- **Animation**: Framer Motion
- **i18n**: next-intl (English + Arabic)
- **Images**: Cloudinary
- **Containerization**: Docker

## Quick Start

### 1. Clone and Install

```bash
cd storproject
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/erp_ecommerce
AUTH_SECRET=your-super-secret-key-min-32-chars
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Seed Database

```bash
npm run seed
```

This creates:
- Admin user: `admin@example.com` / `Admin@123456`
- Regular user: `user@example.com` / `User@123456`
- 6 categories with subcategories
- 7 brands
- 6 sample products

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## Docker

```bash
# Start all services (app + MongoDB + Mongo Express)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

Mongo Express UI: [http://localhost:8081](http://localhost:8081)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (store)/           # Public store routes
│   │   ├── page.tsx       # Homepage
│   │   ├── products/      # Product listing & detail
│   │   ├── cart/          # Shopping cart
│   │   ├── checkout/      # Checkout
│   │   └── dashboard/     # User dashboard
│   ├── admin/             # Admin panel (protected)
│   │   ├── page.tsx       # Dashboard
│   │   ├── products/      # Product management
│   │   ├── orders/        # Order management
│   │   ├── categories/    # Category management
│   │   ├── brands/        # Brand management
│   │   ├── inventory/     # Inventory management
│   │   └── analytics/     # Analytics & reports
│   ├── auth/              # Auth pages
│   └── api/               # API routes (NextAuth)
├── actions/               # Server Actions
│   ├── auth.ts
│   ├── products.ts
│   ├── orders.ts
│   ├── cart.ts
│   ├── wishlist.ts
│   ├── categories.ts
│   ├── brands.ts
│   └── analytics.ts
├── components/
│   ├── ui/                # Base UI components
│   ├── store/             # Store components
│   ├── admin/             # Admin components
│   └── layout/            # Layout components
├── lib/
│   ├── auth/              # Auth utilities
│   ├── db/                # Database models & connection
│   └── safe-action.ts     # Secure action wrapper
├── schemas/               # Zod validation schemas
├── store/                 # Zustand stores
├── types/                 # TypeScript types
├── config/                # App configuration
├── i18n/                  # Internationalization
└── providers/             # React providers
```

## Security Features

- JWT sessions with secure cookies (httpOnly, sameSite, secure)
- Role-Based Access Control (RBAC): user / admin / super_admin
- Middleware route protection
- Server action permission validation
- Input validation with Zod on every action
- MongoDB injection prevention
- XSS protection headers
- CSRF protection
- Brute-force protection (account lockout after 5 failed attempts)
- Audit logging for sensitive admin actions
- Secure password hashing (bcrypt, 12 rounds)
- Soft delete for products
- MongoDB transactions for inventory updates

## Inventory Logic

When an order is placed:
1. MongoDB transaction starts
2. Stock availability is verified for each item
3. `stockQuantity` decremented atomically
4. `soldQuantity` incremented atomically
5. `remainingQuantity` updated
6. Order created
7. Cart cleared
8. Transaction committed (or rolled back on failure)

When an order is cancelled:
1. Inventory is restored via rollback
2. Order status updated to `cancelled`

## Available Scripts

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format
npm run type-check   # TypeScript check
npm run seed         # Seed database
```

## Admin Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@example.com | Admin@123456 |
| User | user@example.com | User@123456 |
