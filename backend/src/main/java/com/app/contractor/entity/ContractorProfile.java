package com.app.contractor.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "contractor_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContractorProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    @Column(nullable = false)
    private String companyName;
    private String workType;
    private Integer experienceYears;
    @Column(length = 1000)
    private String about;
    @Builder.Default
    private boolean verified = false;
}
