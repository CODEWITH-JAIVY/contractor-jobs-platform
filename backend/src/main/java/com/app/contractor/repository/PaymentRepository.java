package com.app.contractor.repository;

import com.app.contractor.entity.PaymentEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface PaymentRepository extends JpaRepository<PaymentEntry, Long> {
    List<PaymentEntry> findByUserIdAndPayDateBetweenOrderByPayDateDesc(Long userId, LocalDate from, LocalDate to);
    long deleteByIdAndUserId(Long id, Long userId);

    @Query("select coalesce(sum(p.amount), 0) from PaymentEntry p where p.user.id = :uid")
    Long sumAll(@Param("uid") Long uid);

    @Modifying(clearAutomatically = true)
    @Query("delete from PaymentEntry p where p.user.id = :uid")
    void purgeByUser(@Param("uid") Long uid);
}
