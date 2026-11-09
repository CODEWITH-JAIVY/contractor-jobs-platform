package com.app.contractor.repository;

import org.springframework.data.jpa.repository.Modifying;
import com.app.contractor.entity.Follow;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    boolean existsByUserIdAndContractorId(Long userId, Long contractorId);
    long deleteByUserIdAndContractorId(Long userId, Long contractorId);
    long countByContractorId(Long contractorId);
    List<Follow> findByUserId(Long userId);

    /** Followers ko chunks me load karne ke liye (lakho followers par bhi memory safe). */
    @Query("select f from Follow f join fetch f.user where f.contractor.id = :cid order by f.id")
    Slice<Follow> findFollowersPage(@Param("cid") Long contractorId, Pageable pageable);

    @Modifying(clearAutomatically = true)
    @Query("delete from Follow f where f.user.id = :uid or f.contractor.id = :uid")
    void purgeFor(@Param("uid") Long uid);
}
