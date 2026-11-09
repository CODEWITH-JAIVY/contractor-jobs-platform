package com.app.contractor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "log", matchIfMissing = true)
public class LogSmsSender implements SmsSender {
    @Override
    public void sendOtp(String phone, String otp) {
        log.info("[DEV SMS] OTP for {} = {}", phone, otp);
    }
}
