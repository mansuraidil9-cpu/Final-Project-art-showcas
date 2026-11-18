BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    display_name VARCHAR(120) NOT NULL CHECK (btrim(display_name) <> ''),
    email VARCHAR(254) NOT NULL CHECK (email <> '' AND email = btrim(email)),
    password_hash TEXT NOT NULL CHECK (password_hash <> ''),
    role TEXT NOT NULL CHECK (role IN ('member', 'curator', 'admin')),
    curator_status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_curator_status_check CHECK (
        (role = 'curator' AND curator_status IS NOT NULL
            AND curator_status IN ('pending', 'approved', 'rejected'))
        OR (role <> 'curator' AND curator_status IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
    ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
    token_hash CHAR(64) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_index ON sessions (expires_at);

COMMIT;
