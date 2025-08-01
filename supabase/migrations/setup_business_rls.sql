-- Enable RLS for the new tables
ALTER TABLE business_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_business_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_to_category_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_business_permissions;
DROP POLICY IF EXISTS "Owners can manage permissions" ON user_business_permissions;
DROP POLICY IF EXISTS "Users can view groups they are a member of" ON business_groups;
DROP POLICY IF EXISTS "Owners can update groups" ON business_groups;
DROP POLICY IF EXISTS "Anyone can view category links" ON business_to_category_links;

-- RLS Policies for user_business_permissions
CREATE POLICY "Users can view their own permissions" ON user_business_permissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners can manage permissions" ON user_business_permissions
    FOR ALL USING (
        (
            group_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM user_business_permissions
                WHERE user_business_permissions.group_id = user_business_permissions.group_id
                AND user_business_permissions.user_id = auth.uid()
                AND user_business_permissions.role = 'owner'
            )
        ) OR (
            business_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM user_business_permissions
                WHERE user_business_permissions.business_id = user_business_permissions.business_id
                AND user_business_permissions.user_id = auth.uid()
                AND user_business_permissions.role = 'owner'
            )
        )
    );

-- RLS Policies for business_groups
CREATE POLICY "Users can view groups they are a member of" ON business_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_business_permissions
            WHERE user_business_permissions.group_id = business_groups.id
            AND user_business_permissions.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update groups" ON business_groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_business_permissions
            WHERE user_business_permissions.group_id = business_groups.id
            AND user_business_permissions.user_id = auth.uid()
            AND user_business_permissions.role = 'owner'
        )
    );

-- RLS Policies for business_to_category_links
CREATE POLICY "Anyone can view category links" ON business_to_category_links
    FOR SELECT USING (true);
