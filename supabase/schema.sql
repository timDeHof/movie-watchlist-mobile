-- Create enum for privacy settings if it doesn't exist
DO $$ BEGIN
    CREATE TYPE privacy_setting AS ENUM ('public', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for media types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('movie', 'tv');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing tables and functions if they exist
DROP TABLE IF EXISTS shared_links CASCADE;
DROP TABLE IF EXISTS watchlist_items CASCADE;
DROP TABLE IF EXISTS watchlists CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create profiles table that extends auth.users
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    default_privacy_setting privacy_setting DEFAULT 'private',
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create profile policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create a trigger to create a profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, display_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,  -- Use email as initial username
        SPLIT_PART(NEW.email, '@', 1),  -- Use part before @ as display name
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create watchlists table
CREATE TABLE watchlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    privacy_setting privacy_setting DEFAULT 'private' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create watchlist items table
CREATE TABLE watchlist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE NOT NULL,
    tmdb_id INTEGER NOT NULL,
    media_type media_type NOT NULL,
    watched_status BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(watchlist_id, tmdb_id, media_type)
);

-- Create shared links table
CREATE TABLE shared_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE NOT NULL,
    share_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ,
    CONSTRAINT valid_share_code CHECK (
        share_code ~ '^[a-zA-Z0-9]{8,}$'
    )
);

-- Enable RLS on all tables
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

-- Create policies for watchlists
CREATE POLICY "Users can create their own watchlists"
    ON watchlists FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own watchlists"
    ON watchlists FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        privacy_setting = 'public' OR
        EXISTS (
            SELECT 1 FROM shared_links
            WHERE shared_links.watchlist_id = watchlists.id
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

CREATE POLICY "Users can update their own watchlists"
    ON watchlists FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists"
    ON watchlists FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create policies for watchlist items
CREATE POLICY "Users can add items to their watchlists"
    ON watchlist_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM watchlists
            WHERE watchlists.id = watchlist_id
            AND watchlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view items in accessible watchlists"
    ON watchlist_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM watchlists
            WHERE watchlists.id = watchlist_id
            AND (
                watchlists.user_id = auth.uid() OR
                watchlists.privacy_setting = 'public' OR
                EXISTS (
                    SELECT 1 FROM shared_links
                    WHERE shared_links.watchlist_id = watchlists.id
                    AND (expires_at IS NULL OR expires_at > NOW())
                )
            )
        )
    );

CREATE POLICY "Users can update items in their watchlists"
    ON watchlist_items FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM watchlists
            WHERE watchlists.id = watchlist_id
            AND watchlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items from their watchlists"
    ON watchlist_items FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM watchlists
            WHERE watchlists.id = watchlist_id
            AND watchlists.user_id = auth.uid()
        )
    );

-- Create policies for shared links
CREATE POLICY "Users can create shared links for their watchlists"
    ON shared_links FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM watchlists
            WHERE watchlists.id = watchlist_id
            AND watchlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view shared links"
    ON shared_links FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete shared links for their watchlists"
    ON shared_links FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM watchlists
            WHERE watchlists.id = watchlist_id
            AND watchlists.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX watchlists_user_id_idx ON watchlists(user_id);
CREATE INDEX watchlist_items_watchlist_id_idx ON watchlist_items(watchlist_id);
CREATE INDEX shared_links_watchlist_id_idx ON shared_links(watchlist_id);
CREATE INDEX shared_links_share_code_idx ON shared_links(share_code);