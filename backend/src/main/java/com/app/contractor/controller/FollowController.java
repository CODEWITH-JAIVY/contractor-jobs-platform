package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.ContractorResponse;
import com.app.contractor.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/follow")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class FollowController {
    private final FollowService service;

    @PostMapping("/{contractorId}")
    public void follow(@AuthenticationPrincipal Long uid, @PathVariable Long contractorId) { service.follow(uid, contractorId); }

    @DeleteMapping("/{contractorId}")
    public void unfollow(@AuthenticationPrincipal Long uid, @PathVariable Long contractorId) { service.unfollow(uid, contractorId); }

    @GetMapping("/my")
    public List<ContractorResponse> my(@AuthenticationPrincipal Long uid) { return service.myFollowing(uid); }
}
