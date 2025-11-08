-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (mapped to Clerk users)
CREATE TABLE IF NOT EXISTS users (
    clerk_user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User medical information
CREATE TABLE IF NOT EXISTS user_medical_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    age INTEGER,
    gender TEXT,
    weight DECIMAL,
    height DECIMAL,
    medical_conditions TEXT[],
    medications TEXT[],
    allergies TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diagnostics table
CREATE TABLE IF NOT EXISTS diagnostics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    diagnosis_type TEXT NOT NULL,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    diagnostic_id UUID REFERENCES diagnostics(id) ON DELETE CASCADE,
    appointment_date TIMESTAMPTZ,
    appointment_time TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_bot BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_medical_info_user_id ON user_medical_info(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_user_id ON diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users table policies
CREATE POLICY "Users can read their own data"
ON users FOR SELECT
USING (auth.uid() = clerk_user_id);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (auth.uid() = clerk_user_id);

-- Medical info policies
CREATE POLICY "Users can read their own medical info"
ON user_medical_info FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medical info"
ON user_medical_info FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medical info"
ON user_medical_info FOR UPDATE
USING (auth.uid() = user_id);

-- Diagnostics policies
CREATE POLICY "Users can read their own diagnostics"
ON diagnostics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diagnostics"
ON diagnostics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Users can read their own appointments"
ON appointments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments"
ON appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
ON appointments FOR UPDATE
USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can read their own chat messages"
ON chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages"
ON chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to handle user creation from Clerk
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO users (clerk_user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update user data
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS trigger AS $$
BEGIN
    UPDATE users
    SET 
        email = NEW.email,
        full_name = NEW.raw_user_meta_data->>'full_name',
        updated_at = NOW()
    WHERE clerk_user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_user_update();