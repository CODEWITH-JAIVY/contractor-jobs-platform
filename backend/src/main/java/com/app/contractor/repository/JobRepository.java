package com.app.contractor.repository;

import org.springframework.data.jpa.repository.Modifying;
import com.app.contractor.entity.Job;
import com.app.contractor.entity.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JobRepository extends JpaRepository<Job, Long> {

    Page<Job> findByStatusOrderByCreatedAtDesc(JobStatus status, Pageable pageable);

    Page<Job> findByStatusAndLocationContainingIgnoreCaseOrderByCreatedAtDesc(
            JobStatus status, String location, Pageable pageable);

    Page<Job> findByContractorIdOrderByCreatedAtDesc(Long contractorId, Pageable pageable);

    @Query("""
           select j from Job j
           where j.status = :status
             and j.contractor.id in (select f.contractor.id from Follow f where f.user.id = :userId)
           order by j.createdAt desc
           """)
    Page<Job> findFeed(@Param("userId") Long userId, @Param("status") JobStatus status, Pageable pageable);

    Page<Job> findByContractorIdAndStatusOrderByCreatedAtDesc(Long contractorId, JobStatus status, Pageable pageable);

    long countByStatus(JobStatus status);

    @Modifying(clearAutomatically = true)
    @Query("delete from Job j where j.contractor.id = :cid")
    void purgeByContractor(@Param("cid") Long contractorId);
}
