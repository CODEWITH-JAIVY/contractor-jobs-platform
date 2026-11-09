package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
public class JobController {
    private final JobService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CONTRACTOR')")
    public JobResponse create(@AuthenticationPrincipal Long uid, @Valid @RequestBody JobRequest r) {
        return service.create(uid, r);
    }

    @GetMapping
    public Page<JobResponse> list(@RequestParam(required = false) String city, Pageable p) { return service.list(city, p); }

    @GetMapping("/feed")
    @PreAuthorize("hasRole('USER')")
    public Page<JobResponse> feed(@AuthenticationPrincipal Long uid, Pageable p) { return service.feed(uid, p); }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('CONTRACTOR')")
    public Page<JobResponse> mine(@AuthenticationPrincipal Long uid, Pageable p) { return service.mine(uid, p); }

    @GetMapping("/{id}")
    public JobResponse get(@PathVariable Long id) { return service.get(id); }

    @PutMapping("/{id}/close")
    @PreAuthorize("hasRole('CONTRACTOR')")
    public JobResponse close(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return service.close(uid, id); }

    @GetMapping("/by-contractor/{contractorId}")
    public Page<JobResponse> byContractor(@PathVariable Long contractorId, Pageable p) { return service.openByContractor(contractorId, p); }
}
