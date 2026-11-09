package com.app.contractor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Worker ka apna private hisaab: ek din = ek entry. */
@Entity
@Table(name = "attendance_entries",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "work_date"}),
        indexes = @Index(name = "idx_att_user_date", columnList = "user_id, work_date"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AttendanceEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private AttendanceStatus status;
    @Column(nullable = false, precision = 3, scale = 1)
    @Builder.Default
    private BigDecimal overtimeHours = BigDecimal.ZERO;
    @Column(length = 200)
    private String note;
    /** Us din ka rate (snapshot), taaki baad me rate badalne se purana hisaab na badle. */
    private Integer dailyWage;
    private Integer overtimeRate;
}
