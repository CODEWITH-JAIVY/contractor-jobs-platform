package com.app.contractor.event;

/** Module 3 (notifications) isko sunega aur followers ko FCM push bhejega. */
public record JobCreatedEvent(Long jobId, Long contractorId) {}
