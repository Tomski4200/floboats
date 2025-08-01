# Database Migrations for FloBoats

## Analytics Feature Migrations

To enable the boat analytics feature, you need to run the following migrations in your Supabase database:

### 1. Create Analytics Tables
First, run the migration to create the necessary tables:
```sql
-- Run the contents of: create_boat_analytics_tables.sql
```

This creates:
- `boat_views` table - Tracks individual page views
- `boat_analytics` table - Stores aggregated daily statistics

### 2. Create Analytics Functions
Next, run the RPC functions migration:
```sql
-- Run the contents of: supabase/migrations/create_analytics_functions.sql
```

This creates:
- `get_boat_stats()` - Retrieves analytics data for a boat
- `track_boat_view()` - Records a new view
- `update_view_duration()` - Updates how long a user viewed a boat

### 3. Create Analytics Triggers (Optional)
For automatic analytics updates:
```sql
-- Run the contents of: supabase/migrations/create_analytics_triggers.sql
```

This creates triggers that automatically update analytics when:
- A boat is saved/unsaved
- A message is sent about a boat

## How to Run Migrations

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste each migration file's contents
4. Run the SQL

## Verification

After running the migrations, verify they work by:
1. Viewing a boat listing
2. Going to the boat's analytics page (/boats/[id]/analytics)
3. The page should load without errors

## Troubleshooting

If you see "Error loading stats" in the console:
- The analytics page has a fallback that will load data directly from tables
- Make sure you've run all three migration files in order
- Check the Supabase logs for any SQL errors

## Features Enabled

Once migrations are complete, you'll have:
- View tracking with duration
- Daily analytics aggregation  
- Save/unsave tracking
- Message tracking
- Analytics dashboard for boat owners