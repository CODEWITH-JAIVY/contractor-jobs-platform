package com.app.contractor.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;

/** APP_ENV=prod hone par unsafe dev settings ke saath app start nahi hoga. */
@Component
public class StartupChecks {
    @Value("${app.env}") String env;
    @Value("${app.otp.dev-mode}") boolean devOtp;
    @Value("${app.jwt.secret}") String secret;
    @Value("${app.sms.provider}") String sms;

    @PostConstruct
    void check() {
        if (!"prod".equals(env)) return;
        List<String> bad = new ArrayList<>();
        if (devOtp) bad.add("OTP_DEV_MODE=true (OTP 123456 hamesha chalega!)");
        if (secret.startsWith("change-this")) bad.add("JWT_SECRET default hai");
        if ("log".equals(sms)) bad.add("SMS_PROVIDER=log (real SMS nahi jayega)");
        if (!bad.isEmpty()) throw new IllegalStateException("Production config galat: " + bad);
    }
}
