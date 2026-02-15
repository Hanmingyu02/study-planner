package com.studyplanner.backend.user;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/user")
public class UserDataController {

    private final UserDataService userDataService;

    public UserDataController(UserDataService userDataService) {
        this.userDataService = userDataService;
    }

    @GetMapping("/settings")
    public UserDataDtos.SettingsResponse getSettings(@AuthenticationPrincipal User user) {
        return userDataService.getSettings(user);
    }

    @PatchMapping("/settings")
    public UserDataDtos.SettingsResponse updateSettings(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserDataDtos.UpdateSettingsRequest request
    ) {
        return userDataService.updateSettings(user, request);
    }

    @GetMapping("/focus")
    public UserDataDtos.FocusLogResponse getFocus(
            @AuthenticationPrincipal User user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return userDataService.getFocusByDate(user, date);
    }

    @PostMapping("/focus")
    public UserDataDtos.FocusLogResponse upsertFocus(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserDataDtos.FocusLogRequest request
    ) {
        return userDataService.upsertFocus(user, request);
    }
}
