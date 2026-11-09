package com.app.contractor.service;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.entity.*;
import com.app.contractor.event.ApplicationStatusEvent;
import com.app.contractor.exception.ApiException;
import com.app.contractor.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private final JobApplicationRepository applications;
    private final JobRepository jobs;
    private final UserRepository users;
    private final ApplicationEventPublisher events;
    private final RateLimiter limiter;
    private final WorkerProfileRepository workerProfiles;

    @Transactional
    public ApplicationResponse apply(Long userId, Long jobId) {
        limiter.check("apply:" + userId, 50, 86400, "Ek din me 50 se zyada apply nahi kar sakte");
        Job job = jobs.findById(jobId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Job nahi mili"));
        if (job.getStatus() != JobStatus.OPEN)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ye job band ho chuki hai");
        if (applications.existsByJobIdAndUserId(jobId, userId))
            throw new ApiException(HttpStatus.CONFLICT, "Aap is job par pehle apply kar chuke ho");
        JobApplication a = applications.save(JobApplication.builder().job(job).user(users.getReferenceById(userId)).build());
        return ApplicationResponse.from(a);
    }

    @Transactional(readOnly = true)
    public Page<ApplicationResponse> mine(Long userId, Pageable p) {
        return applications.findByUserIdOrderByCreatedAtDesc(userId, p).map(ApplicationResponse::from);
    }

    @Transactional(readOnly = true)
    public List<ApplicantResponse> applicants(Long contractorId, Long jobId) {
        Job job = jobs.findById(jobId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Job nahi mili"));
        if (!job.getContractor().getId().equals(contractorId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Ye job tumhari nahi hai");
        List<JobApplication> list = applications.findApplicants(jobId);
        if (list.isEmpty()) return List.of();
        java.util.Map<Long, WorkerProfile> pm = workerProfiles
                .findByUserIdIn(list.stream().map(a -> a.getUser().getId()).toList()).stream()
                .collect(java.util.stream.Collectors.toMap(p -> p.getUser().getId(), p -> p));
        return list.stream().map(a -> ApplicantResponse.from(a, pm.get(a.getUser().getId()))).toList();
    }

    @Transactional
    public ApplicantResponse updateStatus(Long contractorId, Long applicationId, ApplicationStatus status) {
        if (status == ApplicationStatus.APPLIED)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Status sirf ACCEPTED ya REJECTED ho sakta hai");
        JobApplication a = applications.findById(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application nahi mili"));
        if (!a.getJob().getContractor().getId().equals(contractorId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Ye job tumhari nahi hai");
        if (a.getStatus() != status) {
            a.setStatus(status);
            events.publishEvent(new ApplicationStatusEvent(a.getUser().getId(), a.getJob().getId(), status));
        }
        return ApplicantResponse.from(a, workerProfiles.findByUserId(a.getUser().getId()).orElse(null));
    }
}
