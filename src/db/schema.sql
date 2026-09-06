-- HackShastra PostgreSQL Centralized Schema (Supabase / PostgreSQL)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Image Table (Cloudflare Images metadata)
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cloudflare_image_id VARCHAR(255) NOT NULL UNIQUE,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users/Admins Table (Google OAuth via Firebase)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  firebase_uid VARCHAR(255) UNIQUE,
  picture TEXT,
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- 4. Event Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255) NOT NULL,
  banner_image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  registration_enabled BOOLEAN NOT NULL DEFAULT true,
  registration_deadline TIMESTAMPTZ,
  capacity INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Registration Table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  college VARCHAR(255),
  organization VARCHAR(255),
  year VARCHAR(50),
  student_id VARCHAR(100),
  gender VARCHAR(50),
  department VARCHAR(150),
  favourite_pokemon VARCHAR(50),
  participation_interest VARCHAR(30),
  additional_information TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
  verification_token_hash VARCHAR(255),
  verification_token_expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_registrations_event_email UNIQUE (event_id, email)
);

-- Schema migrations for existing databases
DO $$
BEGIN
  BEGIN
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS student_id VARCHAR(100);
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS department VARCHAR(150);
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS favourite_pokemon VARCHAR(50);
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS participation_interest VARCHAR(30);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- 6. Blog Table
CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  author_name VARCHAR(255) NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Project Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  github_url VARCHAR(500),
  live_url VARCHAR(500),
  image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  submitter_name VARCHAR(255) NOT NULL,
  submitter_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ContactRequest Table
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SiteContent Table
CREATE TABLE IF NOT EXISTS site_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Performance & Integrity Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
