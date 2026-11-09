package com.app.contractor.repository;

import com.app.contractor.entity.AttendanceEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<AttendanceEntry, Long> {
    Optional<AttendanceEntry> findByUserIdAndWorkDate(Long userId, LocalDate workDate);
    List<AttendanceEntry> findByUserIdAndWorkDateBetweenOrderByWorkDateAsc(Long userId, LocalDate from, LocalDate to);
    long deleteByUserIdAndWorkDate(Long userId, LocalDate workDate);

    @Modifying(clearAutomatically = true)
    @Query("delete from AttendanceEntry a where a.user.id = :uid")
    void purgeByUser(@Param("uid") Long uid);
    List<AttendanceEntry> findByUserId(Long userId);
}
