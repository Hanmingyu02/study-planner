package com.studyplanner.backend.user;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(nullable = false)
    private int focusMinutes = 25;

    @Column(nullable = false)
    private int breakMinutes = 5;

    @Column(nullable = false)
    private boolean soundEnabled = true;

    @Column(nullable = false)
    private boolean browserNotifyEnabled = false;

    @Column(nullable = false)
    private boolean reminder10Enabled = true;

    @Column(nullable = false)
    private boolean reminder30Enabled = true;

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public int getFocusMinutes() { return focusMinutes; }
    public void setFocusMinutes(int focusMinutes) { this.focusMinutes = focusMinutes; }
    public int getBreakMinutes() { return breakMinutes; }
    public void setBreakMinutes(int breakMinutes) { this.breakMinutes = breakMinutes; }
    public boolean isSoundEnabled() { return soundEnabled; }
    public void setSoundEnabled(boolean soundEnabled) { this.soundEnabled = soundEnabled; }
    public boolean isBrowserNotifyEnabled() { return browserNotifyEnabled; }
    public void setBrowserNotifyEnabled(boolean browserNotifyEnabled) { this.browserNotifyEnabled = browserNotifyEnabled; }
    public boolean isReminder10Enabled() { return reminder10Enabled; }
    public void setReminder10Enabled(boolean reminder10Enabled) { this.reminder10Enabled = reminder10Enabled; }
    public boolean isReminder30Enabled() { return reminder30Enabled; }
    public void setReminder30Enabled(boolean reminder30Enabled) { this.reminder30Enabled = reminder30Enabled; }
}
