package com.app.contractor.repository;

import com.app.contractor.entity.Role;
import com.app.contractor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);
    long countByRole(Role role);
    Optional<User> findByGoogleSub(String googleSub);
}
