-- Create marina_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS marina_details (
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE PRIMARY KEY,
    slip_count INTEGER,
    max_vessel_length INTEGER,
    max_vessel_draft DECIMAL(5,2),
    fuel_types TEXT[],
    has_fuel_dock BOOLEAN DEFAULT false,
    has_pump_out BOOLEAN DEFAULT false,
    has_haul_out BOOLEAN DEFAULT false,
    has_boat_ramp BOOLEAN DEFAULT false,
    has_dry_storage BOOLEAN DEFAULT false,
    amenities JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);