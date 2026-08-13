package com.manhnpc.auth.web;

import com.manhnpc.auth.model.User;
import com.manhnpc.auth.repository.UserRepository;
import com.manhnpc.auth.web.dto.AuthDtos.ChangePasswordRequest;
import com.manhnpc.auth.web.dto.AuthDtos.LoginRequest;
import com.manhnpc.auth.web.dto.AuthDtos.LoginResponse;
import com.manhnpc.auth.web.dto.AuthDtos.UserDto;
import com.manhnpc.common.security.JwtService;
import com.manhnpc.common.web.error.BadRequestException;
import com.manhnpc.common.web.error.NotFoundException;
import com.manhnpc.common.web.error.UnauthorizedException;
import java.security.Principal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        User user = users.findByUsername(request.username() == null ? "" : request.username())
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));
        if (request.password() == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Invalid username or password");
        }
        return new LoginResponse(jwtService.generateToken(user), UserDto.from(user));
    }

    @GetMapping("/me")
    public UserDto me(Principal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Authentication required");
        }
        User user = users.findByUsername(principal.getName())
                .orElseThrow(() -> new NotFoundException("User not found: " + principal.getName()));
        return UserDto.from(user);
    }

    @PutMapping("/password")
    public UserDto changePassword(Principal principal, @RequestBody ChangePasswordRequest request) {
        if (principal == null) {
            throw new UnauthorizedException("Authentication required");
        }
        User user = users.findByUsername(principal.getName())
                .orElseThrow(() -> new NotFoundException("User not found: " + principal.getName()));
        if (request.currentPassword() == null || !passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        if (request.newPassword() == null || request.newPassword().length() < 8) {
            throw new BadRequestException("New password must be at least 8 characters");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        users.save(user);
        return UserDto.from(user);
    }
}
