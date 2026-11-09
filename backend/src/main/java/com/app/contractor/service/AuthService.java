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

@Service
@RequiredArgsConstructor
public class AuthService {
    private final OtpService otpService;
    private final UserRepository users;
    private final JwtService jwt;
    private final GoogleTokenVerifier google;

    public void sendOtp(String phone) { otpService.send(phone); }

    @Transactional
    public AuthResponse verify(VerifyOtpRequest r) {
        User existing = users.findByPhone(r.phone()).orElse(null);

        // naye user ke fields pehle check karo, taaki OTP waste na ho
        if (existing == null) {
            if (r.name() == null || r.name().isBlank() || r.role() == null)
                throw new ApiException(HttpStatus.BAD_REQUEST, "Naye user ke liye name aur role zaroori hai");
            if (r.role() == Role.ADMIN)
                throw new ApiException(HttpStatus.FORBIDDEN, "ADMIN role signup se nahi milta");
        }

        if (!otpService.verify(r.phone(), r.otp()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "OTP galat hai ya expire ho gaya");

        boolean isNew = existing == null;
        User u = isNew
                ? users.save(User.builder().phone(r.phone()).name(r.name()).role(r.role()).city(r.city()).build())
                : existing;
        return new AuthResponse(jwt.generate(u), u.getId(), u.getRole(), isNew);
    }

    /**
     * 1) Known Google account  -> seedha login.
     * 2) Naya Google account   -> needsPhone=true; app phone+OTP bhej kar dobara call karti hai.
     *    - phone par pehle se account ho to Google us se juda jata hai (OTP se ownership proof).
     *    - warna naya account banta hai.
     */
    @Transactional
    public GoogleAuthResponse googleLogin(GoogleLoginRequest r) {
        GoogleTokenVerifier.GoogleUser g = google.verify(r.idToken());

        User byGoogle = users.findByGoogleSub(g.sub()).orElse(null);
        if (byGoogle != null)
            return new GoogleAuthResponse(jwt.generate(byGoogle), byGoogle.getId(), byGoogle.getRole(), false, false, g.email(), g.name());

        if (r.phone() == null || r.phone().isBlank() || r.otp() == null || r.otp().isBlank())
            return new GoogleAuthResponse(null, null, null, false, true, g.email(), g.name());

        if (!r.phone().matches("^[6-9]\\d{9}$"))
            throw new ApiException(HttpStatus.BAD_REQUEST, "10 digit Indian mobile number daalo");

        User existing = users.findByPhone(r.phone()).orElse(null);
        if (existing != null && existing.getGoogleSub() != null)
            throw new ApiException(HttpStatus.CONFLICT, "Is number par pehle se dusra Google account juda hai");

        String name = (r.name() != null && !r.name().isBlank()) ? r.name().trim() : g.name();
        if (existing == null) {
            if (name == null || name.isBlank() || r.role() == null)
                throw new ApiException(HttpStatus.BAD_REQUEST, "Naye account ke liye name aur role zaroori hai");
            if (r.role() == Role.ADMIN)
                throw new ApiException(HttpStatus.FORBIDDEN, "ADMIN role signup se nahi milta");
        }

        if (!otpService.verify(r.phone(), r.otp()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "OTP galat hai ya expire ho gaya");

        boolean isNew = existing == null;
        User u;
        if (isNew) {
            u = users.save(User.builder().phone(r.phone()).name(name).role(r.role()).city(r.city())
                    .googleSub(g.sub()).email(g.email()).build());
        } else {
            existing.setGoogleSub(g.sub());
            existing.setEmail(g.email());
            u = existing;
        }
        return new GoogleAuthResponse(jwt.generate(u), u.getId(), u.getRole(), isNew, false, g.email(), u.getName());
    }
}
