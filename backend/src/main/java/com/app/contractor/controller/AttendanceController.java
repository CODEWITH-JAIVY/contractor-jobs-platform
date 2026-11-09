package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

/** Worker ka apna private attendance + overtime hisaab. Contractor ko nahi dikhta. */
@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class AttendanceController {
    private final AttendanceService service;

    @GetMapping
    public List<AttendanceResponse> month(@AuthenticationPrincipal Long uid, @RequestParam String month) {
        return service.month(uid, month);
    }

    @GetMapping("/summary")
    public AttendanceSummary summary(@AuthenticationPrincipal Long uid, @RequestParam String month) {
        return service.summary(uid, month);
    }

    @GetMapping("/settings")
    public AttendanceSettings settings(@AuthenticationPrincipal Long uid) { return service.settings(uid); }

    @PutMapping("/settings")
    public AttendanceSettings saveSettings(@AuthenticationPrincipal Long uid, @Valid @RequestBody AttendanceSettings s) {
        return service.saveSettings(uid, s);
    }

    @PutMapping("/{date}")
    public AttendanceResponse upsert(@AuthenticationPrincipal Long uid,
                                     @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                     @Valid @RequestBody AttendanceRequest r) {
        return service.upsert(uid, date, r);
    }

    @DeleteMapping("/{date}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Long uid,
                       @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        service.delete(uid, date);
    }

    @GetMapping("/payments")
    public List<PaymentResponse> payments(@AuthenticationPrincipal Long uid, @RequestParam String month) {
        return service.payments(uid, month);
    }

    @PostMapping("/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse addPayment(@AuthenticationPrincipal Long uid, @Valid @RequestBody PaymentRequest r) {
        return service.addPayment(uid, r);
    }

    @DeleteMapping("/payments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePayment(@AuthenticationPrincipal Long uid, @PathVariable Long id) { service.deletePayment(uid, id); }
}
