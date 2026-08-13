package com.manhnpc.auth.config;

import com.manhnpc.auth.model.User;
import com.manhnpc.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class OwnerSeeder {

    private static final String DISPLAY_NAME = "Nguyen Phi Cuong Manh";

    @Bean
    CommandLineRunner seedUsers(
            UserRepository users,
            PasswordEncoder encoder,
            @Value("${owner.seed.username:manhnpc}") String username,
            @Value("${owner.seed.password}") String password) {
        return args -> {
            if (users.count() == 0) {
                User owner = User.builder()
                        .username(username)
                        .password(encoder.encode(password))
                        .displayName(DISPLAY_NAME)
                        .build();
                users.save(owner);
            }
        };
    }
}
