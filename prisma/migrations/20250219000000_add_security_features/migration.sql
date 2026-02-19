-- Add active flag to Membership
ALTER TABLE memberships ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX idx_memberships_active ON memberships(tenant_id, active);

-- Add 2FA fields to User
ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT[];

-- Add password policy fields to User
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN password_expires_at TIMESTAMP;

-- Create password history table
CREATE TABLE password_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_history_user_id ON password_history(user_id, created_at DESC);
