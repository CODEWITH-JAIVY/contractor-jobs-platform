package com.app.contractor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "follows", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "contractor_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Follow {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contractor_id", nullable = false)
    private User contractor;
    @Builder.Default
    private Instant createdAt = Instant.now();
}
