package com.app.contractor.service;

public interface SmsSender {
    void sendOtp(String phone, String otp);
}
