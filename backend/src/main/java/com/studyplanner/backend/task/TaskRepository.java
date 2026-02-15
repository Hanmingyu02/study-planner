package com.studyplanner.backend.task;

import com.studyplanner.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByUser(User user);
    List<Task> findByUserAndDueDateLessThanEqual(User user, LocalDate dueDate);
    Optional<Task> findByIdAndUser(UUID id, User user);
}
