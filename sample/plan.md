HackShastra Website — Backend Technical Plan

1. Project Overview

Build the backend for the HackShastra community website using:

Node.js

Express.js

JavaScript

PostgreSQL

Prisma ORM

Nodemailer

Cloudflare Images

HackShastra is a public community website for hackathons, workshops, meetups, competitions, blogs, projects, announcements, and community information.

The public website must not require visitors to create accounts or log in.

Only administrators and authorized community leads require authenticated accounts for website management.

The final system should allow authorized admins/community leads to manage normal website content without editing source code.

2. Core User Model

Public visitors

Visitors can:

Browse public content.

View events and event details.

View blogs.

View projects.

Register for events.

Contact HackShastra.

Submit projects or requests where enabled.

Visitors do not need:

A username.

A password.

A website account.

A login session.

For event registration, the participant's email is used for verification.

Admin users

Admins and members use Google OAuth via Firebase Authentication. No username or password login is used.

Roles:

ADMIN

MEMBER

Permissions are enforced via role-based authorization middleware based on ADMIN and MEMBER roles.

3. No-Code Website Management Requirement

Authorized staff must eventually be able to manage the website through an admin dashboard/CMS without modifying source code for ordinary content changes.

Admins should be able to manage, where applicable:

Events

Event registrations

Blogs

Projects

Announcements

Homepage content

Community information

FAQ

Contact information

Social links

Footer content

Images

Featured content

Other designated editable website sections

Changing ordinary content should follow:

Admin dashboard -> Admin API -> PostgreSQL -> Public API -> Frontend

The CMS should be a management layer over the existing backend rather than a separate data silo.

4. Development Principles

Build the backend incrementally and production-first.

Every major stage must be:

Planned.

Implemented.

Tested.

Fixed where necessary.

Reviewed for production readiness.

Documented.

Stopped for explicit approval before the next major stage begins.

Do not build unrelated later-stage functionality early just because it may eventually be useful.

Avoid architecture that is intentionally temporary when doing so would create obvious rework.

Keep controllers thin, put business logic in services, validate input before business logic, and keep external integrations isolated.

5. Technology Rules

Backend

Use Node.js + Express.js + JavaScript.

Do not switch to MongoDB/Mongoose.

Do not introduce TypeScript unless explicitly requested.

Database

Use PostgreSQL (Supabase PostgreSQL direct connection URL).

Prisma is bypassed per user requirement (due to network/wifi issues and direct connection preference). Database access will use direct PostgreSQL connection pool via `pg` driver, with schema definitions and migrations managed centrally in SQL scripts (`src/db/schema.sql`).

Email

Use Nodemailer for:

Registration verification emails

Registration confirmation emails

Contact notifications

Optional contact confirmations

Project notifications where required

Administrative notifications where required

Image storage

Use Cloudflare Images for production image storage.

Do not depend on local disk for permanent production image storage.

6. Database Access & Schema Strategy (Prisma Bypassed)

Per explicit user directive, Prisma is bypassed in favor of direct Supabase PostgreSQL connections using `pg`.

All database schemas, tables, indexes, constraints, and initial seed scripts are centralized in `src/db/schema.sql` and `src/db/init.js`.

7. Development Order

Stage 1 — Backend Foundation

[Completed]

Stage 2 — Backend Structure and Architecture

[Completed]

Stage 3 — PostgreSQL Setup and Relational Database Design

[Completed]

Stage 4 — Direct Supabase PostgreSQL Connection & Centralized Schema Execution

Execute direct connection to Supabase / PostgreSQL.

Implement:

1. Centralized schema definitions in `src/db/schema.sql` (Tables, ENUMs, Foreign Keys, Unique Constraints, Indexes).
2. Database initialization and migration runner `src/db/init.js` to create tables directly on Supabase PostgreSQL.
3. Centralized database access client in `src/lib/database.js`.
4. Transaction helper utilities for atomic operations (e.g. event registration capacity checks).

Stage 4 testing

Verify:

Supabase / PostgreSQL direct connection.

Execution of `src/db/schema.sql` tables and constraints.

Query execution via `pg` pool.

Transaction atomicity and error handling.

Fix all discovered issues.

Document environment setup (`DATABASE_URL`).

Then stop and request approval before Stage 5.

Stage 5 — Public Event System and Registration

Implement public APIs:

GET /api/events
GET /api/events/:slug
POST /api/events/:eventId/register
GET /api/registrations/verify/:token

Event browsing requires no authentication.

Event registration requires no account.

Registration flow:

Visitor
-> Select event
-> Complete registration form
-> Validate input
-> Check event
-> Check registration status/deadline
-> Check duplicate registration
-> Check capacity
-> Create PENDING_VERIFICATION registration
-> Generate verification token
-> Send verification email
-> Participant clicks link
-> Verify token
-> Mark registration VERIFIED
-> Send confirmation email

Token requirements:

Cryptographically secure.

Expiring.

Single-use.

No unnecessary sensitive information.

Prefer storing a secure hash rather than the raw token.

After verification:

status = VERIFIED
verifiedAt = current time
verificationTokenHash = null
verificationTokenExpiresAt = null

Normalize emails consistently.

Prevent duplicate registration for the same event and normalized email.

Capacity must be enforced correctly under concurrency.

Example target:

250 confirmed registrations per event
10 registration requests per second

These are separate requirements.

Do not rely on frontend checks for capacity.

Stage completion requirements:

Happy-path registration works.

Invalid input is rejected.

Duplicate registration is handled.

Capacity behavior is correct.

Verification tokens are safe.

Concurrent registration behavior is safe enough for the defined target.

APIs are documented.

Then stop and request approval for Stage 6.

Stage 6 — Nodemailer and Email Verification

Create and use:

src/services/email.service.js

Do not put SMTP logic directly in controllers.

Support:

Registration verification.

Registration confirmation.

Contact notification.

Optional contact confirmation.

Project notifications where required.

Administrative notifications where required.

Environment configuration may include:

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=
ADMIN_EMAIL=

Email verification should be integrated with the registration state machine.

Test:

Successful verification email.

Successful confirmation email.

Invalid token.

Expired token.

Reused token.

SMTP failure.

Email configuration failure.

Then stop and request approval for Stage 7.

Stage 7 — Cloudflare Images

Use Cloudflare Images for production image storage.

Implement an upload flow such as:

Client
-> Backend
-> Validate
-> Cloudflare Images
-> Receive Cloudflare image ID/URL
-> Store metadata in PostgreSQL
-> Return image information

Validate:

MIME type.

Extension.

File size.

Actual image validity.

Upload permissions.

Potential uses:

Event banners.

Blog covers.

Project images.

Homepage images.

Community/team images.

CMS content images.

Then stop and request approval for Stage 8.

Stage 8 — Authentication and Authorization (Firebase Google Sign-In)

Implement secure authentication using Firebase Google OAuth ID tokens. No username or password login is used.

Public participants remain unauthenticated for browsing and registration.

Role Hierarchy:
- ADMIN: Full administrative access to CMS, events, blogs, projects, moderation, content editing.
- MEMBER: Authenticated community member access.

Suggested endpoints:

POST /api/auth/google (Verify Firebase Google ID token, sync user record, return session/token)
POST /api/auth/logout (Clear auth session)
GET  /api/auth/me     (Get current authenticated user profile and role)

Implement:

1. Firebase Admin SDK setup (`firebase-admin`) to verify Firebase ID tokens (`admin.auth().verifyIdToken(idToken)`).
2. Development fallback / mock Firebase verification for local testing without active Firebase credentials.
3. User synchronization in PostgreSQL (`admins` table synced with Google profile: `email`, `name`, `firebase_uid`, `picture`, `role` default `MEMBER` or `ADMIN`).
4. Session handling (JWT / HttpOnly cookie).
5. Role-based authorization middleware (`requireAuth`, `requireRole('ADMIN')`, `requireRole('MEMBER')`).
6. Disabled/inactive account checks.

Then stop and request approval for Stage 9.

Stage 9 — Admin CMS and No-Code Website Management

Implement admin APIs for managing website data.

Potential APIs:

GET    /api/admin/events
POST   /api/admin/events
PUT    /api/admin/events/:id
DELETE /api/admin/events/:id

GET    /api/admin/events/:id/registrations

GET    /api/admin/blogs
POST   /api/admin/blogs
PUT    /api/admin/blogs/:id
DELETE /api/admin/blogs/:id

GET    /api/admin/projects
PUT    /api/admin/projects/:id
DELETE /api/admin/projects/:id

GET    /api/admin/contact
PUT    /api/admin/contact/:id

GET    /api/admin/content
PUT    /api/admin/content/:key

POST   /api/admin/uploads/image
DELETE /api/admin/uploads/image/:id

The exact API can be refined during implementation.

Event management

Admins should be able to:

Create events.

Save drafts.

Publish/unpublish events.

Open/close registration.

Change capacity.

Change dates.

Change location.

Change descriptions.

Change banners.

View registrations.

Export registrations.

Blog management

Admins should be able to:

Create.

Edit.

Draft.

Publish.

Unpublish.

Archive.

Delete.

Manage cover image.

Manage tags.

Project moderation

Admins should be able to:

View submissions.

Approve.

Reject.

Edit.

Archive.

Publish.

Delete.

Contact management

Admins should be able to:

View.

Mark new.

Mark in progress.

Mark resolved.

Archive.

General website content

Allow no-code editing of designated sections such as:

Homepage hero.

About section.

Announcements.

Community description.

FAQ.

Contact information.

Social links.

Footer.

Team information.

Featured content.

Support Draft/Published where appropriate. Do not overbuild the publishing workflow until needed.

Then stop and request approval for Stage 10.

Stage 10 — Remaining Public APIs

Implement as needed:

GET /api/blogs
GET /api/blogs/:slug

GET /api/projects
POST /api/projects

POST /api/contact

GET /api/content/:key

Public read endpoints remain unauthenticated.

Project submissions should normally enter moderation rather than becoming public automatically.

Then stop and request approval for Stage 11.

Stage 11 — Security and Rate Limiting

Protect high-risk endpoints:

POST /api/events/:eventId/register
POST /api/contact
POST /api/projects
GET  /api/registrations/verify/:token
POST /api/admin/login
POST /api/admin/uploads/image

Implement, as appropriate:

Helmet.

CORS restrictions.

Input validation.

Rate limiting.

Secure cookies.

Password hashing.

Role authorization.

Upload validation.

Request body size limits.

Environment-based secrets.

Production-safe error handling.

Logging.

Database constraints.

Do not confuse request rate limits with event capacity.

Then stop and request approval for Stage 12.

Stage 12 — Automated Testing and Concurrency Testing

Build tests for:

Health.

Events.

Registration.

Verification.

Blogs.

Projects.

Contact.

Content.

Admin login.

Admin authorization.

CMS actions.

Image uploads.

Email behavior.

Concurrency scenarios:

10 registration requests/second.

Multiple requests competing for the final available slot.

Simultaneous duplicate registration attempts.

Requests after capacity.

Repeated verification.

Expired verification.

The primary goal is data correctness and safe state transitions.

Then stop and request approval for Stage 13.

Stage 13 — Production Preparation

Perform a complete production-readiness review.

Review:

Environment separation.

Secrets.

Database credentials.

Database backups.

Migrations.

Indexes.

Connection behavior/pooling.

SMTP.

Email sender identity.

Verification URLs.

Cloudflare API permissions.

Image delivery.

HTTPS.

CORS.

Cookies.

Rate limiting.

Admin security.

Request limits.

Logging.

Error handling.

Run final local/staging verification.

Then STOP and ask:

The backend has completed development, integration testing, security review, concurrency testing, and production-readiness checks. Do you want me to proceed with production deployment?

Stage 14 — Production Deployment

Only after explicit approval.

Deploy to the selected production environment.

Configure:

Production environment variables.

Production database.

Production email.

Cloudflare Images.

CORS.

HTTPS.

Domain/routing.

Logs.

Health checks.

Do not deploy without explicit approval.

Then stop and request approval before considering additional production changes beyond verification.

Stage 15 — Production Verification and Monitoring

Verify:

/api/health.

Public event listing.

Event detail pages.

Event registration.

Email verification.

Registration confirmation email.

Cloudflare image delivery.

Admin login.

Admin event creation/editing.

CMS content editing.

Blog publishing.

Project submission.

Contact form.

Rate limiting.

Review logs for:

Server errors.

Database errors.

Email delivery failures.

Cloudflare failures.

Authentication failures.

Rate-limit events.

Establish monitoring for the production system.

8. Audit Log

Because multiple admins/community leads may edit the website, support auditing at the CMS stage.

Potential fields:

id
adminId
action
entityType
entityId
oldValue
newValue
createdAt

Examples:

ADMIN created event
COMMUNITY_LEAD edited event
ADMIN changed capacity
EDITOR published blog
ADMIN deleted project

Audit logs should answer:

Who changed it?

What changed?

When did it change?

9. API Response Standard

Success:

{
  "success": true,
  "data": {}
}

Error:

{
  "success": false,
  "message": "Something went wrong"
}

Validation error:

{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}

Use correct HTTP status codes consistently.

10. Frontend Integration

Do not guess frontend requirements unnecessarily.

When frontend integration begins, inspect the real frontend components/forms if they are available.

Use them to determine:

Required fields.

Response shapes.

Loading states.

Error shapes.

Image fields.

Event fields.

CMS fields.

Do not force the frontend to conform to imaginary structures.

11. Open Decisions That Must Be Resolved Before They Affect Implementation

Ask only questions that materially affect the current stage.

Important decisions include:

PostgreSQL

Provider.

Local vs hosted.

PostgreSQL version if relevant.

Registration

Exact form fields.

Phone/college/year requirements.

Duplicate email policy.

Capacity counting rule.

Behavior after capacity is reached.

Waitlist requirement.

Team registration requirement.

Registration ID requirement.

Email

Email provider.

Sender address.

Admin notification address.

Which events trigger admin notifications.

Cloudflare

Confirm Cloudflare Images vs another Cloudflare storage service.

Who can upload images.

Image limits/types.

Admin

Initial number of admins.

Whether admins can create additional admins.

Community Lead permissions.

Editor permissions.

Audit-log requirement.

CMS

Editable sections.

Rich-text editor requirements.

Reordering requirements.

Immediate publishing vs Draft -> Preview -> Publish.

Deployment

Backend host.

PostgreSQL host.

Frontend host.

Cloudflare DNS/domain setup.

12. Absolute Rules

Never:

Switch PostgreSQL to MongoDB.

Make public event registration require a user account.

Store permanent production images on local server disk.

Put SMTP, Cloudflare, database, or admin secrets in source code.

Trust frontend validation alone.

Expose admin APIs without authorization.

Continue past a required approval gate without explicit approval.

Integrate Prisma before explicit approval.

Deploy to production before explicit approval.

Build unnecessary future features without a current requirement.

Duplicate business logic across controllers.

Leave known critical test failures unresolved before declaring a stage complete.

13. Stage Completion Standard

A stage is complete only when:

The intended functionality is implemented.

The implementation has been tested.

Discovered issues have been fixed or explicitly documented as non-blocking.

Existing functionality still works.

Security and production concerns for that stage have been reviewed.

Documentation has been updated.

Then stop and request approval for the next major stage.