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
    @Value("${app.auth.legacy-otp:true}") boolean legacyOtp;
    @Value("${app.sms.msg91.auth-key:}") String msg91AuthKey;

    @PostConstruct
    void check() {
        if (!"prod".equals(env)) return;
        List<String> bad = new ArrayList<>();
        if (devOtp) bad.add("OTP_DEV_MODE=true (OTP 123456 hamesha chalega!)");
        if (secret.startsWith("change-this")) bad.add("JWT_SECRET default hai");
        // legacy OTP flow ON ho tabhi SMS provider zaroori hai; widget-only me SMS MSG91 widget bhejta hai
        if (legacyOtp && "log".equals(sms)) bad.add("SMS_PROVIDER=log (real SMS nahi jayega)");
        if (!legacyOtp && msg91AuthKey.isBlank()) bad.add("MSG91_AUTH_KEY khali hai (widget login verify nahi hoga)");
        if (!bad.isEmpty()) throw new IllegalStateException("Production config galat: " + bad);
    }
}
