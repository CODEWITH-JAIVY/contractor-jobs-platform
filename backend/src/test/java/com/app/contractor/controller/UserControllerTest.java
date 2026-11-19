package com.app.contractor.controller;

import com.app.contractor.dto.Dtos.FcmTokenRequest;
import com.app.contractor.entity.User;
import com.app.contractor.repository.UserRepository;
import com.app.contractor.service.AccountService;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserControllerTest {
    @Test void registeringDeviceClearsPreviousOwner() {
        UserRepository users = mock(UserRepository.class);
        User user = User.builder().build();
        when(users.findById(7L)).thenReturn(Optional.of(user));
        UserController controller = new UserController(users, mock(AccountService.class));
        controller.fcm(7L, new FcmTokenRequest("test-device"));
        verify(users).clearOtherDeviceOwners("test-device", 7L);
        assertEquals("test-device", user.getFcmToken());
    }
    @Test void logoutClearsStoredTokenAndDeletedAccountIsHarmless() {
        UserRepository users = mock(UserRepository.class);
        User user = User.builder().fcmToken("test-device").build();
        when(users.findById(7L)).thenReturn(Optional.of(user));
        UserController controller = new UserController(users, mock(AccountService.class));
        controller.clearFcm(7L);
        assertNull(user.getFcmToken());
        when(users.findById(7L)).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> controller.clearFcm(7L));
    }
}
