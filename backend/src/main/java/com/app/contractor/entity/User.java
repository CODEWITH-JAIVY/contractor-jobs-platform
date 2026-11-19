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
    /** Contractor/admin ka login number. Email (Google) se aaye worker ka khali ho sakta hai. */
    @Column(unique = true, length = 15)
    private String phone;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Role role;
    private String city;
    private String fcmToken;
    @Column(unique = true)
    private String googleSub;
    private String email;
    /** App ki bhasha: en ya hi. Notifications isi me bante hain. */
    @Column(length = 2)
    private String lang;
    /** Worker ke apne hisaab ke liye (private). */
    private Integer dailyWage;
    private Integer overtimeRate;
    @Builder.Default
    private Instant createdAt = Instant.now();
}
