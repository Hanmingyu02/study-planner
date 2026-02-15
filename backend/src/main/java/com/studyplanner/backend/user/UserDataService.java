package com.studyplanner.backend.user;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class UserDataService {

    private final UserSettingsRepository userSettingsRepository;
    private final FocusLogRepository focusLogRepository;

    public UserDataService(UserSettingsRepository userSettingsRepository, FocusLogRepository focusLogRepository) {
        this.userSettingsRepository = userSettingsRepository;
        this.focusLogRepository = focusLogRepository;
    }

    public UserDataDtos.SettingsResponse getSettings(User user) {
        UserSettings settings = getOrCreateSettings(user);
        return toResponse(settings);
    }

    @Transactional
    public UserDataDtos.SettingsResponse updateSettings(User user, UserDataDtos.UpdateSettingsRequest request) {
        UserSettings settings = getOrCreateSettings(user);

        if (request.focusMinutes() != null) settings.setFocusMinutes(request.focusMinutes());
        if (request.breakMinutes() != null) settings.setBreakMinutes(request.breakMinutes());
        if (request.soundEnabled() != null) settings.setSoundEnabled(request.soundEnabled());
        if (request.browserNotifyEnabled() != null) settings.setBrowserNotifyEnabled(request.browserNotifyEnabled());
        if (request.reminder10Enabled() != null) settings.setReminder10Enabled(request.reminder10Enabled());
        if (request.reminder30Enabled() != null) settings.setReminder30Enabled(request.reminder30Enabled());

        return toResponse(userSettingsRepository.save(settings));
    }

    public UserDataDtos.FocusLogResponse getFocusByDate(User user, LocalDate date) {
        FocusLog log = focusLogRepository.findByUserAndDate(user, date).orElse(null);
        return new UserDataDtos.FocusLogResponse(date, log == null ? 0 : log.getMinutes());
    }

    @Transactional
    public UserDataDtos.FocusLogResponse upsertFocus(User user, UserDataDtos.FocusLogRequest request) {
        FocusLog log = focusLogRepository.findByUserAndDate(user, request.date()).orElseGet(FocusLog::new);
        log.setUser(user);
        log.setDate(request.date());
        log.setMinutes(request.minutes());
        log = focusLogRepository.save(log);
        return new UserDataDtos.FocusLogResponse(log.getDate(), log.getMinutes());
    }

    private UserSettings getOrCreateSettings(User user) {
        return userSettingsRepository.findByUser(user).orElseGet(() -> {
            UserSettings settings = new UserSettings();
            settings.setUser(user);
            return userSettingsRepository.save(settings);
        });
    }

    private UserDataDtos.SettingsResponse toResponse(UserSettings settings) {
        return new UserDataDtos.SettingsResponse(
                settings.getFocusMinutes(),
                settings.getBreakMinutes(),
                settings.isSoundEnabled(),
                settings.isBrowserNotifyEnabled(),
                settings.isReminder10Enabled(),
                settings.isReminder30Enabled()
        );
    }
}
