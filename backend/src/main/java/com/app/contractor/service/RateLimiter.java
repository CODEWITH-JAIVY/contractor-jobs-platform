package com.app.contractor.service;

import com.app.contractor.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Sliding-window limiter (single server). Multiple servers par Redis version chahiye hoga. */
@Component
public class RateLimiter {
    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    public void check(String key, int max, long windowSeconds, String message) {
        long now = System.currentTimeMillis();
        long from = now - windowSeconds * 1000;
        Deque<Long> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && q.peekFirst() < from) q.pollFirst();
            if (q.size() >= max) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, message);
            q.addLast(now);
        }
    }

    @Scheduled(fixedDelay = 600_000)
    void cleanup() {
        long cut = System.currentTimeMillis() - 86_400_000L;
        hits.values().removeIf(q -> {
            synchronized (q) { return q.isEmpty() || q.peekLast() < cut; }
        });
    }
}
