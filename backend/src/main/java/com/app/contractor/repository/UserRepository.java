package com.app.contractor.repository;

import com.app.contractor.entity.Role;
import com.app.contractor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("update User u set u.fcmToken = null where u.fcmToken = :token and u.id <> :uid")
    void clearOtherDeviceOwners(@org.springframework.data.repository.query.Param("token") String token,
                               @org.springframework.data.repository.query.Param("uid") Long uid);
    Optional<User> findByPhone(String phone);
    long countByRole(Role role);
    Optional<User> findByGoogleSub(String googleSub);
}
