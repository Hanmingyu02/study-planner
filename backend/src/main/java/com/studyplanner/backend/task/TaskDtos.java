package com.studyplanner.backend.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public class TaskDtos {

    public record CreateTaskRequest(
            @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 50) String subject,
            @NotNull LocalDate dueDate,
            @NotNull LocalTime dueTime,
            @NotNull Priority priority,
            @NotNull Recurrence recurrence
    ) {}

    public record UpdateTaskRequest(
            String title,
            String subject,
            LocalDate dueDate,
            LocalTime dueTime,
            Priority priority,
            Recurrence recurrence
    ) {}

    public record ToggleTaskRequest(@NotNull LocalDate date) {}
    public record MoveTaskRequest(@NotNull LocalDate dueDate) {}

    public record TaskResponse(
            UUID id,
            String title,
            String subject,
            LocalDate dueDate,
            LocalTime dueTime,
            Priority priority,
            Recurrence recurrence,
            boolean completed,
            Instant createdAt
    ) {}

    public record CalendarDayResponse(
            LocalDate date,
            List<TaskResponse> tasks
    ) {}
}
