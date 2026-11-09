package com.app.contractor.service;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.entity.User;
import com.app.contractor.entity.WorkerProfile;
import com.app.contractor.exception.ApiException;
import com.app.contractor.repository.UserRepository;
import com.app.contractor.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WorkerProfileService {
    private final WorkerProfileRepository repo;
    private final UserRepository users;

    private static String clean(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    @Transactional(readOnly = true)
    public WorkerProfileResponse get(Long uid) {
        return repo.findByUserId(uid).map(WorkerProfileResponse::from).orElse(new WorkerProfileResponse(null, null, null));
    }

    @Transactional
    public WorkerProfileResponse save(Long uid, WorkerProfileRequest r) {
        User u = users.findById(uid).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User nahi mila"));
        WorkerProfile p = repo.findByUserId(uid).orElseGet(() -> WorkerProfile.builder().user(u).build());
        p.setSkills(clean(r.skills()));
        p.setExperienceYears(r.experienceYears());
        p.setAbout(clean(r.about()));
        return WorkerProfileResponse.from(repo.save(p));
    }
}
