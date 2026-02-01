# Bounded Context Canvas: User Identity

> **Repo Path:** `claru/docs/contexts/user-identity.md`
> **Related Docs:** 
> - `claru/docs/context-map.md` — Context Boundaries & Relationships

**Context:** User Identity
**Type:** Generic
**Status:** Draft
**Last Updated:** January 2026

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Name** | User Identity |
| **Type** | Generic |
| **AI Involvement** | None |
| **Owner** | Platform team |

**Purpose Statement:**
Handles authentication and basic user identity. This is a solved problem — we use an existing auth provider (Supabase Auth) rather than building custom. Provides user IDs and basic profile data to all other contexts.

---

## Ubiquitous Language (This Context Only)

| Term | Meaning in THIS Context |
|------|-------------------------|
| **User** | An authenticated person with an account |
| **Authentication** | Verifying user identity (login) |
| **Session** | Active authenticated period |
| **Profile** | Basic identity data (email, name) |

---

## Responsibilities

**What this context OWNS:**
- User registration
- Authentication (login/logout)
- Password management
- Session management
- Basic profile (email, name)
- Account deletion

**What this context does NOT own:**
- User preferences → User Context Store
- Usage data → User Context Store
- Engagement metrics → Engagement Tracker
- Any business logic

---

## Key Entities

| Entity | Description | Key Attributes | Identifier |
|--------|-------------|----------------|------------|
| **User** | Authenticated account | email, name, createdAt, lastLoginAt | userId (UUID from auth provider) |

---

## Domain Events Published

| Event Name | Trigger | Data Included | Consumers |
|------------|---------|---------------|-----------|
| **UserRegistered** | New account created | userId, email, name | User Context Store |
| **UserLoggedIn** | Successful login | userId, timestamp | Internal |
| **UserDeleted** | Account deleted | userId | All contexts (cleanup) |

---

## Commands Accepted

| Command | Actor | Preconditions | Effect | Resulting Event |
|---------|-------|---------------|--------|-----------------|
| **Register** | Anonymous | Valid email, not existing | Creates user | UserRegistered |
| **Login** | Anonymous | Valid credentials | Creates session | UserLoggedIn |
| **Logout** | User | Active session | Ends session | UserLoggedOut |
| **DeleteAccount** | User | Authenticated | Removes user | UserDeleted |
| **UpdateProfile** | User | Authenticated | Updates name/email | ProfileUpdated |

---

## Queries Answered

| Query | Input | Output | Used By |
|-------|-------|--------|---------|
| **GetUser** | userId | Basic user data | All contexts |
| **GetUserByEmail** | email | User or null | Internal |
| **ValidateSession** | sessionToken | userId or null | All contexts |

---

## Interfaces

### NEEDS from Other Contexts

| From Context | What's Needed | Format | Why Needed |
|--------------|---------------|--------|------------|
| (None) | — | — | Self-contained |

### EXPOSES to Other Contexts

| To Context | What's Exposed | Format | Contract |
|------------|----------------|--------|----------|
| **All Contexts** | User ID, basic profile | Query: GetUser | Returns within 50ms |
| **All Contexts** | Session validation | Query: ValidateSession | Returns userId or null |
| **User Context Store** | Registration event | Event: UserRegistered | Triggers profile creation |

---

## Business Rules

1. **Unique email:** One account per email address.
2. **Email verification:** Required before full access (can be deferred for MVP).
3. **Password requirements:** Minimum 8 characters (handled by auth provider).
4. **Session expiry:** Sessions expire after 30 days of inactivity.
5. **Deletion cascade:** UserDeleted triggers cleanup in all other contexts.

---

## Implementation Note

**This is a Generic context — use existing solution.**

For MVP: Supabase Auth
- Handles registration, login, sessions
- Provides user IDs
- Manages password reset
- Supports social login (future)

**DO NOT build custom authentication.**

---

## Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Auth provider | Supabase Auth | Already using Supabase, integrated solution |
| Email verification | Deferred for MVP | Reduce friction; add later |
| Social login | Not in MVP | Complexity; add Google/Apple later |

## Open Questions

- None — this is a solved problem

---

## Completion Checklist

- [x] Purpose statement clear
- [x] Responsibilities explicit
- [x] Domain events documented
- [x] Commands documented
- [x] Queries documented
- [x] Generic status acknowledged (use existing solution)
