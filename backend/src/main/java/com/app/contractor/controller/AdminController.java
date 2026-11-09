package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.AdminContractor;
import com.app.contractor.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService service;

    @GetMapping("/stats")
    public Map<String, Long> stats() { return service.stats(); }

    @GetMapping("/contractors")
    public Page<AdminContractor> contractors(@RequestParam(defaultValue = "false") boolean verified, Pageable p) {
        return service.contractors(verified, p);
    }

    @PutMapping("/contractors/{userId}/verify")
    public AdminContractor verify(@PathVariable Long userId) { return service.setVerified(userId, true); }

    @PutMapping("/contractors/{userId}/unverify")
    public AdminContractor unverify(@PathVariable Long userId) { return service.setVerified(userId, false); }

    @PutMapping("/jobs/{id}/close")
    public void closeJob(@PathVariable Long id) { service.closeJob(id); }
}
