package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.exception.ApiException;
import com.app.contractor.repository.UserRepository;
import com.app.contractor.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository users;
    private final AccountService account;

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Long uid) {
        return UserResponse.from(users.findById(uid).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User nahi mila")));
    }

    /** Mobile app login ke baad FCM token yaha bhejega. */
    @PutMapping("/me/fcm-token")
    @Transactional
    public void fcm(@AuthenticationPrincipal Long uid, @Valid @RequestBody FcmTokenRequest r) {
        users.findById(uid).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User nahi mila")).setFcmToken(r.token());
    }

    /** Account aur saara data permanently delete. */
    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMe(@AuthenticationPrincipal Long uid) { account.deleteAccount(uid); }
}
