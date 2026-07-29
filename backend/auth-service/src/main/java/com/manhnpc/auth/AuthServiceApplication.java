package com.manhnpc.auth;

import com.manhnpc.auth.model.User;
import com.manhnpc.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }

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
