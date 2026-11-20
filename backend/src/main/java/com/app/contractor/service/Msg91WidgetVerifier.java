package com.app.contractor.service;

import com.app.contractor.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;
import java.util.regex.Pattern;

/**
 * MSG91 OTP widget: app se aaya access token server par verify karta hai.
 * Phone number sirf MSG91 ke response se liya jata hai, app ke bheje number par bharosa nahi.
 */
@Slf4j
@Component
public class Msg91WidgetVerifier {

    private static final String VERIFY_URL =
            "https://control.msg91.com/api/v5/widget/verifyAccessToken";
    private static final Pattern DIGITS = Pattern.compile("^\\d{10,15}$");

    private final RestClient client = RestClient.create();
    private final String authKey;

    public Msg91WidgetVerifier(@Value("${app.sms.msg91.auth-key:}") String authKey) {
        this.authKey = authKey;
    }

    /** Verified 10-digit Indian mobile number return karta hai, ya ApiException. */
    public String verifyAndGetPhone(String accessToken) {
        if (accessToken == null || accessToken.isBlank())
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP verification token chahiye");
        if (authKey.isBlank())
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Login abhi available nahi");

        JsonNode res;
        try {
            res = client.post().uri(VERIFY_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(Map.of("authkey", authKey, "access-token", accessToken))
                    .retrieve().body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("MSG91 token verify request failed");   // token/phone log mat karo
            throw new ApiException(HttpStatus.BAD_GATEWAY, "OTP verify nahi ho paya, thodi der baad try karo");
        }

        if (res == null
                || "error".equalsIgnoreCase(res.path("type").asText(""))
                || res.hasNonNull("code")) {
            log.warn("MSG91 token verify rejected");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "OTP verify nahi hua");
        }

        String id = res.path("message").asText("").replaceAll("\\s+", "");
        if (!DIGITS.matcher(id).matches()) {
            log.warn("MSG91 verify response me valid mobile number nahi mila");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "OTP verify nahi hua");
        }
        // 91XXXXXXXXXX -> XXXXXXXXXX (tumhari DB me 10-digit phone hai)
        return (id.length() == 12 && id.startsWith("91")) ? id.substring(2) : id;
    }
}