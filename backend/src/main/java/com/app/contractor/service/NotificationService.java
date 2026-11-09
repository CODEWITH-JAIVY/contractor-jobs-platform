package com.app.contractor.service;

import com.app.contractor.dto.Dtos.NotificationResponse;
import com.app.contractor.entity.*;
import com.app.contractor.event.ApplicationStatusEvent;
import com.app.contractor.event.JobCreatedEvent;
import com.app.contractor.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {
    private static final int CHUNK = 500; // FCM multicast limit

    private final FollowRepository follows;
    private final JobRepository jobs;
    private final UserRepository users;
    private final ContractorProfileRepository profiles;
    private final UserNotificationRepository notifications;
    private final PushSender push;

    // ---------- listeners (job commit hone ke BAAD, alag thread me) ----------

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onJobCreated(JobCreatedEvent e) {
        Job job = jobs.findById(e.jobId()).orElse(null);
        if (job == null) return;
        String company = profiles.findByUserId(e.contractorId())
                .map(ContractorProfile::getCompanyName).orElse(job.getContractor().getName());
        String title = company + " ne naya job daala";
        String body = job.getTitle() + " - " + job.getLocation();

        int page = 0;
        Slice<Follow> slice;
        do {
            slice = follows.findFollowersPage(e.contractorId(), PageRequest.of(page++, CHUNK));
            List<User> followers = slice.getContent().stream().map(Follow::getUser).toList();
            deliver(followers, job, title, body, "NEW_JOB");
        } while (slice.hasNext());
        log.info("Job {} ke notifications bhej diye ({} pages)", job.getId(), page);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onApplicationStatus(ApplicationStatusEvent e) {
        User u = users.findById(e.applicantUserId()).orElse(null);
        Job job = jobs.findById(e.jobId()).orElse(null);
        if (u == null || job == null) return;
        boolean accepted = e.status() == ApplicationStatus.ACCEPTED;
        String title = accepted ? "Aap select ho gaye" : "Application update";
        String body = accepted
                ? job.getTitle() + " ke liye aap select hue. Contractor se baat karein."
                : job.getTitle() + " ke liye is baar select nahi hue.";
        deliver(List.of(u), job, title, body, "APPLICATION_STATUS");
    }

    private void deliver(List<User> targets, Job job, String title, String body, String type) {
        if (targets.isEmpty()) return;
        notifications.saveAll(targets.stream()
                .map(u -> UserNotification.builder().user(u).job(job).title(title).body(body).build())
                .toList());

        List<User> withToken = targets.stream()
                .filter(u -> u.getFcmToken() != null && !u.getFcmToken().isBlank()).toList();
        if (withToken.isEmpty()) return;

        Set<Integer> invalid = push.send(
                withToken.stream().map(User::getFcmToken).toList(), title, body,
                Map.of("type", type, "jobId", String.valueOf(job.getId())));
        invalid.forEach(i -> withToken.get(i).setFcmToken(null)); // dead token saaf
    }

    // ---------- API ke liye ----------

    @Transactional(readOnly = true)
    public Page<NotificationResponse> list(Long userId, Pageable p) {
        return notifications.findByUserIdOrderByCreatedAtDesc(userId, p).map(NotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) { return notifications.countByUserIdAndSeenFalse(userId); }

    @Transactional
    public void markRead(Long userId, Long id) { notifications.markRead(id, userId); }

    @Transactional
    public int markAllRead(Long userId) { return notifications.markAllRead(userId); }
}
