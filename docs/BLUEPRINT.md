# 🎬 NetflixClone — Final Engineering Blueprint

> **Stack:** Angular 22 · Node 24 LTS · Express 5 · MongoDB 8 · TypeScript 7  
> **Architecture:** 3-Server OAuth 2.0 PKCE | Cloudinary CDN | Docker Infrastructure  
> **Status:** FINAL — All decisions settled. No open questions.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Final Technology Stack](#2-final-technology-stack)
3. [Three-Server Architecture](#3-three-server-architecture)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Feature Roadmap](#5-feature-roadmap)
6. [Data Models](#6-data-models)
7. [API Design](#7-api-design)
8. [OAuth 2.0 PKCE Auth Flow](#8-oauth-20-pkce-auth-flow)
9. [Video Architecture](#9-video-architecture--cloudinary)
10. [Shared Design System](#10-shared-design-system)
11. [Backend Module Pattern](#11-backend-module-pattern)
12. [Angular Architecture](#12-angular-architecture)
13. [Coding Standards and Principles](#13-coding-standards-and-principles)
14. [Git Workflow](#14-git-workflow)
15. [Testing Strategy](#15-testing-strategy)
16. [CI/CD Pipeline](#16-cicd-pipeline)
17. [Local Development Setup](#17-local-development-setup)
18. [VS Code Setup](#18-vs-code-setup)
19. [Week-by-Week Execution Plan](#19-week-by-week-execution-plan)
20. [Collaboration Model](#20-collaboration-model)
21. [Pre-Start Checklist](#21-pre-start-checklist)

---

## 1. Project Overview

You are building a production-grade Netflix clone from absolute zero using the MEAN stack,
following industry-standard software engineering practices. Every decision is finalised here.
You write every line of code — this document tells you what, why, and how.

- Fully functional streaming platform: auth, browsing, video playback, search, watchlists, profiles, subscriptions
- Codebase following SOLID, clean code, Repository Pattern, testing, CI/CD, professional Git workflow
- Portfolio-worthy project built the way senior engineers build things

---

## 2. Final Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Frontend** | Angular | **22** | Latest stable, Signals mature, Zoneless change detection |
| **Runtime** | Node.js | **24 LTS** | Native TypeScript type-stripping (`--strip-types`) |
| **Backend** | Express.js | **5.x** | Async errors handled natively |
| **Database** | MongoDB | **8.x** | Flexible schema, Atlas Search built-in |
| **ODM** | Mongoose | **9.x** | ES modules, improved TS generics |
| **Language** | TypeScript | **7.x** | Runs natively on Node 24 — no ts-node or tsc in dev |
| **Auth Protocol** | OAuth 2.0 + PKCE | RFC 7636 | Credentials never touch Angular JS |
| **Auth Library (BE)** | node-oidc-provider | Latest | OIDC-certified, custom EJS views |
| **Auth Library (FE)** | angular-oauth2-oidc | Latest | PKCE, silent renewal, logout |
| **Video CDN** | Cloudinary | Latest SDK | HLS, adaptive bitrate, CDN, signed URLs |
| **Cache** | Redis | **8.x** | Token blocklist, rate limiting, PKCE store |
| **Real-time** | Socket.IO | **4.x** | Phase 2: Watch Together |
| **Payments** | Stripe | Latest | Phase 2: billing |
| **Email** | Resend SDK | Latest | Transactional email |
| **Testing (BE)** | Jest 30 + Supertest | Latest | Unit + integration |
| **Testing (FE)** | Jest (Angular native) | Latest | Angular 22 dropped Karma |
| **Linting** | ESLint **10.x** | Flat config | eslint.config.js format |
| **Formatting** | Prettier | Latest | Auto-format on save |
| **Infrastructure** | Docker + Compose | Latest | MongoDB + Redis local |
| **CI/CD** | GitHub Actions | Latest | Automated pipeline |
| **IDE** | VS Code | Latest | Extensions in Section 18 |

### TypeScript 7 in This Project
Node 24 runs .ts files directly with `--strip-types`. No build step in development.
```bash
node --strip-types src/server.ts   # runs natively, nodemon auto-restarts
```

---

## 3. Three-Server Architecture

```
┌────────────────────────────────────────────────┐
│             AUTH SERVER  :3001                 │
│      Express 5 + node-oidc-provider + EJS      │
├────────────────────────────────────────────────┤
│  EJS Browser Pages:                            │
│    /interaction/:uid/login    Login form       │
│    /interaction/:uid/register Register form    │
│    /auth/forgot-password      Forgot pwd form  │
│    /auth/reset-password/:t    Reset pwd form   │
│  REST API:                                     │
│    POST /oauth/authorize   credentials→code    │
│    POST /oauth/token       code→tokens         │
│    POST /oauth/revoke      logout              │
│    GET  /oauth/jwks        public RS256 keys   │
│    GET  /auth/verify-email/:token              │
│    POST /auth/forgot-password                  │
│    POST /auth/reset-password/:token            │
│  Credentials NEVER reach any JavaScript ✅     │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│              API SERVER  :3000                 │
│             Express 5 — Pure REST API          │
├────────────────────────────────────────────────┤
│  /api/v1/content    /api/v1/profiles           │
│  /api/v1/search     /api/v1/watchlist          │
│  /api/v1/subscriptions  /api/v1/recommendations│
│  /api/v1/content/:id/stream-url               │
│  Verifies JWT via cached /oauth/jwks key       │
│  Never stores passwords. Never issues tokens. ✅│
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│               ANGULAR  :4200                   │
│         Angular 22 SPA — Post-login UI         │
├────────────────────────────────────────────────┤
│  /callback  /browse  /watch/:id                │
│  /profile   /search  /admin                    │
│  Never handles passwords or credentials. ✅     │
└────────────────────────────────────────────────┘

       Both servers share:
  MongoDB :27017       Redis :6379
  (docker compose up starts both)
```

### Why Auth Server Serves EJS Login Pages
If Angular served the login form, credentials pass through Angular JS.
Any XSS vulnerability could expose them.
Auth Server serving the page = browser sends credentials directly to Auth Server.
Angular never sees them. This is how Google, Microsoft, GitHub, Auth0, Okta all work.

### Styling Consistency
Auth pages (EJS) and Angular share `shared/styles/design-tokens.css`.
One file — one change updates every page across all servers.

### CORS
```
Auth Server :3001 → Allow-Origin: http://localhost:4200
API Server  :3000 → Allow-Origin: http://localhost:4200
```

---

## 4. Project Folder Structure

```
netflix-clone/
├── shared/
│   └── styles/
│       └── design-tokens.css  ← CSS variables used by EJS + Angular
│
├── auth-server/
│   └── src/
│       ├── config/
│       │   ├── env.ts          ← validates all env vars on startup
│       │   ├── database.ts     ← MongoDB connection
│       │   └── redis.ts        ← Redis connection
│       ├── modules/
│       │   ├── users/
│       │   │   ├── users.routes.ts
│       │   │   ├── users.controller.ts  ← req/res only
│       │   │   ├── users.service.ts     ← business logic only
│       │   │   ├── users.repository.ts  ← all Mongoose queries
│       │   │   ├── users.model.ts       ← schema + IUser interface
│       │   │   └── users.dto.ts
│       │   └── email/
│       │       ├── email.service.ts
│       │       └── templates/
│       │           ├── verify-email.html    ← HTML sent to inbox
│       │           └── password-reset.html  ← HTML sent to inbox
│       ├── oauth/
│       │   ├── provider.ts      ← node-oidc-provider config
│       │   ├── interactions.ts  ← form submission handlers
│       │   └── jwks.ts          ← RS256 key generation
│       ├── middleware/
│       │   ├── error.middleware.ts
│       │   └── rate-limit.middleware.ts
│       ├── utils/
│       │   ├── logger.ts
│       │   └── app-error.ts
│       ├── views/               ← EJS pages served in browser
│       │   ├── login.ejs
│       │   ├── register.ejs
│       │   ├── forgot-password.ejs
│       │   ├── reset-password.ejs
│       │   └── error.ejs
│       └── server.ts
│
├── api-server/
│   └── src/
│       ├── config/
│       │   ├── env.ts
│       │   ├── database.ts
│       │   ├── redis.ts
│       │   ├── cloudinary.ts
│       │   └── jwks.ts         ← fetches + caches public key from Auth Server
│       ├── modules/
│       │   ├── content/         ← 6-file module pattern
│       │   │   ├── content.routes.ts
│       │   │   ├── content.controller.ts
│       │   │   ├── content.service.ts
│       │   │   ├── content.repository.ts
│       │   │   ├── content.model.ts
│       │   │   └── content.dto.ts
│       │   ├── profiles/        ← same 6-file pattern
│       │   ├── watchlist/       ← same 6-file pattern
│       │   ├── search/          ← same 6-file pattern
│       │   ├── subscriptions/   ← same 6-file pattern
│       │   └── recommendations/ ← same 6-file pattern
│       ├── middleware/
│       │   ├── auth.middleware.ts
│       │   ├── error.middleware.ts
│       │   ├── rate-limit.middleware.ts
│       │   └── upload.middleware.ts
│       ├── utils/
│       │   ├── logger.ts
│       │   ├── app-error.ts
│       │   └── pagination.ts
│       └── server.ts
│
├── client/
│   └── src/
│       ├── app/
│       │   ├── core/
│       │   │   ├── services/
│       │   │   │   ├── auth.service.ts
│       │   │   │   └── token.service.ts
│       │   │   ├── guards/
│       │   │   │   ├── auth.guard.ts
│       │   │   │   ├── admin.guard.ts
│       │   │   │   └── subscription.guard.ts
│       │   │   ├── interceptors/
│       │   │   │   └── auth.interceptor.ts
│       │   │   └── store/             ← app-wide state only
│       │   │       ├── auth.store.ts
│       │   │       └── profile.store.ts
│       │   ├── shared/
│       │   │   ├── components/
│       │   │   │   ├── navbar/
│       │   │   │   ├── content-card/
│       │   │   │   ├── content-row/
│       │   │   │   └── loading-spinner/
│       │   │   ├── pipes/
│       │   │   └── directives/
│       │   ├── features/
│       │   │   ├── browse/
│       │   │   │   ├── store/
│       │   │   │   │   └── content.store.ts  ← browse-only
│       │   │   │   ├── pages/home/
│       │   │   │   ├── components/
│       │   │   │   │   ├── hero-banner/
│       │   │   │   │   └── genre-row/
│       │   │   │   └── browse.routes.ts
│       │   │   ├── player/
│       │   │   │   ├── store/
│       │   │   │   │   └── player.store.ts   ← player-only
│       │   │   │   ├── pages/watch/
│       │   │   │   ├── components/
│       │   │   │   │   ├── video-controls/
│       │   │   │   │   └── quality-selector/
│       │   │   │   └── player.routes.ts
│       │   │   ├── profile/
│       │   │   ├── search/
│       │   │   └── admin/
│       │   ├── app.config.ts
│       │   └── app.routes.ts
│       ├── assets/
│       ├── environments/
│       └── styles/
│           ├── styles.scss
│           └── _mixins.scss
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── package.json
└── README.md
```

---

## 5. Feature Roadmap

### Phase 1 — MVP (Weeks 1-10)
| # | Feature | Description |
|---|---|---|
| 1 | Dev Infrastructure | Docker, Git, ESLint 10, Prettier, project scaffold |
| 2 | Auth System | OAuth 2.0 PKCE, EJS pages, email verify, forgot/reset |
| 3 | User Profiles | Multiple profiles, avatars, maturity ratings |
| 4 | Content Browsing | Home page, hero banner, genre rows, trending |
| 5 | Content Detail | Movie/show page, trailer modal, cast, episodes |
| 6 | Search | Full-text with genre/year/type filters (Atlas Search) |
| 7 | My List | Add/remove from personal watchlist per profile |
| 8 | Video Player | Cloudinary HLS, custom controls, quality selector |
| 9 | Watch Progress | Auto-save every 10s, Continue Watching row |
| 10 | Subscription Plans | Basic/Standard/Premium tiers (UI only) |

### Phase 2 — Advanced (Weeks 11-12)
| # | Feature | Description |
|---|---|---|
| 11 | Recommendation Engine | Content-based filtering from watch history |
| 12 | Rating System | Thumbs up/down, percentage match score |
| 13 | Admin Dashboard | Content CRUD, user management, analytics |
| 14 | Stripe Payments | Real billing, webhooks, subscription guard |
| 15 | Watch Together | Socket.IO synchronised playback |
| 16 | PWA | Service workers, installable, offline browse |

---

## 6. Data Models

### User
```
User {
  _id, email (unique+indexed), passwordHash,
  role: "user"|"admin", isVerified: Boolean,
  profiles: [ObjectId→Profile],
  subscription: {
    plan: "basic"|"standard"|"premium"
    status: "active"|"inactive"|"cancelled"
    startDate, endDate, stripeCustomerId (Phase 2)
  }
  createdAt, updatedAt
}
```

### Profile
```
Profile {
  _id, userId (→User), name, avatar (URL),
  language, maturityRating: "kids"|"teen"|"adult",
  watchHistory: [{ contentId, episodeId, progress (sec), watchedAt }],
  myList: [ObjectId→Content],
  ratings: [{ contentId, rating: "thumbsUp"|"thumbsDown" }]
}
```

### Content
```
Content {
  _id, title (indexed+Atlas Search), description,
  type: "movie"|"series", genres: [String] (indexed),
  cast: [{ name, role, photo }], director, releaseYear,
  maturityRating, duration (movies only),
  thumbnailUrl, bannerUrl, trailerUrl (all Cloudinary),
  videoSources: {
    publicId, hlsUrl,
    qualities: { "480p", "720p", "1080p" }
  }
  seasons: [Season] (series, embedded),
  tags, language, isPublished (indexed), viewCount, createdAt
}

Season { seasonNumber, episodes: [{ episodeNumber, title,
  description, duration, thumbnailUrl, videoSources }] }
```

---

## 7. API Design

All API Server routes prefixed `/api/v1/`. All require `Authorization: Bearer <token>`.

### Content
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/content` | User | Paginated with filter/sort |
| GET | `/content/trending` | User | Top 10 by viewCount |
| GET | `/content/new-releases` | User | Recently added |
| GET | `/content/genre/:genre` | User | By genre |
| GET | `/content/:id` | User | Full detail |
| GET | `/content/:id/stream-url` | User | Cloudinary signed URL (4h) |
| POST | `/content` | Admin | Create |
| PUT | `/content/:id` | Admin | Update |
| DELETE | `/content/:id` | Admin | Delete |

### Profiles
| Method | Endpoint | Description |
|---|---|---|
| GET | `/profiles` | All profiles for current user |
| POST | `/profiles` | Create |
| PUT | `/profiles/:id` | Update |
| DELETE | `/profiles/:id` | Delete |
| POST | `/profiles/:id/watchlist/:contentId` | Toggle My List |
| POST | `/profiles/:id/progress` | Save progress |
| GET | `/profiles/:id/continue-watching` | In-progress list |
| POST | `/profiles/:id/ratings/:contentId` | Rate content |
| GET | `/profiles/:id/recommendations` | Recommendations |

### Search
| Method | Endpoint | Description |
|---|---|---|
| GET | `/search?q=&genre=&year=&type=` | Full-text + filtered |

### Auth Server Endpoints
| Method | Endpoint | Type | Description |
|---|---|---|---|
| GET | `/interaction/:uid/login` | HTML | Login EJS page |
| GET | `/interaction/:uid/register` | HTML | Register EJS page |
| GET | `/auth/forgot-password` | HTML | Forgot password EJS page |
| GET | `/auth/reset-password/:token` | HTML | Reset password EJS page |
| POST | `/oauth/authorize` | JSON | Validate + issue auth code |
| POST | `/oauth/token` | JSON | Code+verifier → tokens |
| POST | `/oauth/revoke` | JSON | Revoke refresh token |
| GET | `/oauth/jwks` | JSON | Public RS256 keys |
| GET | `/auth/verify-email/:token` | Redirect | Verify + redirect |
| POST | `/auth/forgot-password` | JSON | Send reset email |
| POST | `/auth/reset-password/:token` | JSON | Update password |

---

## 8. OAuth 2.0 PKCE Auth Flow

### Why PKCE
Angular is a public client — cannot store a client secret safely.
PKCE replaces it with a cryptographic one-time proof per login.
Intercepted codes are useless without code_verifier only Angular holds.

### Flow
```
① User hits /browse without token → authGuard triggers PKCE flow

② angular-oauth2-oidc generates:
     code_verifier  = random 64 bytes
     code_challenge = BASE64URL(SHA256(code_verifier))

③ Browser redirects to Auth Server:
     GET :3001/oauth/authorize
       ?response_type=code&client_id=netflix-web
       &redirect_uri=http://localhost:4200/callback
       &code_challenge=<hash>&code_challenge_method=S256

④ Auth Server stores code_challenge in Redis (60s)
   → serves login.ejs (Netflix-styled)

⑤ User submits credentials in EJS form
   → go directly to Auth Server
   → Angular JS never sees them ✅

⑥ Auth Server: validates bcrypt → generates auth_code (60s single-use)
   → redirects to: http://localhost:4200/callback?code=<auth_code>

⑦ Angular /callback calls POST :3001/oauth/token:
     { code, code_verifier }

⑧ Auth Server: SHA256(code_verifier) === stored code_challenge ✅
   Issues: access_token (JWT RS256, 15min, in body)
           refresh_token (7 days, httpOnly+Secure+SameSite=Strict cookie)

⑨ Angular stores access_token in Signal (memory — never localStorage)
   → navigates to /browse

⑩ Every API call: Authorization: Bearer <access_token>
   API Server verifies via cached /oauth/jwks — no Auth Server round-trip

⑪ Token expired → silent refresh via cookie → new token → retry

⑫ Logout → POST /oauth/revoke → Redis blocklist → memory cleared
```

### Token Rules
| Token | Storage | Expiry | Notes |
|---|---|---|---|
| Access Token | Angular Signal (memory) | 15 min | Never localStorage |
| Refresh Token | httpOnly cookie | 7 days | JS cannot read it |
| Auth Code | Redis | 60 sec | Single-use only |
| Email Token | Redis | 24 hrs | Invalidated after use |
| Reset Token | Redis | 15 min | Invalidated after use |

Refresh token rotation: every use invalidates old, issues new. Old added to Redis blocklist.

---

## 9. Video Architecture — Cloudinary

### Why Not Express Streaming
Node.js is an application server, not a media server. Large file I/O competes with API
requests on the same event loop. No transcoding, no CDN, no adaptive bitrate, no scale.

### Correct Architecture
```
UPLOAD (Admin):
  Admin Dashboard → POST /api/v1/content (multipart video)
  → API Server → Cloudinary SDK upload + auto-transcode
  → Cloudinary generates: 480p, 720p, 1080p + HLS manifest
  → API Server saves { publicId, hlsUrl } to MongoDB

PLAYBACK:
  Angular → GET /api/v1/content/:id/stream-url
  → API Server generates signed Cloudinary URL (4h expiry)
  → Angular player streams from Cloudinary CDN directly
  → API Server is 100% out of the video byte path ✅
```

Free account: cloudinary.com — 25GB storage + 25GB bandwidth/month. Needed Week 9.

---

## 10. Shared Design System

`shared/styles/design-tokens.css` — imported by Auth Server EJS AND Angular SCSS.
One change updates every page across all servers.

```css
:root {
  --color-primary:       #E50914;   --color-primary-hover: #F40612;
  --color-background:    #141414;   --color-surface:       #1F1F1F;
  --color-surface-alt:   #2F2F2F;   --color-text:          #FFFFFF;
  --color-text-muted:    #B3B3B3;   --color-border:        #404040;
  --color-success:       #46D369;   --color-error:         #E87C03;

  --font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 11px;   --font-size-sm: 13px;   --font-size-base: 15px;
  --font-size-lg: 18px;   --font-size-xl: 24px;   --font-size-2xl: 32px;
  --font-size-hero: 48px;
  --font-weight-normal: 400; --font-weight-medium: 500;
  --font-weight-semibold: 600; --font-weight-bold: 700;

  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-6:24px; --space-8:32px; --space-12:48px; --space-16:64px;

  --radius-sm:4px; --radius-md:6px; --radius-lg:10px; --radius-full:9999px;
  --input-height:50px; --input-bg:#333333; --input-radius:4px;
  --transition-fast:150ms ease; --transition-base:250ms ease;
}
```

---

## 11. Backend Module Pattern

Every module in both servers follows an identical 6-file pattern. No exceptions.

### 6-File Structure
```
modules/content/
├── content.routes.ts      ← URL definitions → controller methods
├── content.controller.ts  ← req/res only, zero business logic
├── content.service.ts     ← business logic only, calls repository
├── content.repository.ts  ← ALL Mongoose queries, only place Model is called
├── content.model.ts       ← Mongoose schema + IContent interface
└── content.dto.ts         ← CreateContentDto, UpdateContentDto, ContentResponseDto
```

### 5-Layer Call Chain — Never Skip a Layer
```
routes → controller → service → repository → model
```

### Why Repository Layer
```typescript
// Without repository — Mongoose in service (wrong):
export const contentService = {
  getFeatured: async () => {
    return await Content.find({ isPublished: true })
      .sort({ viewCount: -1 }).limit(10).lean();  // wrong layer
  }
};

// With repository — service is pure business logic (correct):
export const contentService = {
  getFeatured: async () => {
    return await contentRepository.findFeatured(10); // clean
  }
};

export const contentRepository = {
  findFeatured: async (limit: number) => {
    return await Content
      .find({ isPublished: true })
      .sort({ viewCount: -1 })
      .limit(limit)
      .lean();
  }
};
```

### Node.js Module System as DI
Express has no DI container. No constructors needed.
Node module caching = every import returns the same cached instance = singleton.
```typescript
// Plain exported objects — module cache provides the singleton
export const contentRepository = { findById, findFeatured, create, update, deleteById };
export const contentService    = { getFeatured, getByGenre, getById };
```

### Testing Without DI Container
```typescript
jest.mock("./content.repository", () => ({
  contentRepository: {
    findFeatured: jest.fn().mockResolvedValue([...mockContent])
  }
}));
// contentService.getFeatured() calls mock — no MongoDB needed
```

### Custom Error Classes
```typescript
class AppError          extends Error { constructor(msg, statusCode, isOperational=true) }
class ValidationError   extends AppError { constructor(msg) { super(msg, 400) } }
class UnauthorizedError extends AppError { constructor(msg) { super(msg, 401) } }
class ForbiddenError    extends AppError { constructor(msg) { super(msg, 403) } }
class NotFoundError     extends AppError { constructor(msg) { super(msg, 404) } }
class ConflictError     extends AppError { constructor(msg) { super(msg, 409) } }
```
One global error middleware catches everything. Express 5 handles async natively.

---

## 12. Angular Architecture

### Standalone Components — No NgModules
Angular 22 uses standalone components exclusively. No NgModule files anywhere.

### Zoneless Change Detection
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideOAuthClient({ ... })
  ]
};
```

### State Management (NgRx Signal Store)
| Store | Location | State |
|---|---|---|
| auth.store.ts | core/store/ | currentUser, isLoggedIn (app-wide) |
| profile.store.ts | core/store/ | activeProfile (navbar, guards, everywhere) |
| content.store.ts | features/browse/store/ | rows, trending (browse only) |
| player.store.ts | features/player/store/ | video, progress, quality (player only) |

Rule: 2+ features need it → core/store/. Only 1 feature → that feature's store/ folder.

### Lazy Routes
```typescript
export const appRoutes: Routes = [
  { path: "",          redirectTo: "/browse", pathMatch: "full" },
  { path: "callback",  loadComponent: () => import("./features/auth/callback/callback.component") },
  { path: "browse",    loadChildren: () => import("./features/browse/browse.routes"),
                       canActivate: [authGuard] },
  { path: "watch/:id", loadChildren: () => import("./features/player/player.routes"),
                       canActivate: [authGuard, subscriptionGuard] },
  { path: "profile",   loadChildren: () => import("./features/profile/profile.routes"),
                       canActivate: [authGuard] },
  { path: "search",    loadChildren: () => import("./features/search/search.routes"),
                       canActivate: [authGuard] },
  { path: "admin",     loadChildren: () => import("./features/admin/admin.routes"),
                       canActivate: [authGuard, adminGuard] },
  { path: "**",        redirectTo: "/browse" }
];
```

---

## 13. Coding Standards and Principles

### SOLID
| Principle | Application |
|---|---|
| S — Single Responsibility | Each file does exactly one thing |
| O — Open/Closed | Recommendation strategies extended without modifying existing |
| L — Liskov Substitution | All DTOs fully substitutable |
| I — Interface Segregation | Separate Create/Update/Response DTOs |
| D — Dependency Inversion | Angular DI container; Node module singletons |

### Clean Code — Always
- Functions: single purpose, max 30 lines
- No magic numbers: named constants or enums
- No `any` type: every value explicitly typed
- Names tell the story: getUserWatchHistory() not getData()
- No secrets in source: .env only, validated on startup
- Comments explain WHY not WHAT

### Security Checklist
| Concern | Implementation |
|---|---|
| NoSQL Injection | Mongoose strict schema + express-mongo-sanitize |
| XSS | helmet + Angular built-in sanitization |
| CSRF | SameSite=Strict cookie + OAuth state param |
| Brute Force | 5 attempts → 15-min Redis lock |
| Passwords | bcrypt cost factor 12 |
| Access Token | Angular Signal memory only |
| Refresh Token | httpOnly + Secure + SameSite=Strict cookie |
| CORS | Allowlist: http://localhost:4200 only |
| Rate Limiting | express-rate-limit + Redis |
| Dependencies | npm audit in every CI run |

---

## 14. Git Workflow

### Branches
```
main      ← production only — no direct commits
develop   ← integration branch
feature/  ← new features (from develop)
fix/      ← bug fixes (from develop)
chore/    ← tooling, config, dependencies
```

### Conventional Commits
```
feat(auth): implement OAuth 2.0 PKCE authorization flow
feat(content): add paginated listing with genre filter
fix(player): resolve HLS stream failing on Safari
chore(docker): add MongoDB 8 and Redis 8 to docker-compose
test(profiles): add unit tests for watchlist toggle
refactor(content): extract search into dedicated repository method
docs(api): document content endpoints
```

---

## 15. Testing Strategy

```
         ┌──────────┐
         │   E2E    │  Cypress — 5-8 critical user flows
         ├──────────┤
         │Integration│  Supertest — API routes, real test MongoDB
         ├──────────┤
         │   Unit   │  Jest — services, repos, Angular components
         └──────────┘
```

### Coverage Targets
| Layer | Target |
|---|---|
| Auth/API services | 80% |
| Repositories + controllers | 70% |
| Angular services | 75% |
| Angular components | 60% |

---

## 16. CI/CD Pipeline

### On Every Push to feature/* and develop
```
1-3.  Install deps (auth-server, api-server, client)
4-6.  ESLint 10 (all 3 servers)
7-9.  TypeScript type-check (all 3 servers)
10-12. Jest unit tests (all 3)
13.   Supertest integration tests
14.   Angular production build
```

### On Merge to main
```
15-16. Build Docker images (auth-server, api-server)
17.    Push to registry
18.    Deploy
```

---

## 17. Local Development Setup

| Service | Address | Command |
|---|---|---|
| MongoDB | :27017 | docker compose up |
| Redis | :6379 | docker compose up |
| Auth Server | :3001 | npm run dev in auth-server/ |
| API Server | :3000 | npm run dev in api-server/ |
| Angular | :4200 | ng serve in client/ |

### docker-compose.yml
```yaml
version: "3.9"
services:
  mongodb:
    image: mongo:8
    container_name: netflix_mongodb
    ports: ["27017:27017"]
    volumes: [mongodb_data:/data/db]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: secret
  redis:
    image: redis:8-alpine
    container_name: netflix_redis
    ports: ["6379:6379"]
    volumes: [redis_data:/data]
volumes:
  mongodb_data:
  redis_data:
```

```bash
docker compose up -d     # start
docker compose down      # stop (data preserved)
docker compose down -v   # stop + wipe all data
```

### Root package.json Scripts
```json
{
  "scripts": {
    "infra":  "docker compose up -d",
    "auth":   "cd auth-server && npm run dev",
    "api":    "cd api-server && npm run dev",
    "client": "cd client && ng serve",
    "dev":    "npm run infra && concurrently \"npm run auth\" \"npm run api\" \"npm run client\""
  },
  "devDependencies": { "concurrently": "^9.0.0" }
}
```

### .env.example
```env
# Auth Server
AUTH_PORT=3001
AUTH_MONGODB_URI=mongodb://root:secret@localhost:27017/netflix_auth?authSource=admin
AUTH_REDIS_URL=redis://localhost:6379
AUTH_OIDC_ISSUER=http://localhost:3001
AUTH_CLIENT_ID=netflix-web
AUTH_REDIRECT_URI=http://localhost:4200/callback
AUTH_BCRYPT_ROUNDS=12
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev

# API Server
API_PORT=3000
API_MONGODB_URI=mongodb://root:secret@localhost:27017/netflix_api?authSource=admin
API_REDIS_URL=redis://localhost:6379
AUTH_SERVER_JWKS_URL=http://localhost:3001/oauth/jwks
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 18. VS Code Setup

### Required Extensions
| Extension | Purpose |
|---|---|
| Angular Language Service | Template intellisense |
| ESLint | Real-time linting |
| Prettier - Code Formatter | Auto-format on save |
| Thunder Client | In-IDE API testing |
| GitLens | Git blame and history |
| MongoDB for VS Code | Browse collections inline |
| Docker | Container management |
| Error Lens | Inline error highlighting |
| Path Intellisense | Import autocomplete |
| Material Icon Theme | File type icons |

### netflix-clone.code-workspace
```json
{
  "folders": [
    { "name": "auth-server", "path": "./auth-server" },
    { "name": "api-server",  "path": "./api-server"  },
    { "name": "client",      "path": "./client"       },
    { "name": "shared",      "path": "./shared"       }
  ],
  "settings": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
    "editor.tabSize": 2,
    "typescript.preferences.quoteStyle": "single",
    "files.eol": "\n"
  }
}
```

---

## 19. Week-by-Week Execution Plan

| Week | Servers | What We Build |
|---|---|---|
| 1 | All | nvm-windows, Node 24, Docker Desktop, VS Code extensions, Git repo, monorepo scaffold, code-workspace, docker-compose, ESLint 10, Prettier, root scripts, design-tokens.css |
| 2 | Auth + API | Express 5 bootstrap both servers, MongoDB+Redis connections, Winston, GET /health, global error middleware, custom error classes |
| 3 | Auth | User model, bcrypt registration, node-oidc-provider, RS256 JWKS, /oauth/authorize + /oauth/token with PKCE |
| 4 | Auth | EJS login+register+forgot+reset pages, Resend SDK integration, email HTML templates |
| 5 | Angular | angular-oauth2-oidc setup, PKCE, /callback, authGuard, interceptor, AuthStore, full login to /browse flow |
| 6 | API+Angular | Content model+CRUD API (6 files), seed script, hero banner, genre rows, content card |
| 7 | API+Angular | Atlas Search index, search API+page, content detail page, trailer modal |
| 8 | API+Angular | Profile model+API, profile switcher, ProfileStore, watchlist+My List, watch progress+Continue Watching |
| 9 | API+Angular | Cloudinary config, admin upload, signed stream URL, custom HLS player, quality selector, keyboard shortcuts, auto-save |
| 10 | API+Angular | Subscription model+guard+plans page, recommendation engine, rating API+UI, admin dashboard |
| 11 | All | Full Jest suite, Cypress E2E (5 flows), ESLint clean, Lighthouse audit, accessibility |
| 12 | All | GitHub Actions CI/CD, Docker prod builds, Angular prod build, deployment |

---

## 20. Collaboration Model

Every feature, every week:
```
① EXPLAIN   What we are building and why — before any code
② POINT     Exactly which file to create or open in VS Code
③ CODE      Code in small, understandable pieces
④ TEACH     Every non-obvious line explained — you understand not just copy
⑤ VERIFY    You run it, test in Thunder Client, share errors
⑥ PROCEED   Next piece only when current piece works
```

---

## 21. Pre-Start Checklist

```
[ ] VS Code installed
[ ] All 10 extensions installed (Section 18)
[ ] Git installed and configured (user.name + user.email)
[ ] GitHub account + empty repo created: netflix-clone
[ ] Docker Desktop installed and running
[ ] Project directory decided
[ ] Cloudinary free account created at cloudinary.com (needed Week 9)
```

Node 24 and Angular CLI are installed in Week 1 Step 1.

---

> Document version: 1.0 — Final
> All decisions settled. No open questions.
> Say "Lets start Week 1" and the first exact command follows immediately.