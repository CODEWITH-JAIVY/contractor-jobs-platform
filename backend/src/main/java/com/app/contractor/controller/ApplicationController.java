package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ApplicationController {
    private final ApplicationService service;

    @PostMapping("/jobs/{jobId}/apply")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('USER')")
    public ApplicationResponse apply(@AuthenticationPrincipal Long uid, @PathVariable Long jobId) {
        return service.apply(uid, jobId);
    }

    @GetMapping("/applications/my")
    @PreAuthorize("hasRole('USER')")
    public Page<ApplicationResponse> mine(@AuthenticationPrincipal Long uid, Pageable p) { return service.mine(uid, p); }

    @GetMapping("/jobs/{jobId}/applicants")
    @PreAuthorize("hasRole('CONTRACTOR')")
    public List<ApplicantResponse> applicants(@AuthenticationPrincipal Long uid, @PathVariable Long jobId) {
        return service.applicants(uid, jobId);
    }

    @PutMapping("/applications/{id}/status")
    @PreAuthorize("hasRole('CONTRACTOR')")
    public ApplicantResponse status(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody StatusRequest r) {
        return service.updateStatus(uid, id, r.status());
    }
}
