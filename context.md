# Implementation Context — Personal Technology Ecosystem Planner

> **Last Updated:** 2026-09-01  
> **Purpose:** Complete implementation tracking file for codebase context across sessions

---

## 1. Project Structure

```
eco_sys_planner/
├── backend/                        # FastAPI Backend (Python 3.12)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py               # Env vars: DB, JWT, CORS
│   │   ├── database.py             # SQLAlchemy engine + SessionLocal
│   │   ├── main.py                 # FastAPI app, CORS, router registration
│   │   ├── models/                 # ORM Models (7 tables)
│   │   │   ├── user.py             # USER table
│   │   │   ├── product.py          # PRODUCT table
│   │   │   ├── bundle.py           # BUNDLE + BUNDLE_ITEM tables
│   │   │   ├── saved_bundle.py     # SAVED_BUNDLES table
│   │   │   ├── admin.py            # ADMIN table
│   │   │   └── compatibility.py    # COMPATIBILITY_RULES table
│   │   ├── schemas/                # Pydantic request/response models
│   │   │   ├── auth.py             # UserRegister, UserLogin, UserResponse, UserUpdate, TokenResponse
│   │   │   ├── product.py          # ProductCreate, ProductUpdate, ProductResponse, ProductFilter
│   │   │   └── bundle.py           # GenerateBundlesRequest, BundleResponse, SavedBundleResponse
│   │   ├── routes/                 # API Endpoints
│   │   │   ├── auth.py             # /api/v1/auth (register, login, GET/PUT /me, PUT /me/password)
│   │   │   ├── products.py         # /api/v1/products (list, search, filter, paginate)
│   │   │   ├── bundles.py          # /api/v1/bundles (generate, compare, save, export PDF)
│   │   │   └── admin.py            # /api/v1/admin (login, seed, CRUD products, admin management)
│   │   ├── services/               # Business Logic
│   │   │   ├── auth_service.py     # Register + authenticate users
│   │   │   ├── product_service.py  # Product queries, filters, pagination
│   │   │   ├── bundle_service.py   # Bundle CRUD, save/unsave
│   │   │   ├── recommendation_engine.py  # Core algorithm (5 steps)
│   │   │   ├── budget_optimizer.py       # Usage-based budget allocation
│   │   │   ├── compatibility_checker.py  # Ecosystem compatibility scoring
│   │   │   └── pdf_service.py            # ReportLab PDF generation
│   │   └── utils/
│   │       ├── security.py         # bcrypt hashing + JWT (python-jose)
│   │       └── dependencies.py     # get_current_user dependency
│   ├── seed_data/                  # JSON product seed data
│   ├── seed_database.py            # Database seeder script
│   ├── alembic/                    # Database migrations
│   ├── requirements.txt            # Python dependencies
│   └── .env                        # DATABASE_URL, JWT_SECRET_KEY
│
├── frontend/                       # React + Vite Frontend
│   ├── src/
│   │   ├── main.jsx                # ReactDOM entry point
│   │   ├── App.jsx                 # Router + AuthProvider + Toaster
│   │   ├── index.css               # Global design system (CSS variables, glass effects)
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Auth state: user, login, register, logout, updateProfile
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top nav + profile dropdown (edit profile, change password)
│   │   │   ├── Navbar.css
│   │   │   ├── BundleCard.jsx      # Bundle result card with save/compare/export
│   │   │   ├── BundleCard.css
│   │   │   ├── CompareModal.jsx    # Side-by-side bundle comparison overlay
│   │   │   └── CompareModal.css
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx/css # Public marketing page
│   │   │   ├── LoginPage.jsx       # User login + admin login link + back to home
│   │   │   ├── RegisterPage.jsx    # Registration (name, email, password, ecosystem)
│   │   │   ├── AuthPages.css       # Shared auth page styles
│   │   │   ├── DashboardPage.jsx/css # Main recommendation UI (budget/eco/usage → bundles)
│   │   │   ├── SavedPage.jsx/css   # User's bookmarked bundles
│   │   │   ├── ComparePage.jsx/css # Full-page comparison (route-based)
│   │   │   ├── ProductsPage.jsx/css # Browse products with filters + pagination
│   │   │   └── AdminPage.jsx/css   # Admin login gate + dashboard (products CRUD + admin mgmt)
│   │   └── services/
│   │       ├── api.js              # Axios instance with JWT interceptor
│   │       ├── authService.js      # Auth API calls
│   │       ├── bundleService.js    # Bundle API calls + PDF download
│   │       ├── productService.js   # Product API calls
│   │       └── adminService.js     # Admin API calls (login, CRUD, admin mgmt)
│   └── package.json
│
├── context.md                      # This file — implementation tracking
├── SRS document.docx               # Original SRS document
├── SDD_Personal_Technology_Ecosystem_Planner.docx  # SDD document
└── extracted_srs.txt               # Extracted SRS text
```

---

## 2. Database Schema (7 Tables)

### USER
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, Auto-increment |
| name | String(100) | NOT NULL |
| email | String(255) | UNIQUE, NOT NULL, Indexed |
| password_hash | String(255) | NOT NULL |
| preferred_ecosystem | String(20) | Nullable |
| created_at | DateTime(tz) | server_default=now() |
| updated_at | DateTime(tz) | onupdate=now() |

### PRODUCT
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, Auto-increment |
| category | String(50) | NOT NULL, Indexed (Laptop/Smartphone/Earbuds/Smartwatch/Accessories) |
| brand | String(100) | NOT NULL, Indexed |
| model | String(200) | NOT NULL |
| price | Float | NOT NULL (INR) |
| rating | Float | Default 0.0 (0-5) |
| ecosystem | String(20) | NOT NULL, Indexed (Apple/Android/Windows/Linux/Universal) |
| specs | JSONB | Nullable — flexible technical specifications |
| image_url | String(500) | Nullable |
| is_active | Boolean | Default True — soft delete support |
| created_at | DateTime(tz) | server_default=now() |

### BUNDLE
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, Auto-increment |
| user_id | Integer | FK → users.id, CASCADE |
| total_price | Float | NOT NULL |
| compatibility_score | Float | Default 0.0 (0-100) |
| value_score | Float | Default 0.0 (0-100) |
| overall_score | Float | Default 0.0 (0-100) |
| usage_profile | String(20) | NOT NULL |
| ecosystem | String(20) | NOT NULL |
| budget | Float | NOT NULL |
| created_at | DateTime(tz) | server_default=now() |

### BUNDLE_ITEM
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, Auto-increment |
| bundle_id | Integer | FK → bundles.id, CASCADE |
| product_id | Integer | FK → products.id, RESTRICT |
| category | String(50) | NOT NULL |

### SAVED_BUNDLES
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, Auto-increment |
| user_id | Integer | FK → users.id, CASCADE |
| bundle_id | Integer | FK → bundles.id, CASCADE |
| saved_at | DateTime(tz) | server_default=now() |

### ADMIN
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, Auto-increment |
| username | String(100) | UNIQUE, NOT NULL |
| password_hash | String(255) | NOT NULL |
| role | String(20) | Default "admin" — Enum: superadmin, admin |
| created_at | DateTime(tz) | server_default=now() |

### COMPATIBILITY_RULES
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, Auto-increment |
| ecosystem_a | String(20) | NOT NULL |
| ecosystem_b | String(20) | NOT NULL |
| score | Float | Default 50.0 (0-100) |

---

## 3. API Endpoints (21 total)

### Auth — `/api/v1/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /register | Public | Create user account |
| POST | /login | Public | Login → JWT token |
| GET | /me | JWT | Get current user profile |
| PUT | /me | JWT | Update name/email/ecosystem |
| PUT | /me/password | JWT | Change password (requires current password) |

### Products — `/api/v1/products`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | JWT | List products (pagination, filters, search, sort) |

### Bundles — `/api/v1/bundles`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /generate | JWT | Generate top 5 bundles |
| GET | /{id} | JWT | Get bundle details |
| POST | /compare | JWT | Compare 2-5 bundles |
| POST | /{id}/save | JWT | Bookmark a bundle |
| GET | /saved/list | JWT | List user's saved bundles |
| DELETE | /saved/{id} | JWT | Remove from saved |
| GET | /{id}/export | JWT | Download bundle as PDF |

### Admin — `/api/v1/admin`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /login | Public | Admin login → JWT |
| POST | /seed | Public | Create default superadmin |
| GET | /stats | Admin | Dashboard statistics |
| POST | /products | Admin | Create product |
| PUT | /products/{id} | Admin | Update product |
| DELETE | /products/{id} | Admin | Delete product |
| PUT | /me | Admin (X-Admin-Id) | Update own username/password |
| GET | /admins | Admin | List all admins |
| POST | /admins | Superadmin only | Create new admin |
| DELETE | /admins/{id} | Superadmin only | Delete an admin |

---

## 4. Frontend Routes (8 pages)

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | LandingPage | Public (redirects if logged in) | Marketing page |
| `/login` | LoginPage | Public | User login + admin login link |
| `/register` | RegisterPage | Public | User registration |
| `/dashboard` | DashboardPage | Protected | Budget/eco/usage → bundles |
| `/saved` | SavedPage | Protected | Saved bundles list |
| `/compare` | ComparePage | Protected | Bundle comparison |
| `/products` | ProductsPage | Protected | Browse products with filters + pagination |
| `/admin` | AdminPage | Standalone (own auth) | Admin login gate + dashboard |

---

## 5. Recommendation Algorithm

```
Step 1: allocate_budget(budget, usage_profile)
  → Per-category allocation with ±30% tolerance
  → 6 profiles: Gaming, Creator, Office, Student, Photography, Travel
  → Category weights (e.g., Gaming: Laptop 60%, Smartphone 20%, Earbuds 8%, Watch 7%, Acc 5%)

Step 2: For each category (Laptop, Smartphone, Earbuds, Smartwatch, Accessories):
  → Query products matching ecosystem + budget range
  → Fallback 1: Expand range to 0–2× max
  → Fallback 2: Get cheapest products regardless of budget
  → Limit to top 8 by rating to avoid combinatorial explosion

Step 3: Generate combinations
  → If ≤500 total combos: Try all (itertools.product)
  → If >500: Random sampling (500 attempts)
  → Filter: total price ≤ budget × 1.15

Step 4: Score each bundle (composite formula)
  → Compatibility (30%): Pairwise ecosystem matching via rules matrix
  → Value (30%): Rating + price efficiency relative to target allocation
  → Rating (20%): Average product rating normalized to 0-100
  → Budget Fit (20%): How well total price utilizes the budget

Step 5: Sort by overall score → Return top 5 → Save to DB with relationships
```

---

## 6. Authentication Architecture

### User Auth
- **Registration**: bcrypt hash → save to `users` table
- **Login**: Verify password → JWT token (24h expiry, HS256)
- **Session**: Token stored in `localStorage`, user object in `localStorage`
- **Interceptor**: Axios auto-attaches `Authorization: Bearer <token>`
- **401 handling**: Auto-redirect to `/login`, clear storage
- **Profile**: Editable via Navbar dropdown (name, email, ecosystem, password)

### Admin Auth (Separate System)
- **Login**: `/api/v1/admin/login` → JWT with admin `role` claim
- **Session**: Token in `sessionStorage` (`admin_token`), admin data in `admin_user`
- **Role Enum**: `superadmin` (gold badge), `admin` (blue badge)
- **Permissions**:
  - Both roles: Product CRUD, view stats, update own profile
  - Superadmin only: Create/delete admin accounts
  - Superadmin role assignment: Only via direct database update
- **Seed**: `POST /api/v1/admin/seed` → creates username `admin`, password `admin123`, role `superadmin`

---

## 7. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Routing | react-router-dom v6 |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Icons | react-icons (HiOutline set) |
| Styling | Vanilla CSS + CSS Variables (glassmorphism dark theme) |
| Backend | FastAPI (Python 3.12) |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Validation | Pydantic v2 |
| PDF | ReportLab |
| Database | PostgreSQL (with JSONB support) |
| Dev Servers | Uvicorn (backend :8000), Vite (frontend :5173) |

---

## 8. Validation Rules

### User Registration / Profile Edit
- **Name**: Min 2 chars, letters and spaces only (`/^[a-zA-Z\s]+$/`)
- **Email**: Valid format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- **Password**: Min 6 chars, must contain both letters and numbers

### Admin
- **Username**: Min 3 chars, unique
- **Password**: Min 6 chars

### Budget
- **Min**: ₹5,000 | **Max**: ₹5,00,000

---

## 9. Seed Data
- **Products**: Loaded from `backend/seed_data/` JSON files via `python seed_database.py`
- **Default Admin**: `POST /api/v1/admin/seed` → username: `admin`, password: `admin123`, role: `superadmin`
- **Compatibility Rules**: Hardcoded defaults in `compatibility_checker.py`, overridable via DB table
