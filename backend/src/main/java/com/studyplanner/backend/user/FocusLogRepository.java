package com.studyplanner.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface FocusLogRepository extends JpaRepository<FocusLog, UUID> {
    Optional<FocusLog> findByUserAndDate(User user, LocalDate date);
}
