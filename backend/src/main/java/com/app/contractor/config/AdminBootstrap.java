package com.app.contractor.config;

import com.app.contractor.entity.Role;
import com.app.contractor.entity.User;
import com.app.contractor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** ADMIN_PHONES env ke numbers startup par ADMIN ban jate hain (signup se admin nahi ban sakta). */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {
    private final UserRepository users;
    @Value("${app.admin.phones:}") private String phones;

    @Override
    public void run(ApplicationArguments args) {
        for (String raw : phones.split(",")) {
            String ph = raw.trim();
            if (!ph.matches("^[6-9]\\d{9}$")) continue;
            User u = users.findByPhone(ph).orElse(null);
            if (u == null) {
                users.save(User.builder().phone(ph).name("Admin").role(Role.ADMIN).build());
                log.info("Admin bana diya: {}", ph);
            } else if (u.getRole() != Role.ADMIN) {
                u.setRole(Role.ADMIN);
                users.save(u);
                log.info("Existing user ko admin bana diya: {}", ph);
            }
        }
    }
}
