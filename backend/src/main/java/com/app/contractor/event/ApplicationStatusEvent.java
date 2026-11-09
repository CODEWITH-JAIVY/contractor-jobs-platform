package com.app.contractor.event;

import com.app.contractor.entity.ApplicationStatus;

public record ApplicationStatusEvent(Long applicantUserId, Long jobId, ApplicationStatus status) {}
