package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.AuthResponse;
import com.app.contractor.dto.Dtos.DevWorkerRequest;
import com.app.contractor.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Sirf testing: Google set up kiye bina worker login. Tabhi banta hai jab OTP_DEV_MODE=true;
 * APP_ENV=prod me dev-mode band hona zaroori hai (StartupChecks), isliye production me ye endpoint hota hi nahi.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.otp.dev-mode", havingValue = "true")
public class DevAuthController {
    private final AuthService auth;

    @PostMapping("/dev-worker")
    public AuthResponse devWorker(@Valid @RequestBody DevWorkerRequest r) { return auth.devWorker(r.email(), r.name()); }
}
