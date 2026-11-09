package com.app.contractor.service;

import com.app.contractor.dto.Dtos.AdminContractor;
import com.app.contractor.entity.*;
import com.app.contractor.exception.ApiException;
import com.app.contractor.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository users;
    private final ContractorProfileRepository profiles;
    private final JobRepository jobs;
    private final JobApplicationRepository applications;
    private final FollowRepository follows;

    @Transactional(readOnly = true)
    public Map<String, Long> stats() {
        Map<String, Long> m = new LinkedHashMap<>();
        m.put("workers", users.countByRole(Role.USER));
        m.put("contractors", users.countByRole(Role.CONTRACTOR));
        m.put("verifiedContractors", profiles.countByVerified(true));
        m.put("openJobs", jobs.countByStatus(JobStatus.OPEN));
        m.put("applications", applications.count());
        m.put("follows", follows.count());
        return m;
    }

    @Transactional(readOnly = true)
    public Page<AdminContractor> contractors(boolean verified, Pageable p) {
        return profiles.findByVerified(verified, p).map(AdminContractor::from);
    }

    @Transactional
    public AdminContractor setVerified(Long contractorUserId, boolean value) {
        ContractorProfile p = profiles.findByUserId(contractorUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Contractor profile nahi mili"));
        p.setVerified(value);
        return AdminContractor.from(p);
    }

    @Transactional
    public void closeJob(Long jobId) {
        Job j = jobs.findById(jobId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Job nahi mili"));
        j.setStatus(JobStatus.CLOSED);
    }
}
