package org.example.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "landmarks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Landmark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "full_description", columnDefinition = "TEXT")
    private String fullDescription;

    @Column(name = "architecture_style")
    private String architectureStyle;

    @Column(name = "build_year")
    private Integer buildYear;

    @Column(name = "photo_url")
    private String photoUrl;

    private String category;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "object_type", nullable = false, columnDefinition = "varchar(255) default 'BUILDING'")
    private LandmarkType objectType = LandmarkType.BUILDING;

    @Column(columnDefinition = "GEOMETRY(Point, 4326)", nullable = false)
    private Point location;

    @Column(name = "footprint", columnDefinition = "GEOMETRY(MultiPolygon, 4326)")
    private MultiPolygon footprint;

    @Builder.Default
    @Column(name = "visibility_radius_m")
    private Double visibilityRadiusMeters = 100.0;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean active = true;
}