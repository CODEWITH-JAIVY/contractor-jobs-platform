package com.app.contractor.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "worker_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkerProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    @Column(length = 200)
    private String skills;
    private Integer experienceYears;
    @Column(length = 1000)
    private String about;
}
