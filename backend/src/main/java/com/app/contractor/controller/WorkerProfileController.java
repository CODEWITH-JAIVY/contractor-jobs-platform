package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.service.WorkerProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/workers/me/profile")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class WorkerProfileController {
    private final WorkerProfileService service;

    @GetMapping
    public WorkerProfileResponse get(@AuthenticationPrincipal Long uid) { return service.get(uid); }

    @PutMapping
    public WorkerProfileResponse save(@AuthenticationPrincipal Long uid, @Valid @RequestBody WorkerProfileRequest r) {
        return service.save(uid, r);
    }
}
