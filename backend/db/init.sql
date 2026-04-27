-- Schema for Amit Center inquiries

CREATE TABLE IF NOT EXISTS inquiries (
  id BIGSERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  phone       VARCHAR(40)  NOT NULL,
  email       VARCHAR(200),
  message     TEXT,
  language    VARCHAR(8)   NOT NULL DEFAULT 'he',
  ip_address  VARCHAR(64),
  user_agent  VARCHAR(500),
  status      VARCHAR(32)  NOT NULL DEFAULT 'new',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status     ON inquiries (status);

CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inquiries_updated_at ON inquiries;
CREATE TRIGGER inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
