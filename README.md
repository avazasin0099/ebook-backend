# Avazas Books – Backend API & DRM Engine

Secure, high-performance Node.js / Express TypeScript backend for the Avazas Books digital marketplace, featuring Readium LCP-compatible DRM licensing, Cashfree payment gateway integration, and device authorization.

## Features
- **Authentication & RBAC:** JWT authentication with role-based access control (`SUPER_ADMIN`, `ADMIN`, `CUSTOMER`).
- **DRM & Licensing:** ISO 23078-2 Readium LCP content protection, client device binding (up to 3 devices), offline license leasing, and telemetry.
- **Payments:** Cashfree Payment Gateway with cryptographically signed webhook verification and idempotent entitlement fulfillment.
- **Database:** Sequelize ORM with dual-engine support for PostgreSQL and SQLite.
- **Encrypted Storage:** Private local and S3-compatible AES-256 encrypted publication asset storage.

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm or pnpm

### Installation
```bash
npm install
```

### Configuration
Copy `.env.example` to `.env` and fill in your configuration:
```bash
cp .env.example .env
```

### Database Initialization & Seeding
```bash
npm run seed
```

### Running Locally
```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

### Running Tests
```bash
npm test
```
