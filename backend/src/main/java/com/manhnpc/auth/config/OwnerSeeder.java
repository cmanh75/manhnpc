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

    @Bean
    CommandLineRunner seedUsers(
            UserRepository users,
            PasswordEncoder encoder,
            @Value("${owner.seed.username:manhnpc}") String username,
            @Value("${owner.seed.password}") String password,
            @Value("${owner.seed.display-name:Nguyen Phi Cuong Manh}") String displayName) {
        return args -> {
            if (users.count() == 0) {
                User owner = User.builder()
                        .username(username)
                        .password(encoder.encode(password))
                        .displayName(displayName)
                        .avatarUrl("https://picsum.photos/seed/manhnpc-avatar/400/400")
                        .build();
                users.save(owner);
            }
        };
    }
}
