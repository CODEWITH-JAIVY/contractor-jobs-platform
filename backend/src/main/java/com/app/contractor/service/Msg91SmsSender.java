package com.app.contractor.service;

import com.app.contractor.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;
import java.net.URI;

/**
 * MSG91 OTP API v5: POST https://control.msg91.com/api/v5/otp?template_id=..&mobile=91XXXXXXXXXX&otp=..
 * India me SMS ke liye DLT registration + approved template zaroori hai (MSG91 dashboard me hota hai).
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "msg91")
public class Msg91SmsSender implements SmsSender {
    private final RestClient client = RestClient.create();
    private final String authKey, templateId;

    public Msg91SmsSender(@Value("${app.sms.msg91.auth-key}") String authKey,
                          @Value("${app.sms.msg91.template-id}") String templateId) {
        if (authKey.isBlank() || templateId.isBlank())
            throw new IllegalStateException("MSG91_AUTH_KEY aur MSG91_TEMPLATE_ID set karo");
        this.authKey = authKey;
        this.templateId = templateId;
    }

    @Override
    public void sendOtp(String phone, String otp) {
        URI uri = UriComponentsBuilder.fromUriString("https://control.msg91.com/api/v5/otp")
                .queryParam("template_id", templateId)
                .queryParam("mobile", "91" + phone)
                .queryParam("otp", otp)
                .build().toUri();
        try {
            String res = client.post().uri(uri)
                    .header("authkey", authKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{}")
                    .retrieve().body(String.class);
            if (res == null || !res.toLowerCase().contains("success")) {
                log.error("MSG91 error response: {}", res);
                throw new ApiException(HttpStatus.BAD_GATEWAY, "SMS bhejne me problem, thodi der baad try karo");
            }
        } catch (RestClientException e) {
            log.error("MSG91 call fail: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "SMS bhejne me problem, thodi der baad try karo");
        }
    }
}
