# Acquisitions API Architecture

## 1. Big Picture

**Project Type**: RESTful Web API built with Node.js and Express.

**Problem Solved**: Manages user acquisition processes, including user registration, authentication, and profile management. The system provides a secure backend for user-facing applications.

## 2. Core Architecture

The application follows a **layered (n-tier) architecture** with clear separation of concerns:

```
src/
├── app.ts          # Express application setup and middleware
├── server.ts       # Server entry point
├── index.ts        # Application bootstrap
├── config/         # Configuration (database, logger)
├── controllers/    # Request handlers
├── routes/         # API route definitions
├── services/       # Business logic
├── models/         # Database schema definitions
├── utils/          # Utility functions
├── validations/    # Input validation schemas
└── types/          # TypeScript interfaces and types
```

## 3. Key Components

### 3.1 Application Setup (`src/app.ts`)
- Configures Express middleware:
  - `helmet()`: Security headers
  - `cors()`: Cross-origin resource sharing
  - `express.json()`: JSON body parsing
  - `cookieParser()`: Cookie parsing
  - `morgan`: HTTP request logging via Winston
- Defines basic health check endpoints (`/`, `/health`, `/api`)
- Mounts authentication routes at `/api/auth`

### 3.2 Server Entry (`src/server.ts`)
- Creates HTTP server listening on `process.env.PORT` or 3000
- Logs server startup message

### 3.3 Configuration (`src/config/`)
- **database.ts**: Sets up Neon serverless PostgreSQL connection using Drizzle ORM
- **logger.ts**: Configures Winston logger for application logging

### 3.4 Routes (`src/routes/`)
- **auth.routes.ts**: Defines authentication endpoints (signup, login, etc.)
- Routes delegate to controller methods

### 3.5 Controllers (`src/controllers/`)
- **auth.controller.ts**: Handles authentication requests
- Validates input using Zod schemas
- Calls service layer for business logic
- Formats and returns HTTP responses

### 3.6 Services (`src/services/`)
- **auth.service.ts**: Contains authentication business logic
- Password hashing/verification with bcrypt
- JWT token generation and validation
- Database operations via Drizzle ORM

### 3.7 Models (`src/models/`)
- **user.model.ts**: Defines `users` table schema using Drizzle ORM
  - Fields: id, name, email, password, role, timestamps
  - Constraints: Primary key, unique email, default role

### 3.8 Utilities (`src/utils/`)
- **jwt.ts**: JWT token signing and verification
- **cookies.ts**: Cookie handling utilities

### 3.9 Validations (`src/validations/`)
- **auth.validation.ts**: Zod schemas for authentication inputs
- **format.ts**: Reusable validation utilities

### 3.10 Types (`src/types/`)
- **service.types.ts**: TypeScript interfaces for service layer

## 4. Data Flow & Communication

Typical authentication flow (login):

1. **Client Request**: POST `/api/auth/login` with `{ email, password }`
2. **Middleware Processing**:
   - Security headers (helmet)
   - CORS handling
   - Body parsing (JSON)
   - Cookie parsing
   - Request logging (morgan → Winston)
3. **Routing**: Express matches route to `auth.routes`
4. **Controller**: `auth.controller.login`
   - Validates input with Zod schema
   - Calls `authService.login(email, password)`
5. **Service**: `authService.login`
   - Queries database for user by email
   - Verifies password with bcrypt
   - Generates JWT token
   - Sets HTTP-only cookie
   - Returns user data (excl. password)
6. **Response**: JSON with user info and status code

Data flows downward through layers: Routes → Controllers → Services → Models/Database
Responses flow back upward: Services → Controllers → Routes → Client

## 5. Tech Stack & Dependencies

### Core Technologies
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Drizzle ORM with Neon serverless PostgreSQL driver
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Validation**: Zod
- **Logging**: Winston + Morgan
- **Security**: Helmet, CORS, cookie-parser

### Development Tools
- **TypeScript Compiler**: tsc
- **Dev Server**: nodemon
- **Linting**: ESLint + Prettier
- **Database**: Drizzle Kit for migrations
- **Testing**: (Not configured in package.json)

### Why These Choices?
- **TypeScript**: Catches errors at compile time, improves maintainability
- **Drizzle ORM**: Type-safe SQL with minimal abstraction, good DX
- **Neon Serverless**: Scalable PostgreSQL with generous free tier
- **JWT + Bcrypt**: Industry standard for stateless authentication
- **Zod**: Runtime validation with TypeScript inference
- **Winston/Morgan**: Flexible, transport-based logging

## 6. Execution Flow Example

**User Registration Flow**:
```
Client → POST /api/auth/register
        ↓
    [Middleware: helmet, cors, json, cookieParser, morgan]
        ↓
    [Router: auth.routes → register endpoint]
        ↓
    [Controller: auth.controller.register]
        ↓ (Validate with Zod schema)
    [Service: auth.service.register]
        ↓ (Hash password with bcrypt)
        ↓ (Insert user into database via Drizzle)
        ↓ (Generate JWT token)
        ↓ (Set cookie)
        ↓
    [Controller: Format response]
        ↓
    [Response: 201 Created with user data]
```

## 7. Strengths & Tradeoffs

### Strengths
- **Separation of Concerns**: Clear layering makes code maintainable and testable
- **Type Safety**: TypeScript throughout prevents runtime type errors
- **Modularity**: Easy to extend with new features following existing patterns
- **Security**: Industry-standard practices (helmet, bcrypt, JWT, HTTP-only cookies)
- **Developer Experience**: Modern tooling (ESLint, Prettier, Drizzle Kit)
- **Scalability**: Neon serverless database scales automatically
- **Logging**: Comprehensive request and application logging

### Tradeoffs
- **Monolithic Structure**: May need refactoring for microservices at scale
- **Authentication Centralization**: All auth logic in one module (good for consistency, but could become large)
- **Serverless DB Limitations**: Neon has cold start latency and less direct DB control
- **Missing Features**: No explicit rate limiting, input sanitization beyond validation, or advanced caching
- **Testing Gap**: No test configuration visible in package.json

## 8. Final Summary

The Acquisitions API is a TypeScript-based RESTful service built with Express that implements a clean layered architecture. It uses Drizzle ORM with a Neon PostgreSQL database for persistent storage, JWT and bcrypt for secure authentication, and includes comprehensive middleware for security, logging, and request processing. The system follows a predictable request flow: middleware processing → routing → controller validation → service business logic → database interaction → formatted response, making it maintainable and extensible for future features.