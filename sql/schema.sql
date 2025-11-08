-- Users table (mapped to Clerk users)
CREATE TABLE users (
    clerk_user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User medical information
CREATE TABLE user_medical_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE TABLE diagnostics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    diagnosis_type TEXT NOT NULL,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_bot BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_medical_info_user_id ON user_medical_info(user_id);
CREATE INDEX idx_diagnostics_user_id ON diagnostics(user_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own data"
ON users FOR ALL USING (clerk_user_id = auth.uid());

CREATE POLICY "Users can only access their own medical info"
ON user_medical_info FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can only access their own diagnostics"
ON diagnostics FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can only access their own appointments"
ON appointments FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can only access their own chat messages"
ON chat_messages FOR ALL USING (user_id = auth.uid());