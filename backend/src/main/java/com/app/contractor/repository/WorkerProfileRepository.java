package com.app.contractor.repository;

import com.app.contractor.entity.WorkerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, Long> {
    Optional<WorkerProfile> findByUserId(Long userId);
    List<WorkerProfile> findByUserIdIn(Collection<Long> userIds);

    @Modifying(clearAutomatically = true)
    @Query("delete from WorkerProfile p where p.user.id = :uid")
    void purgeByUser(@Param("uid") Long uid);
}
