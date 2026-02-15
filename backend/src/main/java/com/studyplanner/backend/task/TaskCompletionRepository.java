package com.studyplanner.backend.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskCompletionRepository extends JpaRepository<TaskCompletion, UUID> {
    Optional<TaskCompletion> findByTaskAndOccurrenceDate(Task task, LocalDate occurrenceDate);
    List<TaskCompletion> findByTaskInAndOccurrenceDate(List<Task> tasks, LocalDate occurrenceDate);
    void deleteByTask(Task task);
}
