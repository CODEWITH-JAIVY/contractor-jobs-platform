package com.app.contractor.service;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.entity.ContractorProfile;
import com.app.contractor.entity.User;
import com.app.contractor.exception.ApiException;
import com.app.contractor.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContractorService {
    private final ContractorProfileRepository profiles;
    private final UserRepository users;
    private final FollowRepository follows;

    @Transactional
    public ContractorResponse saveProfile(Long userId, ContractorProfileRequest r) {
        User u = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User nahi mila"));
        ContractorProfile p = profiles.findByUserId(userId)
                .orElseGet(() -> ContractorProfile.builder().user(u).build());
        p.setCompanyName(r.companyName());
        p.setWorkType(r.workType());
        p.setExperienceYears(r.experienceYears());
        p.setAbout(r.about());
        return toResponse(profiles.save(p));
    }

    @Transactional(readOnly = true)
    public ContractorResponse get(Long contractorUserId) {
        return toResponse(profiles.findByUserId(contractorUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Contractor profile nahi mili")));
    }

    @Transactional(readOnly = true)
    public Page<ContractorResponse> search(String q, Pageable pageable) {
        Page<ContractorProfile> page = (q == null || q.isBlank())
                ? profiles.findAll(pageable)
                : profiles.findByCompanyNameContainingIgnoreCase(q, pageable);
        return page.map(this::toResponse);
    }

    ContractorResponse toResponse(ContractorProfile p) {
        User u = p.getUser();
        return new ContractorResponse(u.getId(), u.getName(), u.getCity(), p.getCompanyName(), p.getWorkType(),
                p.getExperienceYears(), p.getAbout(), p.isVerified(), follows.countByContractorId(u.getId()));
    }
}
