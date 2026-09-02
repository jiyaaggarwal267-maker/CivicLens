// PostGIS-backed geospatial queries. CivicIssue keeps a `geography(Point,4326)`
// column (see migration 20240101000001_postgis) that a database trigger keeps
// in sync with latitude/longitude. Duplicate detection and map bounding-box
// lookups both go through ST_DWithin / ST_MakeEnvelope here rather than doing
// distance math in JS.
import { prisma } from "../db/prisma";

export interface NearbyIssue {
  id: string;
  distanceMeters: number;
}

export async function findIssuesWithinRadius(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  category?: string
): Promise<NearbyIssue[]> {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; distance_meters: number }>>(
    `
    SELECT id, ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters
    FROM "CivicIssue"
    WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      AND status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS')
      ${category ? `AND category = $4::"Category"` : ""}
    ORDER BY distance_meters ASC
    `,
    longitude,
    latitude,
    radiusMeters,
    ...(category ? [category] : [])
  );

  return rows.map((r) => ({ id: r.id, distanceMeters: Number(r.distance_meters) }));
}
