package org.example.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "landmarks", indexes = {
        @Index(name = "idx_landmarks_location", columnList = "location")
})
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

    @Column(columnDefinition = "GEOMETRY(Point, 4326)", nullable = false)
    private Point location;
}
