package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.service.ContractorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/contractors")
@RequiredArgsConstructor
public class ContractorController {
    private final ContractorService service;

    @PutMapping("/profile")
    @PreAuthorize("hasRole('CONTRACTOR')")
    public ContractorResponse save(@AuthenticationPrincipal Long uid, @Valid @RequestBody ContractorProfileRequest r) {
        return service.saveProfile(uid, r);
    }

    @GetMapping
    public Page<ContractorResponse> search(@RequestParam(required = false) String q, Pageable pageable) {
        return service.search(q, pageable);
    }

    @GetMapping("/{id}")
    public ContractorResponse get(@PathVariable Long id) { return service.get(id); }
}
