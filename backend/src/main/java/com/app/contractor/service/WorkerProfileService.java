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

    private User user(Long uid) {
        return users.findById(uid).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private static WorkerProfileResponse toResponse(User u, WorkerProfile p) {
        return new WorkerProfileResponse(u.getName(), u.getCity(),
                p == null ? null : p.getContactPhone(), p == null ? null : p.getSkills(),
                p == null ? null : p.getExperienceYears(), p == null ? null : p.getAbout(), p != null);
    }

    @Transactional(readOnly = true)
    public WorkerProfileResponse get(Long uid) {
        return toResponse(user(uid), repo.findByUserId(uid).orElse(null));
    }

    @Transactional
    public WorkerProfileResponse save(Long uid, WorkerProfileRequest r) {
        User u = user(uid);
        if (clean(r.name()) != null) u.setName(clean(r.name()));
        if (clean(r.city()) != null) u.setCity(clean(r.city()));
        WorkerProfile p = repo.findByUserId(uid).orElseGet(() -> WorkerProfile.builder().user(u).build());
        p.setContactPhone(clean(r.phone()));
        p.setSkills(clean(r.skills()));
        p.setExperienceYears(r.experienceYears());
        p.setAbout(clean(r.about()));
        return toResponse(u, repo.save(p));
    }
}
