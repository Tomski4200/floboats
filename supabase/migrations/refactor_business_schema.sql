-- Step 1: Create the new business_groups table
CREATE TABLE business_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create the new user_business_permissions table
CREATE TABLE user_business_permissions (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    group_id UUID REFERENCES business_groups(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, business_id, group_id)
);

-- Step 3: Add the group_id column to the businesses table
ALTER TABLE businesses
ADD COLUMN group_id UUID REFERENCES business_groups(id) ON DELETE SET NULL;

-- Step 4: Create the business_to_category_links table
CREATE TABLE business_to_category_links (
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES business_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (business_id, category_id)
);

-- Step 5: Remove the old category_id column from the businesses table
ALTER TABLE businesses DROP COLUMN category_id;

-- Step 6: Add indexes for performance
CREATE INDEX idx_user_business_permissions_user_id ON user_business_permissions(user_id);
CREATE INDEX idx_user_business_permissions_business_id ON user_business_permissions(business_id);
CREATE INDEX idx_user_business_permissions_group_id ON user_business_permissions(group_id);
CREATE INDEX idx_businesses_group_id ON businesses(group_id);
