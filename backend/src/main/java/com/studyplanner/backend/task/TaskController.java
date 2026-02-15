package com.studyplanner.backend.task;

import com.studyplanner.backend.user.User;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public TaskDtos.TaskResponse create(@AuthenticationPrincipal User user, @Valid @RequestBody TaskDtos.CreateTaskRequest request) {
        return taskService.create(user, request);
    }

    @GetMapping
    public List<TaskDtos.TaskResponse> getByDate(
            @AuthenticationPrincipal User user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Priority priority,
            @RequestParam(defaultValue = "priority") String sort
    ) {
        return taskService.getByDate(user, date, priority, sort);
    }

    @GetMapping("/calendar")
    public List<TaskDtos.CalendarDayResponse> calendar(
            @AuthenticationPrincipal User user,
            @RequestParam String month
    ) {
        return taskService.getMonth(user, YearMonth.parse(month));
    }

    @PatchMapping("/{taskId}")
    public TaskDtos.TaskResponse update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID taskId,
            @RequestBody TaskDtos.UpdateTaskRequest request
    ) {
        return taskService.update(user, taskId, request);
    }

    @PatchMapping("/{taskId}/toggle")
    public TaskDtos.TaskResponse toggle(
            @AuthenticationPrincipal User user,
            @PathVariable UUID taskId,
            @Valid @RequestBody TaskDtos.ToggleTaskRequest request
    ) {
        return taskService.toggle(user, taskId, request.date());
    }

    @PatchMapping("/{taskId}/move")
    public TaskDtos.TaskResponse move(
            @AuthenticationPrincipal User user,
            @PathVariable UUID taskId,
            @Valid @RequestBody TaskDtos.MoveTaskRequest request
    ) {
        return taskService.move(user, taskId, request.dueDate());
    }

    @DeleteMapping("/{taskId}")
    public Map<String, String> delete(@AuthenticationPrincipal User user, @PathVariable UUID taskId) {
        taskService.delete(user, taskId);
        return Map.of("message", "삭제되었습니다.");
    }
}
