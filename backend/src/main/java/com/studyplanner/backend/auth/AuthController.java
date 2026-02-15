package com.studyplanner.backend.auth;

import com.studyplanner.backend.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthDtos.AuthResponse register(@RequestBody @Valid AuthDtos.RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/register/request-code")
    public AuthDtos.MessageResponse requestCode(@RequestBody @Valid AuthDtos.RequestVerificationCodeRequest request) {
        return authService.requestVerificationCode(request);
    }

    @PostMapping("/register/verify-code")
    public AuthDtos.AuthResponse verifyCode(@RequestBody @Valid AuthDtos.VerifyRegistrationRequest request) {
        return authService.verifyAndRegister(request);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@RequestBody @Valid AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthDtos.UserResponse me(@AuthenticationPrincipal User user) {
        return authService.me(user);
    }
}
