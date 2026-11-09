package com.app.contractor.service;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.entity.*;
import com.app.contractor.event.JobCreatedEvent;
import com.app.contractor.exception.ApiException;
import com.app.contractor.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JobService {
    private final JobRepository jobs;
    private final UserRepository users;
    private final ContractorProfileRepository profiles;
    private final ApplicationEventPublisher events;
    private final RateLimiter limiter;

    @Transactional
    public JobResponse create(Long contractorId, JobRequest r) {
        limiter.check("job:" + contractorId, 10, 86400, "Ek din me 10 se zyada job post nahi kar sakte");
        if (profiles.findByUserId(contractorId).isEmpty())
            throw new ApiException(HttpStatus.BAD_REQUEST, "Job post karne se pehle contractor profile banao");
        User c = users.getReferenceById(contractorId);
        Job job = jobs.save(Job.builder().contractor(c).title(r.title()).description(r.description())
                .location(r.location()).salary(r.salary()).workersNeeded(r.workersNeeded()).build());
        events.publishEvent(new JobCreatedEvent(job.getId(), contractorId));
        return JobResponse.from(job);
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> list(String city, Pageable p) {
        Page<Job> page = (city == null || city.isBlank())
                ? jobs.findByStatusOrderByCreatedAtDesc(JobStatus.OPEN, p)
                : jobs.findByStatusAndLocationContainingIgnoreCaseOrderByCreatedAtDesc(JobStatus.OPEN, city, p);
        return page.map(JobResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> feed(Long userId, Pageable p) {
        return jobs.findFeed(userId, JobStatus.OPEN, p).map(JobResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> mine(Long contractorId, Pageable p) {
        return jobs.findByContractorIdOrderByCreatedAtDesc(contractorId, p).map(JobResponse::from);
    }

    @Transactional(readOnly = true)
    public JobResponse get(Long id) {
        return JobResponse.from(jobs.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Job nahi mili")));
    }

    @Transactional
    public JobResponse close(Long contractorId, Long jobId) {
        Job j = jobs.findById(jobId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Job nahi mili"));
        if (!j.getContractor().getId().equals(contractorId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Ye job tumhari nahi hai");
        j.setStatus(JobStatus.CLOSED);
        return JobResponse.from(j);
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> openByContractor(Long contractorId, Pageable p) {
        return jobs.findByContractorIdAndStatusOrderByCreatedAtDesc(contractorId, JobStatus.OPEN, p).map(JobResponse::from);
    }
}
