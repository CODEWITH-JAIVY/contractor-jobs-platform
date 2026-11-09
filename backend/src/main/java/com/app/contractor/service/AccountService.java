package com.app.contractor.service;

import com.app.contractor.entity.Role;
import com.app.contractor.entity.User;
import com.app.contractor.exception.ApiException;
import com.app.contractor.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Account + us se jura sara data hamesha ke liye hatata hai (Play Store account-deletion policy). */
@Service
@RequiredArgsConstructor
public class AccountService {
    private final UserRepository users;
    private final UserNotificationRepository notifications;
    private final JobApplicationRepository applications;
    private final FollowRepository follows;
    private final JobRepository jobs;
    private final ContractorProfileRepository profiles;
    private final AttendanceRepository attendance;
    private final PaymentRepository payments;
    private final WorkerProfileRepository workerProfiles;

    @Transactional
    public void deleteAccount(Long uid) {
        User u = users.findById(uid).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User nahi mila"));
        if (u.getRole() == Role.ADMIN)
            throw new ApiException(HttpStatus.FORBIDDEN, "Admin account yaha se delete nahi hota");
        notifications.purgeByUser(uid);
        notifications.purgeByContractorJobs(uid);   // contractor ki jobs ke baaki logo ke notifications
        applications.purgeByUser(uid);
        applications.purgeByContractorJobs(uid);    // contractor ki jobs par aaye applications
        follows.purgeFor(uid);                      // follow karne wale + jinhe follow kiya, dono
        jobs.purgeByContractor(uid);
        attendance.purgeByUser(uid);                // worker ka private hisaab
        payments.purgeByUser(uid);
        workerProfiles.purgeByUser(uid);
        profiles.purgeByUser(uid);
        users.deleteById(uid);
    }
}
