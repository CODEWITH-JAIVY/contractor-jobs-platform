package com.app.contractor.dto;

import com.app.contractor.entity.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class Dtos {
    private Dtos() {}

    public record SendOtpRequest(@NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "10 digit Indian mobile number daalo") String phone) {}

    public record VerifyOtpRequest(
            @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$") String phone,
            @NotBlank @Size(min = 6, max = 6) String otp,
            String name, Role role, String city) {}

    public record AuthResponse(String token, Long userId, Role role, boolean newUser) {}

    public record FcmTokenRequest(@NotBlank String token) {}

    public record UserResponse(Long id, String name, String phone, Role role, String city) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getName(), u.getPhone(), u.getRole(), u.getCity());
        }
    }

    public record ContractorProfileRequest(
            @NotBlank String companyName, String workType,
            @Min(0) @Max(60) Integer experienceYears, @Size(max = 1000) String about) {}

    public record ContractorResponse(Long userId, String name, String city, String companyName, String workType,
                                     Integer experienceYears, String about, boolean verified, long followers) {}

    public record JobRequest(
            @NotBlank String title, @Size(max = 2000) String description,
            @NotBlank String location, @Min(0) Integer salary, @Min(1) Integer workersNeeded) {}

    public record JobResponse(Long id, Long contractorId, String contractorName, String title, String description,
                              String location, Integer salary, Integer workersNeeded, JobStatus status, Instant createdAt) {
        public static JobResponse from(Job j) {
            return new JobResponse(j.getId(), j.getContractor().getId(), j.getContractor().getName(), j.getTitle(),
                    j.getDescription(), j.getLocation(), j.getSalary(), j.getWorkersNeeded(), j.getStatus(), j.getCreatedAt());
        }
    }

    public record StatusRequest(@NotNull ApplicationStatus status) {}

    public record ApplicationResponse(Long id, Long jobId, String jobTitle, String location, ApplicationStatus status, Instant createdAt) {
        public static ApplicationResponse from(JobApplication a) {
            return new ApplicationResponse(a.getId(), a.getJob().getId(), a.getJob().getTitle(),
                    a.getJob().getLocation(), a.getStatus(), a.getCreatedAt());
        }
    }

    public record ApplicantResponse(Long applicationId, Long userId, String name, String phone, String city,
                                    ApplicationStatus status, Instant appliedAt,
                                    String skills, Integer experienceYears, String about) {
        public static ApplicantResponse from(JobApplication a, WorkerProfile p) {
            User u = a.getUser();
            return new ApplicantResponse(a.getId(), u.getId(), u.getName(), u.getPhone(), u.getCity(), a.getStatus(), a.getCreatedAt(),
                    p == null ? null : p.getSkills(), p == null ? null : p.getExperienceYears(), p == null ? null : p.getAbout());
        }
    }

    public record NotificationResponse(Long id, Long jobId, String title, String body, boolean read, Instant createdAt) {
        public static NotificationResponse from(UserNotification n) {
            return new NotificationResponse(n.getId(), n.getJob() == null ? null : n.getJob().getId(),
                    n.getTitle(), n.getBody(), n.isSeen(), n.getCreatedAt());
        }
    }

    public record AdminContractor(Long userId, String name, String phone, String city, String companyName,
                                  String workType, Integer experienceYears, boolean verified) {
        public static AdminContractor from(ContractorProfile p) {
            User u = p.getUser();
            return new AdminContractor(u.getId(), u.getName(), u.getPhone(), u.getCity(), p.getCompanyName(),
                    p.getWorkType(), p.getExperienceYears(), p.isVerified());
        }
    }

    public record GoogleLoginRequest(@NotBlank String idToken, String phone, String otp, String name, Role role, String city) {}

    /** needsPhone=true => token null; app ko mobile number + OTP + role le kar dobara bulana hai. */
    public record GoogleAuthResponse(String token, Long userId, Role role, boolean newUser, boolean needsPhone,
                                     String email, String name) {}

    public record AttendanceRequest(@NotNull AttendanceStatus status,
                                    @DecimalMin("0") @DecimalMax("16") BigDecimal overtimeHours,
                                    @Size(max = 200) String note) {}

    public record AttendanceResponse(LocalDate date, AttendanceStatus status, BigDecimal overtimeHours, String note,
                                     Integer dailyWage, Integer overtimeRate) {
        public static AttendanceResponse from(AttendanceEntry e) {
            return new AttendanceResponse(e.getWorkDate(), e.getStatus(), e.getOvertimeHours(), e.getNote(),
                    e.getDailyWage(), e.getOvertimeRate());
        }
    }

    public record AttendanceSettings(@Min(0) @Max(100000) Integer dailyWage, @Min(0) @Max(10000) Integer overtimeRate) {}

    public record AttendanceSummary(String month, int presentDays, int halfDays, int absentDays, BigDecimal workedDays,
                                    BigDecimal overtimeHours, long daysAmount, long overtimeAmount, long totalAmount,
                                    long receivedThisMonth, long balance) {}

    public record PaymentRequest(@NotNull LocalDate date, @NotNull @Min(1) @Max(1000000) Integer amount, @Size(max = 200) String note) {}

    public record PaymentResponse(Long id, LocalDate date, Integer amount, String note) {
        public static PaymentResponse from(PaymentEntry p) {
            return new PaymentResponse(p.getId(), p.getPayDate(), p.getAmount(), p.getNote());
        }
    }

    public record WorkerProfileRequest(@Size(max = 200) String skills, @Min(0) @Max(60) Integer experienceYears,
                                       @Size(max = 1000) String about) {}

    public record WorkerProfileResponse(String skills, Integer experienceYears, String about) {
        public static WorkerProfileResponse from(WorkerProfile p) {
            return new WorkerProfileResponse(p.getSkills(), p.getExperienceYears(), p.getAbout());
        }
    }
}
