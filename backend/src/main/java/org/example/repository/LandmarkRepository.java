package org.example.repository;

import org.example.entity.Landmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LandmarkRepository extends JpaRepository<Landmark, Long> {

    interface NearbyLandmarkProjection {
        Long getId();
        String getName();
        String getDescription();
        String getFullDescription();
        String getArchitectureStyle();
        Integer getBuildYear();
        String getPhotoUrl();
        String getPhotoUrlsRaw();
        String getCategory();
        String getObjectType();
        Double getVisibilityRadiusMeters();
        Double getLatitude();
        Double getLongitude();
        Double getDistanceMeters();
        Double getBearingDegrees();
    }

    @Query(value = """
        SELECT
            l.id AS id,
            l.name AS name,
            l.description AS description,
            l.full_description AS fullDescription,
            l.architecture_style AS architectureStyle,
            l.build_year AS buildYear,
            (SELECT lp.photo_url FROM landmark_photos lp WHERE lp.landmark_id = l.id ORDER BY lp.photo_order ASC LIMIT 1) AS photoUrl,
            ARRAY_TO_STRING(ARRAY(SELECT lp.photo_url FROM landmark_photos lp WHERE lp.landmark_id = l.id ORDER BY lp.photo_order ASC), '|') AS photoUrlsRaw,
            l.category AS category,
            l.object_type AS objectType,
            l.visibility_radius_m AS visibilityRadiusMeters,
            ST_Y(l.location) AS latitude,
            ST_X(l.location) AS longitude,
            ST_Distance(
                CAST(COALESCE(l.footprint, l.location) AS geography),
                CAST(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326) AS geography)
            ) AS distanceMeters,
            MOD(
                CAST(DEGREES(ST_Azimuth(
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
                    ST_ClosestPoint(COALESCE(l.footprint, l.location), ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))
                )) + 360.0 AS numeric),
                360.0
            ) AS bearingDegrees
        FROM landmarks l
        WHERE l.active = true
          AND (
              (
                  l.object_type = 'BUILDING'
                  AND l.footprint IS NOT NULL
                  AND ST_DWithin(
                      CAST(l.footprint AS geography),
                      CAST(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326) AS geography),
                      :radiusMeters
                  )
              )
              OR (
                  (l.object_type <> 'BUILDING' OR l.footprint IS NULL)
                  AND ST_DWithin(
                      CAST(l.location AS geography),
                      CAST(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326) AS geography),
                      GREATEST(:radiusMeters, COALESCE(l.visibility_radius_m, 100.0))
                  )
              )
          )
        ORDER BY distanceMeters ASC
    """, nativeQuery = true)
    List<NearbyLandmarkProjection> findNearbyLandmarks(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("radiusMeters") double radiusMeters
    );
}