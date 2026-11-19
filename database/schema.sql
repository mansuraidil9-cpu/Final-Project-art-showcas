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

CREATE TABLE IF NOT EXISTS challenges (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    rules TEXT[] NOT NULL CHECK (cardinality(rules) > 0),
    prize TEXT NOT NULL,
    cover_image TEXT NOT NULL CHECK (
        cover_image ~* '^/[a-z0-9_-]+(/[a-z0-9_-]+)*\.(avif|gif|jpe?g|png|webp)$'
    ),
    cover_alt TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT challenges_date_range_check CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS challenges_ends_at_index ON challenges (ends_at, id);

CREATE TABLE IF NOT EXISTS artworks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    artwork_date TEXT NOT NULL,
    category TEXT NOT NULL,
    image_src TEXT NOT NULL CHECK (
        image_src ~* '^/[a-z0-9_-]+(/[a-z0-9_-]+)*\.(avif|gif|jpe?g|png|webp)$'
    ),
    image_alt TEXT NOT NULL,
    image_width INTEGER NOT NULL CHECK (image_width > 0),
    image_height INTEGER NOT NULL CHECK (image_height > 0),
    description TEXT NOT NULL,
    tags TEXT[] NOT NULL CHECK (cardinality(tags) > 0),
    like_count INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_url TEXT CHECK (source_url ~* '^https://[^[:space:]]+$'),
    rights TEXT
);

COMMIT;
