package com.studyplanner.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 50) String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 100) String password
    ) {}

    public record RequestVerificationCodeRequest(
            @NotBlank @Size(min = 2, max = 50) String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 100) String password
    ) {}

    public record VerifyRegistrationRequest(
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "인증번호는 6자리 숫자여야 합니다.") String code
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String token,
            UserResponse user
    ) {}

    public record MessageResponse(String message) {}

    public record UserResponse(
            UUID id,
            String name,
            String email
    ) {}
}
