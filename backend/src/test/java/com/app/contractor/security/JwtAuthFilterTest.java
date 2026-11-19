package com.app.contractor.security;

import com.app.contractor.entity.Role;
import com.app.contractor.entity.User;
import com.app.contractor.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtAuthFilterTest {
    private final JwtService jwt = new JwtService("test-fixture-only-key-not-for-production-123456789", 60000);
    private final UserRepository users = mock(UserRepository.class);
    private final User user = User.builder().id(17L).role(Role.CONTRACTOR).build();

    @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

    private void request(String token) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        new JwtAuthFilter(jwt, users).doFilter(request, new MockHttpServletResponse(), (req, res) -> {});
    }

    @Test void deletedAccountDoesNotAuthenticate() throws Exception {
        when(users.findById(17L)).thenReturn(Optional.empty());
        request(jwt.generate(user));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test void currentDatabaseRoleOverridesOldTokenRole() throws Exception {
        String token = jwt.generate(user);
        user.setRole(Role.USER);
        when(users.findById(17L)).thenReturn(Optional.of(user));
        request(token);
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals("ROLE_USER", auth.getAuthorities().iterator().next().getAuthority());
    }

    @Test void invalidTokenDoesNotQueryDatabase() throws Exception {
        request("invalid-test-token");
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(users);
    }
}
