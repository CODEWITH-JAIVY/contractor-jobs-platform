package com.app.contractor.repository;

import com.app.contractor.entity.UserNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    Page<UserNotification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    long countByUserIdAndSeenFalse(Long userId);

    @Modifying
    @Query("update UserNotification n set n.seen = true where n.user.id = :uid and n.seen = false")
    int markAllRead(@Param("uid") Long uid);

    @Modifying
    @Query("update UserNotification n set n.seen = true where n.id = :id and n.user.id = :uid")
    int markRead(@Param("id") Long id, @Param("uid") Long uid);

    @Modifying(clearAutomatically = true)
    @Query("delete from UserNotification n where n.user.id = :uid")
    void purgeByUser(@Param("uid") Long uid);

    @Modifying(clearAutomatically = true)
    @Query("delete from UserNotification n where n.job.id in (select j.id from Job j where j.contractor.id = :cid)")
    void purgeByContractorJobs(@Param("cid") Long contractorId);
}
