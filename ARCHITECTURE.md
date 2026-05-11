# Acquisitions API Architecture

## 1. Big Picture

**Project Type**: RESTful Web API built with Node.js, Express, and TypeScript.

**Problem Solved**: Provides a secure backend for user acquisition management — handling user registration, JWT-based authentication, and full CRUD operations on user profiles. The system enforces role-based access control (RBAC) and integrates with modern security tooling to protect against common web attacks.

**Target Users**: Backend developers building user-facing applications that need a ready-made, secure authentication and user management layer.

---

## 2. Core Architecture

The application follows a **layered (n-tier) architecture** with strict separation of concerns:

```
src/
├── app.ts                    # Express application setup and middleware
├── server.ts                 # HTTP server entry point
├── index.ts                  # Application bootstrap (dotenv initialization)
├── config/                   # Configuration modules
│   ├── database.ts           # Drizzle ORM + Neon PostgreSQL connection
│   ├── arcjet.ts             # Arcjet security rules (shield, bot detection, rate limiting)
│   └── logger.ts             # Winston structured logger configuration
├── middleware/                # Custom middleware
│   └── security.middleware.ts # Arcjet rate limiting by role (guest/user/admin)
├── controllers/              # HTTP request handlers
│   ├── auth.controller.ts    # Authentication: register, login, logout
│   └── user.controller.ts    # User CRUD: get, getById, update, delete
├── routes/                   # Express Router definitions
│   ├── auth.routes.ts        # Auth routes: POST /register, /login, /logout
│   └── users.routes.ts       # User routes: GET /, /:id, PUT /:id, DELETE /:id
├── services/                 # Business logic layer
│   ├── auth.service.ts       # Auth logic: hashPassword, comparePassword, createUser, authenticateUser
│   └── users.services.ts     # User CRUD logic: getUsers, getUserById, updateUser, deleteUser
├── validations/              # Zod input validation schemas
│   ├── auth.validation.ts    # Auth schemas: registerSchema, logInSchema
│   ├── users.validation.ts   # User schemas: userIdSchema, updateUserSchema
│   └── format.ts             # Validation error formatter (ZodError → human-readable string)
├── models/                   # Drizzle ORM table schema definitions
│   └── user.model.ts         # `users` table schema
├── types/                    # TypeScript type definitions
│   ├── service.types.ts      # CreateUser interface, UserResponse type
│   ├── express.d.ts          # Global Express Request augmentation (req.user)
│   └── middleware.types.ts   # Arcjet custom rate limit options type
└── utils/                    # Shared utility functions
    ├── jwt.ts                # JWT sign (async) and verify (sync) using jsonwebtoken
    └── cookies.ts            # Cookie helpers: set, clear, get with secure defaults
└── __tests__/                # Integration tests
    └── app.test.ts           # Health check and API status tests
```

### Data Flow (Vertical Slice)

```
HTTP Request
    ↓
[Middleware Layer]          ← helmet, cors, json, urlencoded, cookieParser, morgan, securityMiddleware (Arcjet)
    ↓
[Routing Layer]             ← Express Router delegates to controller method
    ↓
[Controller Layer]          ← Zod safeParse() validation → 400 on failure → delegates to service
    ↓
[Service Layer]             ← Business logic, database operations via Drizzle ORM
    ↓
[Persistence Layer]          ← Drizzle ORM → PostgreSQL (Neon)
    ↓
[Response]                  ← Formatted JSON response flows back up through layers
```

---

## 3. Key Components

### 3.1 Application Bootstrap (`src/index.ts`)

- Loads environment variables via `dotenv.config()`
- Imports `server.ts` which triggers the Express app to start listening

### 3.2 Application Setup (`src/app.ts`)

- Configures Express middleware stack:
  - `helmet()` — sets security headers (CSP, HSTS, X-Frame-Options, etc.)
  - `cors()` — enables cross-origin resource sharing
  - `express.json()` — parses JSON request bodies
  - `urlencoded({ extended: true })` — parses URL-encoded bodies
  - `cookieParser()` — parses cookies attached to requests
  - `morgan('combined')` — logs HTTP requests via Winston
  - `securityMiddleware` — custom Arcjet middleware for rate limiting, bot detection, and shield
- Defines public health check endpoints: `GET /`, `GET /health`, `GET /api`
- Mounts authentication routes at `/api/auth`
- Mounts user CRUD routes at `/api/users`
- Catches unmatched routes with a 404 handler

### 3.3 Server Entry (`src/server.ts`)

- Creates HTTP server using `app.listen()` on `process.env.PORT` (default: 3000)
- Binds to `0.0.0.0` for container compatibility

### 3.4 Configuration (`src/config/`)

- **database.ts**: Creates a Neon serverless PostgreSQL connection using `@neondatabase/serverless`, wraps it with `drizzle()` from `drizzle-orm/neon-http` for type-safe query building
- **arcjet.ts**: Configures Arcjet client with three rules:
  - `shield({ mode: 'LIVE' })` — blocks suspicious requests (SQL injection, etc.)
  - `detectBot({ mode: 'LIVE' })` — detects and blocks bots (allows search engines and preview crawlers)
  - `slidingWindow({ mode: 'LIVE', interval: '2s', max: 5 })` — base rate limiting
- **logger.ts**: Configures Winston with:
  - File transports: `logs/error.log` (errors only) and `logs/combined.log` (all levels)
  - Console transport in development with colorized output
  - JSON format in production, simple format in development

### 3.5 Security Middleware (`src/middleware/security.middleware.ts`)

- Intercepts all requests after Arcjet base config
- Determines caller role from `req.user?.role` (defaults to `'guest'`)
- Applies **role-based sliding window rate limits**:
  - Admin: 20 requests/minute
  - User: 10 requests/minute
  - Guest: 5 requests/minute
- Blocks requests detected as bots, shield threats, or rate limit violations with `403 Forbidden`
- Logs all blocked requests with IP, User-Agent, and path

### 3.6 Routes (`src/routes/`)

- **auth.routes.ts**: Defines authentication endpoints
  - `POST /register` → `auth.controller.register`
  - `POST /login` → `auth.controller.signin`
  - `POST /logout` → `auth.controller.signout`
- **users.routes.ts**: Defines user CRUD endpoints
  - `GET /` → `user.controller.getAllUsers`
  - `GET /:id` → `user.controller.getUserByIdHandler`
  - `PUT /:id` → `user.controller.updateUserHandler`
  - `DELETE /:id` → `user.controller.deleteUserHandler`
- Routes delegate entirely to controllers; no business logic lives here

### 3.7 Controllers (`src/controllers/`)

- **auth.controller.ts**: Handles authentication requests
  - `register` — validates with `registerSchema`, creates user via service, signs JWT, sets HTTP-only cookie
  - `signin` — validates with `logInSchema`, authenticates via service, signs JWT, sets HTTP-only cookie
  - `signout` — clears authentication cookie
- **user.controller.ts**: Handles user CRUD requests
  - `getAllUsers` — retrieves all users from service
  - `getUserByIdHandler` — validates `:id` param, retrieves single user
  - `updateUserHandler` — validates param + body, enforces authorization rules, updates user
  - `deleteUserHandler` — validates param, enforces authorization rules, deletes user

**Controller Pattern** (consistent across all controllers):
1. Validate input with Zod `safeParse()`
2. Return `400` with formatted validation errors on failure
3. Delegate to service layer for business logic
4. Log on success and failure
5. Handle known errors with specific HTTP status codes
6. Forward unknown errors via `next(e)` to Express default error handler

### 3.8 Services (`src/services/`)

- **auth.service.ts**: Authentication business logic
  - `hashPassword(password)` — bcrypt hashing with 10 salt rounds
  - `comparePassword(password, hashedPassword)` — bcrypt comparison
  - `authenticateUser(email, password)` — queries user by email, verifies password, returns user without password field
  - `createUser(userData)` — checks for duplicate email, hashes password, inserts user, excludes password from return
- **users.services.ts**: User CRUD business logic
  - `getUsers()` — selects all users with explicit column projection (omits password)
  - `getUserById(id)` — queries by ID, throws "User not found" if absent
  - `updateUser(id, updates)` — checks existence, applies partial update with `updatedAt` refresh, returns updated user
  - `deleteUser(id)` — checks existence before deletion, throws "User not found" if absent

**Service Pattern** (consistent across all services):
1. Wrap all database operations in try/catch
2. Log errors with context before re-throwing
3. Explicit return type annotations on all functions
4. Use Drizzle ORM query builder (no raw SQL)

### 3.9 Models (`src/models/`)

- **user.model.ts**: Defines `users` table using Drizzle ORM schema
  - Fields: `id` (serial PK), `name` (varchar 255), `email` (varchar 255, unique), `password` (varchar 255), `role` (varchar 50, default `'user'`), `createdAt` and `updatedAt` (timestamps with `defaultNow()`)

### 3.10 Utilities (`src/utils/`)

- **jwt.ts**: JWT token operations
  - `jwttoken.sign(payload)` — async, uses `jsonwebtoken`, 1-day expiry, logs errors on failure
  - `jwttoken.verify(token)` — sync, logs and throws on verification failure
- **cookies.ts**: Cookie management utilities
  - `cookies.set(res, name, value)` — sets cookie with secure defaults (httpOnly, secure in production, sameSite=strict, maxAge=15min)
  - `cookies.clear(res, name)` — clears cookie with same secure defaults
  - `cookies.get(req, name)` — retrieves cookie value from request

### 3.11 Validations (`src/validations/`)

- **auth.validation.ts**: Zod schemas for authentication
  - `registerSchema` — name (2-255, required), email (valid format, max 255, lowercased), password (6-128, required), role (enum: `"user" | "admin"`, defaults to `"user"`)
  - `logInSchema` — email (valid format, max 255, lowercased, required), password (6-128, required)
- **users.validation.ts**: Zod schemas for user CRUD
  - `userIdSchema` — validates `:id` param as positive integer via `z.coerce.number().int().positive()`
  - `updateUserSchema` — optional fields: name (2-255), email (valid format), role (enum)
- **format.ts**: `formatValidationError(errors)` converts Zod `ZodError` into a human-readable comma-separated string of error messages

### 3.12 Types (`src/types/`)

- **service.types.ts**: Core type definitions
  - `CreateUser` — `{ id?: number; name: string; email: string; password: string; role: 'user' | 'admin' }`
  - `UserResponse` — `Omit<CreateUser, 'password'>`
- **express.d.ts**: Augments the global `Express.Request` interface with an optional `user` property typed as `CreateUser`, enabling type-safe access to authenticated user data in controllers
- **middleware.types.ts**: `CustomSlidingWindowLimitOptions` extending Arcjet's `SlidingWindowRateLimitOptions` with an optional `name` field

---

## 4. Authorization Model

User endpoints enforce role-based access control at the **controller layer**:

| Action       | Own Profile | Admin | Other Users |
|-------------|-------------|-------|-------------|
| Read (GET)  | ✅           | ✅    | ✅           |
| Update (PUT)| ✅           | ✅    | ✅ (admins only) |
| Delete (DEL)| ✅           | ✅    | ✅ (admins only) |

**Rules:**
- Non-admin users may only read, update, or delete **their own** account
- Admin users may read, update, or delete **any** account
- Role changes (`role` field) may only be performed by admin users
- Unauthenticated requests receive `401 Authentication required`
- Unauthorized cross-user operations receive `403 Not authorized`

---

## 5. Error Handling Strategy

```
Known Business Error (e.g., "User not found")
    → Service throws with descriptive message
    → Controller catches, maps to HTTP status (404), returns sanitized JSON message

Validation Error (Zod safeParse failure)
    → Controller returns 400 with formatted validation details

Authorization Error
    → Controller returns 401 (unauthenticated) or 403 (unauthorized)

Unknown Error
    → Controller logs with logger.error(), forwards via next(e) to Express
    → Client receives generic 500 Internal Server Error
```

---

## 6. Execution Flow Examples

### User Registration Flow
```
Client → POST /api/auth/register
    ↓
[Middleware: helmet, cors, json, urlencoded, cookieParser, morgan, securityMiddleware]
    ↓
[Router: auth.routes → POST /register]
    ↓
[Controller: auth.controller.register]
    ↓ (Zod safeParse with registerSchema)
    ↓ (Return 400 + formatted errors on validation failure)
[Service: auth.service.createUser]
    ↓ (Check for duplicate email → 409 if exists)
    ↓ (Hash password with bcrypt, 10 rounds)
    ↓ (Insert user via Drizzle ORM, exclude password from response)
    ↓ (Generate JWT with user id, email, role)
    ↓ (Set HTTP-only secure cookie via cookies.set())
    ↓
[Controller: Return 201 Created with user data]
    ↓
[Response: 201 { message, user: { id, name, email, role } }]
```

### User Authentication Flow
```
Client → POST /api/auth/login
    ↓
[Middleware: helmet, cors, json, cookieParser, morgan, securityMiddleware]
    ↓
[Router: auth.routes → POST /login]
    ↓
[Controller: auth.controller.signin]
    ↓ (Zod safeParse with logInSchema)
    ↓ (Return 400 + formatted errors on validation failure)
[Service: auth.service.authenticateUser]
    ↓ (Query user by email via Drizzle)
    ↓ (Throw "User not found" → 401)
    ↓ (bcrypt.compare password → throw "Invalid password" → 401)
    ↓ (Strip password field, return user object)
    ↓ (Generate JWT, set HTTP-only cookie)
    ↓
[Controller: Return 200 with user data]
    ↓
[Response: 200 { message, user: { id, name, email, role } }]
```

### User Update Flow
```
Client → PUT /api/users/:id (with JWT cookie)
    ↓
[Middleware: helmet, cors, json, cookieParser, morgan, securityMiddleware]
    ↓
[Router: users.routes → PUT /:id]
    ↓
[Controller: user.controller.updateUserHandler]
    ↓ (Zod safeParse params with userIdSchema → 400 on failure)
    ↓ (Zod safeParse body with updateUserSchema → 400 on failure)
    ↓ (Check req.user exists → 401 if not)
    ↓ (Check own profile or admin → 403 if not)
    ↓ (Check role change → 403 if non-admin)
[Service: users.services.updateUser]
    ↓ (Check user exists → throw "User not found" → 404)
    ↓ (Apply partial update with updatedAt = new Date())
    ↓ (Return updated user via Drizzle .returning())
    ↓
[Controller: Return 200 with updated user data]
    ↓
[Response: 200 { message, user: { id, name, email, role, createdAt, updatedAt } }]
```

### User Delete Flow
```
Client → DELETE /api/users/:id (with JWT cookie)
    ↓
[Middleware: helmet, cors, json, cookieParser, morgan, securityMiddleware]
    ↓
[Router: users.routes → DELETE /:id]
    ↓
[Controller: user.controller.deleteUserHandler]
    ↓ (Zod safeParse params with userIdSchema → 400 on failure)
    ↓ (Check req.user exists → 401 if not)
    ↓ (Check own profile or admin → 403 if not)
[Service: users.services.deleteUser]
    ↓ (Check user exists → throw "User not found" → 404)
    ↓ (Delete user via Drizzle ORM)
    ↓
[Controller: Return 200 with success message]
    ↓
[Response: 200 { message: "User deleted successfully" }]
```

---

## 7. Tech Stack & Dependencies

### Runtime & Framework
- **Node.js 18+** with ES Modules (`"type": "module"`)
- **Express.js v5** — web framework
- **TypeScript 6.x** — strict mode, NodeNext module resolution, path imports via `"imports"` in `package.json`

### Core Libraries
- **Drizzle ORM v0.45** — type-safe SQL query builder and schema definition
- **drizzle-kit** — schema generation and migration CLI
- **@neondatabase/serverless** — Neon PostgreSQL driver (HTTP-based)
- **jsonwebtoken** — JWT token creation and verification
- **bcrypt** — password hashing (10 salt rounds)

### Security
- **helmet** — comprehensive HTTP security headers
- **cors** — cross-origin resource sharing middleware
- **@arcjet/node** — rate limiting, bot detection, attack shielding
- **cookie-parser** — HTTP cookie parsing
- **dotenv** — environment variable loading

### Logging
- **Winston** — structured logger with File and Console transports
- **Morgan** — HTTP request logging (piped to Winston)

### Validation
- **Zod** — runtime type validation with TypeScript type inference

### Development Tools
- **Nodemon** — file-watching development server with hot-reload
- **tsx** — runtime TypeScript transpilation for development
- **ESLint** + **Prettier** — code quality and formatting
- **Jest** + **ts-jest** + **Supertest** — integration testing

---

## 8. Strengths & Tradeoffs

### Strengths
- **Separation of Concerns**: Clean layered architecture (routes → controllers → services → models) makes code maintainable and testable
- **Type Safety**: TypeScript throughout with Drizzle's type-safe queries and Zod's inferred types
- **Security by Default**: Helmet, bcrypt, HTTP-only cookies, Arcjet protection, and RBAC out of the box
- **Modularity**: Each concern is isolated in its own module — easy to extend with new features
- **Developer Experience**: Modern tooling (ESLint, Prettier, Drizzle Kit, tsx hot-reload, Nodemon)
- **Scalability**: Neon serverless database scales automatically; stateless JWT auth enables horizontal scaling
- **Comprehensive Logging**: Structured JSON logging in production with request and error tracking

### Tradeoffs
- **Monolithic Structure**: Single application process — may need decomposition for microservices at scale
- **No Refresh Token Strategy**: JWT tokens have a 1-day expiry with no refresh mechanism; logout relies on cookie clearing
- **Authentication Centralization**: All auth logic in one service module (consistent but could grow large)
- **Serverless DB Cold Starts**: Neon serverless may introduce latency on infrequent requests
- **No Caching Layer**: No Redis or in-memory caching for frequently accessed data
- **Limited Test Coverage**: Currently only basic health check integration tests; no unit tests for services or controllers