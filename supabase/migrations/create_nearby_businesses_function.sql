-- This function finds businesses within a given radius of a latitude/longitude point.
-- It uses the previously created `distance` function.
-- Note: The `coordinates` column in the `businesses` table is a POINT type, which stores (longitude, latitude).
-- So, coordinates[0] is longitude and coordinates[1] is latitude.

CREATE OR REPLACE FUNCTION nearby_businesses(
    lat float,
    long float,
    radius int
)
RETURNS TABLE(id uuid, distance_miles float) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    distance(lat, long, b.coordinates[1], b.coordinates[0]) AS distance_miles
  FROM
    businesses AS b
  WHERE
    b.coordinates IS NOT NULL
    AND distance(lat, long, b.coordinates[1], b.coordinates[0]) < radius;
END;
$$ LANGUAGE plpgsql;
