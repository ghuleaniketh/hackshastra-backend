# PostgreSQL Relational Architecture & Entity Design (Stage 3)

This document specifies the relational database schema, constraint rules, foreign key actions, indexing strategies, and business integrity rules for the HackShastra backend prior to ORM integration.

---

## 1. Entities & Schema Specification

### 1.1 Admin
Stores authenticated administrative and staff users with role-based access control.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique identifier |
| `name` | `VARCHAR(255)` | `NOT NULL` | Admin full name |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Unique contact/login email |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Argon2 / bcrypt password hash |
| `role` | `VARCHAR(50)` | `NOT NULL`, Default `'ADMIN'` | Role (`SUPER_ADMIN`, `ADMIN`, `COMMUNITY_LEAD`, `EDITOR`) |
| `is_active` | `BOOLEAN` | `NOT NULL`, Default `true` | Account active status |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Account creation time |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Account last update time |
| `last_login_at` | `TIMESTAMPTZ` | `NULL` | Timestamp of last successful login |

---

### 1.2 Image
Stores image metadata; physical media is hosted on Cloudflare Images.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique identifier |
| `cloudflare_image_id` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Cloudflare image resource ID |
| `url` | `TEXT` | `NOT NULL` | Public CDN delivery URL |
| `alt_text` | `VARCHAR(255)` | `NULL` | Accessibility description |
| `width` | `INTEGER` | `NULL` | Image width in pixels |
| `height` | `INTEGER` | `NULL` | Image height in pixels |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Upload record creation time |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Record updated time |

---

### 1.3 Event
Stores hackathons, workshops, meetups, competitions, seminars, etc.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique identifier |
| `title` | `VARCHAR(255)` | `NOT NULL` | Event title |
| `slug` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | URL-friendly identifier |
| `description` | `TEXT` | `NOT NULL` | Full event description |
| `event_type` | `VARCHAR(50)` | `NOT NULL` | `HACKATHON`, `WORKSHOP`, `MEETUP`, `COMPETITION`, `SEMINAR`, `OTHER` |
| `start_date` | `TIMESTAMPTZ` | `NOT NULL` | Event start date & time |
| `end_date` | `TIMESTAMPTZ` | `NOT NULL` | Event end date & time |
| `location` | `VARCHAR(255)` | `NOT NULL` | Physical location or Online link |
| `banner_image_id` | `UUID` | `NULL`, `FOREIGN KEY (Image.id)` | Event banner image |
| `registration_enabled` | `BOOLEAN` | `NOT NULL`, Default `true` | Registration flag |
| `registration_deadline`| `TIMESTAMPTZ` | `NULL` | Deadline for accepting registrations |
| `capacity` | `INTEGER` | `NOT NULL` | Maximum participant capacity (e.g., 250) |
| `status` | `VARCHAR(50)` | `NOT NULL`, Default `'DRAFT'` | `DRAFT`, `PUBLISHED`, `REGISTRATION_OPEN`, `REGISTRATION_CLOSED`, `COMPLETED`, `CANCELLED` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Event creation time |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Event last update time |

---

### 1.4 Registration
Stores participant registrations. Accountless flow using email verification.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique registration ID |
| `event_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (Event.id)` | Associated event |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | Participant full name |
| `email` | `VARCHAR(255)` | `NOT NULL` | Participant normalized email |
| `phone` | `VARCHAR(50)` | `NULL` | Contact phone number |
| `college` | `VARCHAR(255)` | `NULL` | College / University |
| `organization` | `VARCHAR(255)` | `NULL` | Company / Organization |
| `year` | `VARCHAR(50)` | `NULL` | Year of study / position |
| `additional_information`| `TEXT` | `NULL` | T-Shirt size, dietary info, notes |
| `status` | `VARCHAR(50)` | `NOT NULL`, Default `'PENDING_VERIFICATION'` | `PENDING_VERIFICATION`, `VERIFIED`, `WAITLISTED`, `CANCELLED` |
| `verification_token_hash` | `VARCHAR(255)` | `NULL` | Cryptographic hash of verification token |
| `verification_token_expires_at` | `TIMESTAMPTZ` | `NULL` | Token expiration timestamp |
| `verified_at` | `TIMESTAMPTZ` | `NULL` | Verification timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Registration update timestamp |

**Unique Constraint**: `UNIQUE(event_id, email)` — Prevents duplicate registrations for the same event with the same normalized email address.

---

### 1.5 Blog
Stores community blog posts and articles.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique identifier |
| `title` | `VARCHAR(255)` | `NOT NULL` | Blog post title |
| `slug` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | URL-friendly slug |
| `excerpt` | `TEXT` | `NULL` | Short summary |
| `content` | `TEXT` | `NOT NULL` | Full body text / Markdown |
| `cover_image_id` | `UUID` | `NULL`, `FOREIGN KEY (Image.id)` | Cover image reference |
| `author_name` | `VARCHAR(255)` | `NOT NULL` | Display author name |
| `tags` | `TEXT[]` | `NOT NULL`, Default `'{}'` | Array of tag strings |
| `status` | `VARCHAR(50)` | `NOT NULL`, Default `'DRAFT'` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `published_at` | `TIMESTAMPTZ` | `NULL` | Publication timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Record creation time |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Record updated time |

---

### 1.6 Project
Stores community projects and showcase submissions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique identifier |
| `title` | `VARCHAR(255)` | `NOT NULL` | Project title |
| `description` | `TEXT` | `NOT NULL` | Project description |
| `tech_stack` | `TEXT[]` | `NOT NULL`, Default `'{}'` | Array of technologies used |
| `github_url` | `VARCHAR(500)` | `NULL` | Source repository link |
| `live_url` | `VARCHAR(500)` | `NULL` | Live project URL |
| `image_id` | `UUID` | `NULL`, `FOREIGN KEY (Image.id)` | Project screenshot/thumbnail |
| `submitter_name` | `VARCHAR(255)` | `NOT NULL` | Submitter full name |
| `submitter_email` | `VARCHAR(255)` | `NOT NULL` | Submitter contact email |
| `status` | `VARCHAR(50)` | `NOT NULL`, Default `'PENDING'` | `PENDING`, `APPROVED`, `REJECTED`, `ARCHIVED` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Submission time |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Record update time |

---

### 1.7 ContactRequest
Stores incoming contact form inquiries from visitors.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique identifier |
| `name` | `VARCHAR(255)` | `NOT NULL` | Visitor name |
| `email` | `VARCHAR(255)` | `NOT NULL` | Visitor email |
| `subject` | `VARCHAR(255)` | `NOT NULL` | Subject of message |
| `message` | `TEXT` | `NOT NULL` | Inquiry body content |
| `status` | `VARCHAR(50)` | `NOT NULL`, Default `'NEW'` | `NEW`, `READ`, `REPLIED`, `ARCHIVED` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Submission timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Status update timestamp |

---

### 1.8 SiteContent
Stores dynamic CMS content for key website sections (homepage, community info, contact details).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique identifier |
| `key` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Unique section key (e.g. `homepage.hero`) |
| `title` | `VARCHAR(255)` | `NULL` | Section title |
| `content` | `TEXT` | `NOT NULL` | Main content / HTML / Markdown |
| `metadata` | `JSONB` | `NOT NULL`, Default `'{}'` | Arbitrary structured content (links, banners) |
| `updated_by` | `UUID` | `NULL`, `FOREIGN KEY (Admin.id)` | Admin who last edited the content |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `NOW()` | Last edited timestamp |

---

## 2. Foreign-Key Actions & Referential Integrity

- **Registration -> Event (`event_id`)**:
  - `ON DELETE RESTRICT`: Prevents accidental deletion of an Event if registrations exist. Events must be marked `CANCELLED` or archived rather than hard-deleted.
- **Event -> Image (`banner_image_id`)**:
  - `ON DELETE SET NULL`: If an image metadata record is removed, the event remains with no banner image.
- **Blog -> Image (`cover_image_id`)**:
  - `ON DELETE SET NULL`: If an image record is deleted, cover image reference becomes `NULL`.
- **Project -> Image (`image_id`)**:
  - `ON DELETE SET NULL`: If an image record is deleted, project thumbnail reference becomes `NULL`.
- **SiteContent -> Admin (`updated_by`)**:
  - `ON DELETE SET NULL`: Preserves CMS section content even if an admin user account is deleted.

---

## 3. Indexing Strategy

To support high-concurrency event registration (e.g., 10 req/s with 250 capacity limit) and fast public browsing, the following indexes are specified:

1. **`idx_registration_event_email`**: `UNIQUE(event_id, email)`
   - Fast lookup for duplicate registration checks and strict DB-level uniqueness enforcement.
2. **`idx_registration_event_status`**: `INDEX(event_id, status)`
   - Accelerates count queries for verified registrations to check capacity limit (`status = 'VERIFIED'`).
3. **`idx_event_slug`**: `UNIQUE(slug)`
   - Instant public event lookup by URL slug.
4. **`idx_blog_slug`**: `UNIQUE(slug)`
   - Instant public blog lookup by URL slug.
5. **`idx_sitecontent_key`**: `UNIQUE(key)`
   - Instant lookup for website CMS sections (e.g. `homepage.hero`).
6. **`idx_admin_email`**: `UNIQUE(email)`
   - Instant admin authentication lookup.

---

## 4. Concurrency & Capacity Business Rules

1. **Email Normalization**:
   - All emails MUST be converted to lowercase and trimmed before storage or comparison (`LOWER(TRIM(email))`).
2. **Capacity Enforcement**:
   - Capacity checks MUST happen within an explicit database transaction (`SELECT COUNT(...) WHERE event_id = $1 AND status = 'VERIFIED' FOR UPDATE` or atomic condition) to prevent race conditions during peak registration spikes.
3. **Token Verification**:
   - Verification tokens are generated using `crypto.randomBytes(32).toString('hex')`.
   - Stored as SHA-256 hash (`verification_token_hash`).
   - Tokens expire after 24 hours (`verification_token_expires_at`).
   - After single-use verification, `status` becomes `VERIFIED`, `verified_at` is set, and token hash/expiry are cleared.
