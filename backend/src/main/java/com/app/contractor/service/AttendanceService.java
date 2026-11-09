package com.app.contractor.service;

import com.app.contractor.dto.Dtos.*;
import com.app.contractor.entity.AttendanceEntry;
import com.app.contractor.entity.AttendanceStatus;
import com.app.contractor.entity.PaymentEntry;
import com.app.contractor.entity.User;
import com.app.contractor.exception.ApiException;
import com.app.contractor.repository.AttendanceRepository;
import com.app.contractor.repository.PaymentRepository;
import com.app.contractor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {
    private static final BigDecimal HALF = new BigDecimal("0.5");

    private final AttendanceRepository repo;
    private final PaymentRepository payRepo;
    private final UserRepository users;

    private static YearMonth parse(String month) {
        try {
            return YearMonth.parse(month);
        } catch (DateTimeParseException | NullPointerException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "month ko YYYY-MM format me bhejo (jaise 2026-11)");
        }
    }

    private User user(Long uid) {
        return users.findById(uid).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User nahi mila"));
    }

    private static void notTooFarAhead(LocalDate d) {
        if (d.isAfter(LocalDate.now().plusDays(1)))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Aage ki date nahi bhar sakte");
    }

    // ---------- attendance ----------

    @Transactional(readOnly = true)
    public List<AttendanceResponse> month(Long uid, String month) {
        YearMonth ym = parse(month);
        return repo.findByUserIdAndWorkDateBetweenOrderByWorkDateAsc(uid, ym.atDay(1), ym.atEndOfMonth())
                .stream().map(AttendanceResponse::from).toList();
    }

    @Transactional
    public AttendanceResponse upsert(Long uid, LocalDate date, AttendanceRequest r) {
        notTooFarAhead(date);
        BigDecimal ot = r.overtimeHours() == null ? BigDecimal.ZERO : r.overtimeHours();
        if (ot.remainder(HALF).signum() != 0)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Overtime 0.5 ghante ke step me daalo (jaise 1, 1.5, 2)");
        if (r.status() == AttendanceStatus.ABSENT && ot.signum() > 0)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Absent din me overtime nahi ho sakta");

        User u = user(uid);
        AttendanceEntry e = repo.findByUserIdAndWorkDate(uid, date)
                .orElseGet(() -> AttendanceEntry.builder().user(u).workDate(date).build());
        e.setStatus(r.status());
        e.setOvertimeHours(ot.setScale(1));
        e.setNote(r.note() == null || r.note().isBlank() ? null : r.note().trim());
        if (e.getDailyWage() == null) e.setDailyWage(u.getDailyWage());
        if (e.getOvertimeRate() == null) e.setOvertimeRate(u.getOvertimeRate());
        return AttendanceResponse.from(repo.save(e));
    }

    @Transactional
    public void delete(Long uid, LocalDate date) { repo.deleteByUserIdAndWorkDate(uid, date); }

    @Transactional(readOnly = true)
    public AttendanceSettings settings(Long uid) {
        User u = user(uid);
        return new AttendanceSettings(u.getDailyWage(), u.getOvertimeRate());
    }

    @Transactional
    public AttendanceSettings saveSettings(Long uid, AttendanceSettings s) {
        User u = user(uid);
        u.setDailyWage(s.dailyWage());
        u.setOvertimeRate(s.overtimeRate());
        return s;
    }

    // ---------- summary (mahina + poora baaki) ----------

    private record Calc(int present, int half, int absent, BigDecimal worked, BigDecimal ot, long daysAmt, long otAmt) {}

    private Calc calc(List<AttendanceEntry> list, User u) {
        int present = 0, half = 0, absent = 0;
        BigDecimal worked = BigDecimal.ZERO, ot = BigDecimal.ZERO, daysAmt = BigDecimal.ZERO, otAmt = BigDecimal.ZERO;
        for (AttendanceEntry e : list) {
            BigDecimal factor = BigDecimal.ZERO;
            switch (e.getStatus()) {
                case PRESENT -> { present++; factor = BigDecimal.ONE; }
                case HALF_DAY -> { half++; factor = HALF; }
                case ABSENT -> absent++;
            }
            // entry ka apna rate; na ho to abhi ka rate
            int wage = e.getDailyWage() != null ? e.getDailyWage() : (u.getDailyWage() != null ? u.getDailyWage() : 0);
            int rate = e.getOvertimeRate() != null ? e.getOvertimeRate() : (u.getOvertimeRate() != null ? u.getOvertimeRate() : 0);
            worked = worked.add(factor);
            ot = ot.add(e.getOvertimeHours());
            daysAmt = daysAmt.add(BigDecimal.valueOf(wage).multiply(factor));
            otAmt = otAmt.add(BigDecimal.valueOf(rate).multiply(e.getOvertimeHours()));
        }
        return new Calc(present, half, absent, worked, ot,
                daysAmt.setScale(0, RoundingMode.HALF_UP).longValue(), otAmt.setScale(0, RoundingMode.HALF_UP).longValue());
    }

    /** balance = (poori kamai) - (poora mila). Negative = advance zyada liya. */
    @Transactional(readOnly = true)
    public AttendanceSummary summary(Long uid, String month) {
        YearMonth ym = parse(month);
        User u = user(uid);
        Calc m = calc(repo.findByUserIdAndWorkDateBetweenOrderByWorkDateAsc(uid, ym.atDay(1), ym.atEndOfMonth()), u);
        long received = payRepo.findByUserIdAndPayDateBetweenOrderByPayDateDesc(uid, ym.atDay(1), ym.atEndOfMonth())
                .stream().mapToLong(p -> p.getAmount()).sum();
        Calc all = calc(repo.findByUserId(uid), u);
        long balance = all.daysAmt() + all.otAmt() - payRepo.sumAll(uid);
        return new AttendanceSummary(ym.toString(), m.present(), m.half(), m.absent(), m.worked(), m.ot(),
                m.daysAmt(), m.otAmt(), m.daysAmt() + m.otAmt(), received, balance);
    }

    // ---------- paisa mila / advance ----------

    @Transactional(readOnly = true)
    public List<PaymentResponse> payments(Long uid, String month) {
        YearMonth ym = parse(month);
        return payRepo.findByUserIdAndPayDateBetweenOrderByPayDateDesc(uid, ym.atDay(1), ym.atEndOfMonth())
                .stream().map(PaymentResponse::from).toList();
    }

    @Transactional
    public PaymentResponse addPayment(Long uid, PaymentRequest r) {
        notTooFarAhead(r.date());
        PaymentEntry p = PaymentEntry.builder().user(user(uid)).payDate(r.date()).amount(r.amount())
                .note(r.note() == null || r.note().isBlank() ? null : r.note().trim()).build();
        return PaymentResponse.from(payRepo.save(p));
    }

    @Transactional
    public void deletePayment(Long uid, Long id) {
        if (payRepo.deleteByIdAndUserId(id, uid) == 0)
            throw new ApiException(HttpStatus.NOT_FOUND, "Entry nahi mili");
    }
}
