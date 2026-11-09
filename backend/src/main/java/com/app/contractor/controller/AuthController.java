package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.service.AuthService;
import com.app.contractor.service.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;
    private final RateLimiter limiter;

    @PostMapping("/send-otp")
    public Map<String, String> sendOtp(@Valid @RequestBody SendOtpRequest r, HttpServletRequest req) {
        limiter.check("otp:phone:" + r.phone(), 3, 600, "Is number par 10 minute me 3 se zyada OTP nahi bhej sakte");
        limiter.check("otp:ip:" + req.getRemoteAddr(), 20, 3600, "Bahut zyada requests, thodi der baad try karo");
        auth.sendOtp(r.phone());
        return Map.of("message", "OTP bhej diya");
    }

    /** Google ID token se login. Naye Google account ke liye phone + OTP bhi chahiye (ek hi baar). */
    @PostMapping("/google")
    public GoogleAuthResponse google(@Valid @RequestBody GoogleLoginRequest r, HttpServletRequest req) {
        limiter.check("google:ip:" + req.getRemoteAddr(), 40, 600, "Bahut zyada requests, thodi der baad try karo");
        if (r.phone() != null && !r.phone().isBlank())
            limiter.check("verify:phone:" + r.phone(), 10, 600, "Bahut zyada galat try, 10 minute baad aana");
        return auth.googleLogin(r);
    }

    @PostMapping("/verify-otp")
    public AuthResponse verify(@Valid @RequestBody VerifyOtpRequest r, HttpServletRequest req) {
        limiter.check("verify:phone:" + r.phone(), 10, 600, "Bahut zyada galat try, 10 minute baad aana");
        limiter.check("verify:ip:" + req.getRemoteAddr(), 40, 600, "Bahut zyada requests, thodi der baad try karo");
        return auth.verify(r);
    }
}
