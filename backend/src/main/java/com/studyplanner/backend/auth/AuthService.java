package com.studyplanner.backend.auth;

import com.studyplanner.backend.common.BadRequestException;
import com.studyplanner.backend.user.User;
import com.studyplanner.backend.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JavaMailSender mailSender;
    private final String mailFrom;
    private final long verificationExpirationMinutes;
    private final SecureRandom random = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            EmailVerificationRepository emailVerificationRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String mailFrom,
            @Value("${app.mail.verification-expiration-minutes}") long verificationExpirationMinutes
    ) {
        this.userRepository = userRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.verificationExpirationMinutes = verificationExpirationMinutes;
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        final String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("이미 가입된 이메일입니다.");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user = userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthDtos.MessageResponse requestVerificationCode(AuthDtos.RequestVerificationCodeRequest request) {
        final String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("이미 가입된 이메일입니다.");
        }

        String code = generateVerificationCode();
        String codeHash = passwordEncoder.encode(code);
        String passwordHash = passwordEncoder.encode(request.password());

        EmailVerification verification = emailVerificationRepository.findByEmail(normalizedEmail).orElseGet(EmailVerification::new);
        verification.setEmail(normalizedEmail);
        verification.setName(request.name().trim());
        verification.setPasswordHash(passwordHash);
        verification.setCodeHash(codeHash);
        verification.setExpiresAt(Instant.now().plusSeconds(verificationExpirationMinutes * 60));
        emailVerificationRepository.save(verification);

        sendVerificationMail(normalizedEmail, code);

        return new AuthDtos.MessageResponse("인증번호를 이메일로 발송했습니다.");
    }

    public AuthDtos.AuthResponse verifyAndRegister(AuthDtos.VerifyRegistrationRequest request) {
        final String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("이미 가입된 이메일입니다.");
        }

        EmailVerification verification = emailVerificationRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("인증 요청 정보가 없습니다. 인증번호를 다시 요청해주세요."));

        if (verification.getExpiresAt().isBefore(Instant.now())) {
            emailVerificationRepository.delete(verification);
            throw new BadRequestException("인증번호가 만료되었습니다. 다시 요청해주세요.");
        }

        if (!passwordEncoder.matches(request.code(), verification.getCodeHash())) {
            throw new BadRequestException("인증번호가 올바르지 않습니다.");
        }

        User user = new User();
        user.setName(verification.getName());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(verification.getPasswordHash());
        user = userRepository.save(user);

        emailVerificationRepository.delete(verification);

        return buildAuthResponse(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        final String normalizedEmail = request.email().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("로그인 정보가 일치하지 않습니다."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadRequestException("로그인 정보가 일치하지 않습니다.");
        }

        return buildAuthResponse(user);
    }

    public AuthDtos.UserResponse me(User user) {
        return new AuthDtos.UserResponse(user.getId(), user.getName(), user.getEmail());
    }

    private AuthDtos.AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthDtos.AuthResponse(token, me(user));
    }

    private String generateVerificationCode() {
        int value = 100000 + random.nextInt(900000);
        return String.valueOf(value);
    }

    private void sendVerificationMail(String to, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(to);
            message.setSubject("[Study Planner] 이메일 인증번호");
            message.setText("인증번호: " + code + "\\n" +
                    "유효시간: " + verificationExpirationMinutes + "분\\n" +
                    "본인이 요청하지 않았다면 이 메일을 무시하세요.");
            mailSender.send(message);
        } catch (MailException ex) {
            throw new BadRequestException("인증 메일 발송에 실패했습니다. 메일 설정을 확인해주세요.");
        }
    }
}
