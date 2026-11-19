package com.app.contractor.service;

import org.junit.jupiter.api.Test;
import java.util.concurrent.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class OtpServiceTest {
    @Test void onlyOneConcurrentVerificationSucceeds() throws Exception {
        OtpService service = new OtpService(true, (phone, otp) -> {});
        ExecutorService pool = Executors.newFixedThreadPool(16);
        try {
            for (int attempt = 0; attempt < 20; attempt++) {
                service.send("9876543210");
                CountDownLatch start = new CountDownLatch(1);
                List<Future<Boolean>> results = new ArrayList<>();
                for (int i = 0; i < 16; i++) results.add(pool.submit(() -> {
                    start.await(); return service.verify("9876543210", "123456");
                }));
                start.countDown();
                int successes = 0;
                for (Future<Boolean> result : results) if (result.get(5, TimeUnit.SECONDS)) successes++;
                assertEquals(1, successes);
            }
        } finally { pool.shutdownNow(); }
    }
    @Test void fiveIncorrectAttemptsInvalidateOtp() {
        OtpService service = new OtpService(true, (phone, otp) -> {});
        service.send("9876543210");
        for (int i = 0; i < 5; i++) assertFalse(service.verify("9876543210", "000000"));
        assertFalse(service.verify("9876543210", "123456"));
    }
}
