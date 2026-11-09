package com.app.contractor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "jobs", indexes = {
        @Index(name = "idx_job_contractor", columnList = "contractor_id"),
        @Index(name = "idx_job_status_created", columnList = "status, createdAt")})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Job {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contractor_id", nullable = false)
    private User contractor;
    @Column(nullable = false)
    private String title;
    @Column(length = 2000)
    private String description;
    @Column(nullable = false)
    private String location;
    private Integer salary;
    private Integer workersNeeded;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default
    private JobStatus status = JobStatus.OPEN;
    @Builder.Default
    private Instant createdAt = Instant.now();
}
