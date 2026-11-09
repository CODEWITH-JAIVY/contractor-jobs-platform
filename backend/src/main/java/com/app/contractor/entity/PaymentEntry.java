package com.app.contractor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

/** Worker ko contractor se jo paisa / advance mila (worker ka private hisaab). */
@Entity
@Table(name = "payment_entries", indexes = @Index(name = "idx_pay_user_date", columnList = "user_id, pay_date"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "pay_date", nullable = false)
    private LocalDate payDate;
    @Column(nullable = false)
    private Integer amount;
    @Column(length = 200)
    private String note;
}
