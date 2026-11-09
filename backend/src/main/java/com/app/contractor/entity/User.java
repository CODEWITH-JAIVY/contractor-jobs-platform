package com.app.contractor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(nullable = false, unique = true, length = 15)
    private String phone;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Role role;
    private String city;
    private String fcmToken;
    @Column(unique = true)
    private String googleSub;
    private String email;
    /** Worker ke apne hisaab ke liye (private). */
    private Integer dailyWage;
    private Integer overtimeRate;
    @Builder.Default
    private Instant createdAt = Instant.now();
}
