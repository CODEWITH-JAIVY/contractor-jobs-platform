package com.app.contractor.service;

import com.app.contractor.dto.Dtos.ContractorResponse;
import com.app.contractor.entity.*;
import com.app.contractor.exception.ApiException;
import com.app.contractor.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowService {
    private final FollowRepository follows;
    private final UserRepository users;
    private final ContractorProfileRepository profiles;
    private final ContractorService contractorService;

    @Transactional
    public void follow(Long userId, Long contractorId) {
        User c = users.findById(contractorId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Contractor nahi mila"));
        if (c.getRole() != Role.CONTRACTOR)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Sirf contractor ko follow kar sakte ho");
        if (follows.existsByUserIdAndContractorId(userId, contractorId))
            throw new ApiException(HttpStatus.CONFLICT, "Pehle se follow kar rahe ho");
        follows.save(Follow.builder().user(users.getReferenceById(userId)).contractor(c).build());
    }

    @Transactional
    public void unfollow(Long userId, Long contractorId) {
        follows.deleteByUserIdAndContractorId(userId, contractorId);
    }

    @Transactional(readOnly = true)
    public List<ContractorResponse> myFollowing(Long userId) {
        return follows.findByUserId(userId).stream()
                .map(f -> profiles.findByUserId(f.getContractor().getId()))
                .flatMap(java.util.Optional::stream)
                .map(contractorService::toResponse)
                .toList();
    }
}
