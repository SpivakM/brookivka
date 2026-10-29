package org.example.repository;

import org.example.entity.Landmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LandmarkRepository extends JpaRepository<Landmark, Long> {

    @Query(value = """
        SELECT * FROM landmarks l
        WHERE ST_DWithin(
            CAST(l.location AS geography),
            CAST(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326) AS geography),
            :radiusMeters
        )
    """, nativeQuery = true)
    List<Landmark> findNearbyLandmarks(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("radiusMeters") double radiusMeters
    );
}