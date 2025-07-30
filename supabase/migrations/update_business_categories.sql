-- Remove redundant categories
DELETE FROM business_categories WHERE name IN ('Boat Repair & Service', 'Boat Rentals & Charters', 'Engine Service');

-- Add new categories
INSERT INTO business_categories (name, description, icon) VALUES
('Warranty Repair', 'Authorized warranty repair services', 'shield-check'),
('Vinyl, Tint & Protective Film', 'Vinyl wrapping, window tinting, and protective films', 'film'),
('Paint & Gelcoat', 'Boat painting and gelcoat repair services', 'paint-roller'),
('Rigging', 'Sailboat rigging and tuning services', 'anchor'),
('Boat Fuel', 'Marine fuel docks and services', 'gas-pump');
