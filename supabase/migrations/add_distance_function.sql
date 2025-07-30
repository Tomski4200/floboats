CREATE OR REPLACE FUNCTION distance(
    lat1 float,
    lon1 float,
    lat2 float,
    lon2 float)
RETURNS float AS $$
DECLARE
    x float = 69.1 * (lat2 - lat1);
    y float = 69.1 * (lon2 - lon1) * cos(lat1 / 57.3);
BEGIN
    RETURN sqrt(x * x + y * y);
END;
$$ LANGUAGE plpgsql;
