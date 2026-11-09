package com.app.contractor.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import com.app.contractor.entity.ContractorProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ContractorProfileRepository extends JpaRepository<ContractorProfile, Long> {
    Optional<ContractorProfile> findByUserId(Long userId);
    Page<ContractorProfile> findByCompanyNameContainingIgnoreCase(String q, Pageable pageable);
    Page<ContractorProfile> findByVerified(boolean verified, Pageable pageable);
    long countByVerified(boolean verified);

    @Modifying(clearAutomatically = true)
    @Query("delete from ContractorProfile p where p.user.id = :uid")
    void purgeByUser(@Param("uid") Long uid);
}
