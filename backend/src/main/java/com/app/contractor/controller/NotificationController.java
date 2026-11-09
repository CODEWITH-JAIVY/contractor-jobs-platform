package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.NotificationResponse;
import com.app.contractor.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;

    @GetMapping
    public Page<NotificationResponse> list(@AuthenticationPrincipal Long uid, Pageable p) { return service.list(uid, p); }

    @GetMapping("/unread-count")
    public Map<String, Long> unread(@AuthenticationPrincipal Long uid) { return Map.of("count", service.unreadCount(uid)); }

    @PutMapping("/{id}/read")
    public void read(@AuthenticationPrincipal Long uid, @PathVariable Long id) { service.markRead(uid, id); }

    @PutMapping("/read-all")
    public Map<String, Integer> readAll(@AuthenticationPrincipal Long uid) { return Map.of("updated", service.markAllRead(uid)); }
}
