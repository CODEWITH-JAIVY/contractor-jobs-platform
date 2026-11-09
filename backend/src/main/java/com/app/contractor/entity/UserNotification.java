package com.app.contractor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "notifications", indexes = @Index(name = "idx_notif_user_created", columnList = "user_id, createdAt"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserNotification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;
    @Column(nullable = false)
    private String title;
    @Column(length = 500)
    private String body;
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean seen = false;
    @Builder.Default
    private Instant createdAt = Instant.now();
}
