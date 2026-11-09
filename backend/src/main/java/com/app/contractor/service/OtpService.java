package com.app.contractor.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {
    private static final int MAX_ATTEMPTS = 5;

    private static class Entry {
        final String otp;
        final Instant expires;
        int attempts;
        Entry(String otp, Instant expires) { this.otp = otp; this.expires = expires; }
    }

    private final Map<String, Entry> store = new ConcurrentHashMap<>();
    private final SecureRandom rnd = new SecureRandom();
    private final boolean devMode;
    private final SmsSender sms;

    public OtpService(@Value("${app.otp.dev-mode}") boolean devMode, SmsSender sms) {
        this.devMode = devMode;
        this.sms = sms;
    }

    public void send(String phone) {
        String otp = devMode ? "123456" : String.format("%06d", rnd.nextInt(1_000_000));
        store.put(phone, new Entry(otp, Instant.now().plusSeconds(300)));
        try {
            sms.sendOtp(phone, otp);
        } catch (RuntimeException e) {
            store.remove(phone);
            throw e;
        }
    }

    /** Sahi OTP ek hi baar chalta hai. 5 galat try ke baad OTP khatam. */
    public boolean verify(String phone, String otp) {
        Entry e = store.get(phone);
        if (e == null) return false;
        synchronized (e) {
            if (Instant.now().isAfter(e.expires) || e.attempts >= MAX_ATTEMPTS) {
                store.remove(phone);
                return false;
            }
            if (!e.otp.equals(otp)) {
                e.attempts++;
                return false;
            }
            store.remove(phone);
            return true;
        }
    }
}
