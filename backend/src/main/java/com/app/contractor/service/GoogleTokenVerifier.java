package com.app.contractor.service;

import com.app.contractor.exception.ApiException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

/** Google ID token ka signature, issuer, expiry aur audience (hamari client id) check karta hai. */
@Slf4j
@Component
public class GoogleTokenVerifier {
    public record GoogleUser(String sub, String email, String name) {}

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.verifier = clientId.isBlank() ? null
                : new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                        .setAudience(List.of(clientId)).build();
        if (verifier == null) log.warn("GOOGLE_CLIENT_ID set nahi hai: Google login band rahega");
    }

    public GoogleUser verify(String idToken) {
        if (verifier == null) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google login abhi chalu nahi hai");
        try {
            GoogleIdToken t = verifier.verify(idToken);
            if (t == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Google login galat ya expire ho gaya, dobara try karo");
            GoogleIdToken.Payload p = t.getPayload();
            if (!Boolean.TRUE.equals(p.getEmailVerified()))
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Is Google account ka email verified nahi hai");
            return new GoogleUser(p.getSubject(), p.getEmail(), (String) p.get("name"));
        } catch (GeneralSecurityException | IOException e) {
            log.error("Google token verify error: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Google se verify nahi ho paya, thodi der baad try karo");
        }
    }
}
