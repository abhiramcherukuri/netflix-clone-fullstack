# 🎬 Netflix Clone — Enterprise MEAN Stack Platform

A production-grade Netflix streaming platform built with **Angular 22**, **Node.js 24 LTS**, **Express 5**, **MongoDB 8**, and **TypeScript 7**, featuring an enterprise **3-Server OAuth 2.0 PKCE** zero-trust architecture.

---

## 🚀 Architecture Overview

The system is decoupled into three dedicated services to ensure zero-trust security and high scalability:

```
┌─────────────────────────────────────────────────────────┐
│                   AUTH SERVER (:3001)                   │
│   - OAuth 2.0 + PKCE Authorization Server               │
│   - RS256 JWT Token Signing & Public JWKS Endpoint      │
│   - Password Hashing (Bcrypt 12 rounds)                 │
│   - Server-Rendered EJS Login & Registration Forms      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    API SERVER (:3000)                   │
│   - Pure REST API (Content, Profiles, Watchlist, Search)│
│   - Stateless JWT Verification via Cached /oauth/jwks   │
│   - Signed Cloudinary CDN Video Stream URLs             │
│   - Zero password or private key storage                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    CLIENT APP (:4200)                   │
│   - Angular 22 Single Page Application (SPA)            │
│   - Zoneless Change Detection & Signal Stores           │
│   - Tokens stored exclusively in memory (No XSS risks)  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer         | Technology       | Version  | Description                                               |
| ------------- | ---------------- | -------- | --------------------------------------------------------- |
| **Frontend**  | Angular          | `22.x`   | Signals, Zoneless change detection, Standalone components |
| **Runtime**   | Node.js          | `24 LTS` | Native type stripping (`--strip-types`), native ESM       |
| **Backend**   | Express          | `5.x`    | Native async error handling, modern security pipelines    |
| **Database**  | MongoDB          | `8.x`    | High-throughput document store with Mongoose 9 ODM        |
| **Caching**   | Redis            | `8.x`    | Token blocklisting, rate limiting, and caching            |
| **Media CDN** | Cloudinary       | Latest   | HLS adaptive bitrate streaming, signed streaming tokens   |
| **Infra**     | Docker & Compose | Latest   | Local MongoDB 8 & Redis 8 container persistence           |

---

## 🏗️ 5-Layer Backend Module Pattern

All backend feature modules follow a strict 5-layer separation of concerns:

```
Routes ➔ Controller ➔ Service ➔ Repository ➔ Model
```

- **Routes**: Route path definitions and middleware bindings.
- **Controller**: Request extraction and HTTP response formatting.
- **Service**: Pure business logic (framework & DB agnostic).
- **Repository**: Encapsulates all Mongoose queries and database operations.
- **Model**: Mongoose schema, validation rules, and indexes.

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites

- **Node.js**: `v24.x+` (with native `--strip-types` support)
- **Docker Desktop**: Running locally
- **npm**: `v10.x+`

### 2. Installation

```powershell
# Clone the repository
git clone https://github.com/your-username/netflix-clone.git
cd netflix-clone

# Install all dependencies across workspaces
npm install
```

### 3. Environment Setup

Create your local `.env` file from `.env.example`:

- **Windows (PowerShell)**:
  ```powershell
  Copy-Item .env.example .env
  ```
- **macOS / Linux (Bash)**:
  ```bash
  cp .env.example .env
  ```

### 4. Start Local Infrastructure (MongoDB & Redis)

```powershell
npm run infra
```

### 5. Start Development Servers

To start all services concurrently:

```powershell
npm run dev
```

Or run individual services in separate terminals:

- `npm run auth` — Auth Server on `http://localhost:3001`
- `npm run api` — API Server on `http://localhost:3000`
- `npm run client` — Angular SPA on `http://localhost:4200`

---

## 🔒 Security Principles

- **100% HttpOnly Cookies**: Both access and refresh tokens are stored in `httpOnly`, `Secure`, `SameSite=Lax/Strict` cookies — completely immune to XSS token theft.
- **Double-Submit Anti-CSRF Defense**: All mutating requests are validated with cryptographically verified `X-XSRF-TOKEN` headers.
- **OAuth 2.0 PKCE**: RFC 7636 public client protection against authorization code interception.
- **Zero Credential Exposure**: Passwords never touch Angular JavaScript memory or client bundles.
- **Asymmetric RS256**: Only the Auth Server holds the private key; the API Server validates signatures using the public key via JWKS without database or network round-trips.
- **Fail-Fast Validation**: Environment variables are strictly validated at boot time via **Zod**.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
