package com.studyplanner.backend.user;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class UserDataDtos {

    public record SettingsResponse(
            int focusMinutes,
            int breakMinutes,
            boolean soundEnabled,
            boolean browserNotifyEnabled,
            boolean reminder10Enabled,
            boolean reminder30Enabled
    ) {}

    public record UpdateSettingsRequest(
            @Min(1) @Max(180) Integer focusMinutes,
            @Min(1) @Max(180) Integer breakMinutes,
            Boolean soundEnabled,
            Boolean browserNotifyEnabled,
            Boolean reminder10Enabled,
            Boolean reminder30Enabled
    ) {}

    public record FocusLogRequest(
            @NotNull LocalDate date,
            @Min(0) int minutes
    ) {}

    public record FocusLogResponse(
            LocalDate date,
            int minutes
    ) {}
}
