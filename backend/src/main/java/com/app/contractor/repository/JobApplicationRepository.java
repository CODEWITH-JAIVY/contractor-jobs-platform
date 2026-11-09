package com.app.contractor.repository;

import org.springframework.data.jpa.repository.Modifying;
import com.app.contractor.entity.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    boolean existsByJobIdAndUserId(Long jobId, Long userId);
    Page<JobApplication> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("select a from JobApplication a join fetch a.user where a.job.id = :jobId order by a.createdAt desc")
    List<JobApplication> findApplicants(@Param("jobId") Long jobId);

    @Modifying(clearAutomatically = true)
    @Query("delete from JobApplication a where a.user.id = :uid")
    void purgeByUser(@Param("uid") Long uid);

    @Modifying(clearAutomatically = true)
    @Query("delete from JobApplication a where a.job.id in (select j.id from Job j where j.contractor.id = :cid)")
    void purgeByContractorJobs(@Param("cid") Long contractorId);
}
