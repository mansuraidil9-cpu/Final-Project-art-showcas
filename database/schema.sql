BEGIN;

-- Serialize concurrent executions of this schema in the same database.
SELECT pg_advisory_xact_lock(hashtext('alteria'), hashtext('database/schema.sql'));

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
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_url TEXT CHECK (source_url ~* '^https://[^[:space:]]+$'),
    rights TEXT
);

ALTER TABLE artworks
    ADD COLUMN IF NOT EXISTS owner_id BIGINT REFERENCES users (id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS image_data BYTEA CONSTRAINT artworks_upload_pair_check
        CHECK ((owner_id IS NULL) = (image_data IS NULL));

CREATE INDEX IF NOT EXISTS artworks_owner_upload_index
    ON artworks (owner_id, uploaded_at DESC, id DESC);

CREATE UNIQUE INDEX IF NOT EXISTS artworks_uploaded_image_src_unique
    ON artworks (image_src) WHERE owner_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS artwork_likes (
    artwork_id BIGINT NOT NULL REFERENCES artworks (id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    PRIMARY KEY (artwork_id, user_id)
);

DO $migration$
DECLARE
    likes_table regclass := 'artwork_likes'::regclass;
    legacy_index regclass;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute
        WHERE attrelid = likes_table AND attname = 'member_id' AND NOT attisdropped
    ) THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute
        WHERE attrelid = likes_table AND attname = 'user_id' AND NOT attisdropped
    ) THEN
        RAISE EXCEPTION 'artwork_likes already has both member_id and user_id';
    END IF;

    ALTER TABLE artwork_likes RENAME COLUMN member_id TO user_id;

    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_constraint
        WHERE conrelid = likes_table AND conname = 'artwork_likes_member_id_fkey'
    ) THEN
        ALTER TABLE artwork_likes
            RENAME CONSTRAINT artwork_likes_member_id_fkey TO artwork_likes_user_id_fkey;
    END IF;

    SELECT idx.oid::regclass INTO legacy_index
    FROM pg_catalog.pg_index AS indexed
    JOIN pg_catalog.pg_class AS idx ON idx.oid = indexed.indexrelid
    WHERE indexed.indrelid = likes_table AND idx.relname = 'artwork_likes_member_id_index';

    IF legacy_index IS NOT NULL THEN
        EXECUTE format('ALTER INDEX %s RENAME TO artwork_likes_user_id_index', legacy_index);
    END IF;
END;
$migration$;

CREATE INDEX IF NOT EXISTS artwork_likes_user_id_index ON artwork_likes (user_id);

CREATE TABLE IF NOT EXISTS artwork_favorites (
    artwork_id BIGINT NOT NULL REFERENCES artworks (id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (artwork_id, user_id)
);

CREATE INDEX IF NOT EXISTS artwork_favorites_user_created_index
    ON artwork_favorites (user_id, created_at DESC, artwork_id DESC);

CREATE TABLE IF NOT EXISTS artwork_comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    artwork_id BIGINT NOT NULL REFERENCES artworks (id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (
        char_length(body) BETWEEN 1 AND 1000 AND body !~ '^[[:space:]]|[[:space:]]$'
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artwork_comments_artwork_created_index
    ON artwork_comments (artwork_id, created_at, id);
CREATE INDEX IF NOT EXISTS artwork_comments_user_id_index ON artwork_comments (user_id);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS profile_links TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS avatar_data BYTEA;

ALTER TABLE challenges
    ADD COLUMN IF NOT EXISTS owner_id BIGINT REFERENCES users (id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS cover_data BYTEA CONSTRAINT challenges_cover_pair_check
        CHECK ((owner_id IS NULL) = (cover_data IS NULL));

CREATE INDEX IF NOT EXISTS challenges_owner_id_index ON challenges (owner_id, starts_at DESC, id DESC);
CREATE UNIQUE INDEX IF NOT EXISTS challenges_uploaded_cover_unique ON challenges (cover_image)
    WHERE owner_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS artworks_id_owner_unique ON artworks (id, owner_id);

CREATE TABLE IF NOT EXISTS challenge_submissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges (id) ON DELETE CASCADE,
    member_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    artwork_id BIGINT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    withdrawn_at TIMESTAMPTZ,
    placement SMALLINT CHECK (placement BETWEEN 1 AND 3),
    CHECK (withdrawn_at IS NULL OR placement IS NULL),
    FOREIGN KEY (artwork_id, member_id) REFERENCES artworks (id, owner_id) ON DELETE CASCADE,
    UNIQUE (challenge_id, placement)
);

CREATE UNIQUE INDEX IF NOT EXISTS challenge_submissions_active_member_unique
    ON challenge_submissions (challenge_id, member_id) WHERE withdrawn_at IS NULL;
CREATE INDEX IF NOT EXISTS challenge_submissions_member_index ON challenge_submissions (member_id, submitted_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS challenge_submissions_artwork_index ON challenge_submissions (artwork_id, member_id);

CREATE TABLE IF NOT EXISTS artwork_categories (
    name TEXT PRIMARY KEY CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 80)
);

DO $categories$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'artworks'::regclass AND conname = 'artworks_category_fkey'
    ) THEN
        INSERT INTO artwork_categories (name)
        SELECT DISTINCT category FROM artworks
        ON CONFLICT DO NOTHING;

        INSERT INTO artwork_categories (name)
        SELECT name FROM unnest(ARRAY[
            'Lukisan', 'Ilustrasi', 'Fotografi', 'Seni cetak', 'Keramik', 'Seni digital', 'Patung', 'Lainnya'
        ]) AS defaults(name)
        WHERE NOT EXISTS (SELECT 1 FROM artwork_categories AS existing WHERE lower(existing.name) = lower(defaults.name))
        ON CONFLICT DO NOTHING;

        ALTER TABLE artworks ADD CONSTRAINT artworks_category_fkey
            FOREIGN KEY (category) REFERENCES artwork_categories (name) ON UPDATE CASCADE ON DELETE RESTRICT;
    END IF;
END;
$categories$;

CREATE UNIQUE INDEX IF NOT EXISTS artwork_categories_name_lower_unique ON artwork_categories (lower(name));
CREATE INDEX IF NOT EXISTS artworks_category_index ON artworks (category);

CREATE TABLE IF NOT EXISTS artwork_reports (
    artwork_id BIGINT NOT NULL REFERENCES artworks (id) ON DELETE CASCADE,
    member_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason = btrim(reason) AND char_length(reason) BETWEEN 1 AND 500),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (artwork_id, member_id)
);

CREATE INDEX IF NOT EXISTS artwork_reports_pending_index ON artwork_reports (artwork_id, created_at)
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS artwork_reports_member_index ON artwork_reports (member_id);

COMMIT;
