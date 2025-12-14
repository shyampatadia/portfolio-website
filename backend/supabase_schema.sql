-- =============================================
-- Portfolio Website Database Schema for Supabase
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    bio TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    location VARCHAR(255),
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BLOG POSTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    published BOOLEAN DEFAULT FALSE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    read_time VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);

-- =============================================
-- SKILLS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    proficiency INTEGER CHECK (proficiency >= 1 AND proficiency <= 5),
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_skills_category ON skills(category);

-- =============================================
-- EXPERIENCE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    current BOOLEAN DEFAULT FALSE,
    description TEXT NOT NULL,
    technologies TEXT[] DEFAULT '{}',
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PROJECTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    technologies TEXT[] DEFAULT '{}',
    github_url TEXT,
    live_url TEXT,
    image_url TEXT,
    featured BOOLEAN DEFAULT FALSE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_featured ON projects(featured);

-- =============================================
-- EDUCATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    current BOOLEAN DEFAULT FALSE,
    grade VARCHAR(50),
    description TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CERTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    credential_id VARCHAR(255),
    credential_url TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BOOKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('read', 'reading', 'to-read')),
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    category VARCHAR(100) NOT NULL,
    review TEXT,
    tags TEXT[] DEFAULT '{}',
    cover_image_url TEXT,
    date_finished DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_category ON books(category);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experience_updated_at BEFORE UPDATE ON experience
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON education
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can read published blog posts"
    ON blog_posts FOR SELECT
    USING (published = TRUE);

CREATE POLICY "Public can read profiles"
    ON profiles FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can read skills"
    ON skills FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can read experience"
    ON experience FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can read projects"
    ON projects FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can read education"
    ON education FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can read certifications"
    ON certifications FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can read books"
    ON books FOR SELECT
    USING (TRUE);

-- Authenticated users (admin) can do everything
CREATE POLICY "Authenticated users can manage blog posts"
    ON blog_posts FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage profiles"
    ON profiles FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage skills"
    ON skills FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage experience"
    ON experience FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage projects"
    ON projects FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage education"
    ON education FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage certifications"
    ON certifications FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage books"
    ON books FOR ALL
    USING (auth.role() = 'authenticated');

-- =============================================
-- INITIAL DATA (Optional)
-- =============================================

-- Insert a default profile (update with your information)
INSERT INTO profiles (name, title, bio, email)
VALUES (
    'Shyam Patadia',
    'Software Developer',
    'Passionate about automation, AI, and cloud technologies.',
    'shyampatadia22@gmail.com'
) ON CONFLICT DO NOTHING;

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- View for published blog posts
CREATE OR REPLACE VIEW published_blog_posts AS
SELECT * FROM blog_posts
WHERE published = TRUE
ORDER BY published_at DESC;

-- View for reading statistics
CREATE OR REPLACE VIEW reading_stats AS
SELECT
    COUNT(*) FILTER (WHERE status = 'read') AS total_read,
    COUNT(*) FILTER (WHERE status = 'reading') AS currently_reading,
    COUNT(*) FILTER (WHERE status = 'to-read') AS to_read
FROM books;
