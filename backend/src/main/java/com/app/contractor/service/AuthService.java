package com.app.contractor.service;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.entity.Role;
import com.app.contractor.entity.User;
import com.app.contractor.exception.ApiException;
import com.app.contractor.repository.UserRepository;
import com.app.contractor.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SMS ka kharcha bachane ke liye:
 *  - Contractor (aur admin): mobile OTP
 *  - Worker: email (Google) se, koi SMS nahi
 */
@Service
@RequiredArgsConstructor
public class AuthService {
    private static final String WORKER_USES_GOOGLE = "Workers sign in with Google. Mobile OTP is for contractors.";

    private final OtpService otpService;
    private final UserRepository users;
    private final JwtService jwt;
    private final GoogleTokenVerifier google;

    private static String clean(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    /** Worker ke number par SMS bhejne se pehle hi rok do (bekar kharcha). */
    public void sendOtp(String phone) {
        users.findByPhone(phone).ifPresent(u -> {
            if (u.getRole() == Role.USER) throw new ApiException(HttpStatus.BAD_REQUEST, WORKER_USES_GOOGLE);
        });
        otpService.send(phone);
    }

    @Transactional
    public AuthResponse verify(VerifyOtpRequest r) {
        User existing = users.findByPhone(r.phone()).orElse(null);
        if (existing != null && existing.getRole() == Role.USER)
            throw new ApiException(HttpStatus.BAD_REQUEST, WORKER_USES_GOOGLE);

        String name = clean(r.name());
        // naye user ke fields pehle check karo, taaki OTP waste na ho
        if (existing == null) {
            if (name == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Name is required for a new account");
            if (r.role() == Role.ADMIN)
                throw new ApiException(HttpStatus.FORBIDDEN, "The ADMIN role cannot be chosen at signup");
            if (r.role() != null && r.role() != Role.CONTRACTOR)
                throw new ApiException(HttpStatus.BAD_REQUEST, WORKER_USES_GOOGLE);
        }

        if (!otpService.verify(r.phone(), r.otp()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Incorrect or expired OTP");

        boolean isNew = existing == null;
        User u = isNew
                ? users.save(User.builder().phone(r.phone()).name(name).role(Role.CONTRACTOR).city(clean(r.city())).build())
                : existing;
        return new AuthResponse(jwt.generate(u), u.getId(), u.getRole(), isNew);
    }

    /** Google (email) login. Naya account hamesha WORKER banta hai, phone/OTP nahi maangta. */
    @Transactional
    public GoogleAuthResponse googleLogin(GoogleLoginRequest r) {
        GoogleTokenVerifier.GoogleUser g = google.verify(r.idToken());
        User u = users.findByGoogleSub(g.sub()).orElse(null);
        boolean isNew = u == null;
        if (isNew) {
            String name = clean(r.name());
            if (name == null) name = clean(g.name());
            if (name == null) name = g.email();
            u = users.save(User.builder().role(Role.USER).name(name).city(clean(r.city()))
                    .email(g.email()).googleSub(g.sub()).build());
        }
        return new GoogleAuthResponse(jwt.generate(u), u.getId(), u.getRole(), isNew, false, g.email(), u.getName());
    }

    /** SIRF testing (app.otp.dev-mode=true): bina Google ke worker banao/login karo. */
    @Transactional
    public AuthResponse devWorker(String email, String name) {
        String sub = "dev:" + email.trim().toLowerCase();
        User u = users.findByGoogleSub(sub).orElse(null);
        boolean isNew = u == null;
        if (isNew) {
            String n = clean(name) != null ? clean(name) : email;
            u = users.save(User.builder().role(Role.USER).name(n).email(email.trim()).googleSub(sub).build());
        }
        return new AuthResponse(jwt.generate(u), u.getId(), u.getRole(), isNew);
    }
}
