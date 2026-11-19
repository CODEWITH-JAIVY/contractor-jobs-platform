package com.app.contractor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Authentication is exclusively handled by the JWT filter, not generated basic-auth users.
@SpringBootApplication(exclude = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
public class ContractorApplication {
    public static void main(String[] args) {
        SpringApplication.run(ContractorApplication.class, args);
    }
}
