package com.studyplanner.backend.task;

import com.studyplanner.backend.common.NotFoundException;
import com.studyplanner.backend.user.User;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskCompletionRepository taskCompletionRepository;

    public TaskService(TaskRepository taskRepository, TaskCompletionRepository taskCompletionRepository) {
        this.taskRepository = taskRepository;
        this.taskCompletionRepository = taskCompletionRepository;
    }

    @Transactional
    public TaskDtos.TaskResponse create(User user, TaskDtos.CreateTaskRequest request) {
        Task task = new Task();
        task.setUser(user);
        task.setTitle(request.title().trim());
        task.setSubject(request.subject().trim());
        task.setDueDate(request.dueDate());
        task.setDueTime(request.dueTime());
        task.setPriority(request.priority());
        task.setRecurrence(request.recurrence());
        task.setCompleted(false);

        return toResponse(taskRepository.save(task), request.dueDate());
    }

    public List<TaskDtos.TaskResponse> getByDate(User user, LocalDate date, Priority priority, String sort) {
        List<Task> candidates = taskRepository.findByUserAndDueDateLessThanEqual(user, date);
        List<Task> filtered = candidates.stream()
                .filter(task -> occursOn(task, date))
                .filter(task -> priority == null || task.getPriority() == priority)
                .toList();

        Map<UUID, Boolean> completionMap = completionMap(filtered, date);

        List<TaskDtos.TaskResponse> result = filtered.stream()
                .map(task -> toResponse(task, date, completionMap.getOrDefault(task.getId(), false)))
                .sorted(taskComparator(sort))
                .toList();

        return result;
    }

    public List<TaskDtos.CalendarDayResponse> getMonth(User user, YearMonth month) {
        LocalDate first = month.atDay(1);
        LocalDate last = month.atEndOfMonth();

        List<Task> all = taskRepository.findByUserAndDueDateLessThanEqual(user, last);
        List<TaskCompletion> monthCompletions = all.isEmpty()
                ? List.of()
                : taskCompletionRepository.findByTaskInAndOccurrenceDateBetween(all, first, last);
        Set<String> completionKeys = new HashSet<>();
        for (TaskCompletion completion : monthCompletions) {
            completionKeys.add(completionKey(completion.getTask().getId(), completion.getOccurrenceDate()));
        }
        List<TaskDtos.CalendarDayResponse> result = new ArrayList<>();

        for (LocalDate day = first; !day.isAfter(last); day = day.plusDays(1)) {
            LocalDate current = day;
            List<Task> dayTasks = all.stream().filter(task -> occursOn(task, current)).toList();
            List<TaskDtos.TaskResponse> mapped = dayTasks.stream()
                    .map(task -> {
                        boolean completed = task.getRecurrence() == Recurrence.NONE
                                ? task.isCompleted()
                                : completionKeys.contains(completionKey(task.getId(), current));
                        return toResponse(task, current, completed);
                    })
                    .sorted(taskComparator("time"))
                    .toList();

            result.add(new TaskDtos.CalendarDayResponse(day, mapped));
        }

        return result;
    }

    @Transactional
    public TaskDtos.TaskResponse update(User user, UUID taskId, TaskDtos.UpdateTaskRequest request) {
        Task task = findTask(taskId, user);

        if (request.title() != null && !request.title().isBlank()) task.setTitle(request.title().trim());
        if (request.subject() != null && !request.subject().isBlank()) task.setSubject(request.subject().trim());
        if (request.dueDate() != null) task.setDueDate(request.dueDate());
        if (request.dueTime() != null) task.setDueTime(request.dueTime());
        if (request.priority() != null) task.setPriority(request.priority());
        if (request.recurrence() != null) task.setRecurrence(request.recurrence());

        return toResponse(taskRepository.save(task), task.getDueDate());
    }

    @Transactional
    public TaskDtos.TaskResponse toggle(User user, UUID taskId, LocalDate date) {
        Task task = findTask(taskId, user);

        if (task.getRecurrence() == Recurrence.NONE) {
            task.setCompleted(!task.isCompleted());
            return toResponse(taskRepository.save(task), date);
        }

        Optional<TaskCompletion> existing = taskCompletionRepository.findByTaskAndOccurrenceDate(task, date);
        if (existing.isPresent()) {
            taskCompletionRepository.delete(existing.get());
            return toResponse(task, date, false);
        }

        TaskCompletion completion = new TaskCompletion();
        completion.setTask(task);
        completion.setOccurrenceDate(date);
        taskCompletionRepository.save(completion);
        return toResponse(task, date, true);
    }

    @Transactional
    public TaskDtos.TaskResponse move(User user, UUID taskId, LocalDate dueDate) {
        Task task = findTask(taskId, user);
        task.setDueDate(dueDate);
        task.setCompleted(false);
        return toResponse(taskRepository.save(task), dueDate);
    }

    @Transactional
    public void delete(User user, UUID taskId) {
        Task task = findTask(taskId, user);
        taskCompletionRepository.deleteByTask(task);
        taskRepository.delete(task);
    }

    private Task findTask(UUID taskId, User user) {
        return taskRepository.findByIdAndUser(taskId, user)
                .orElseThrow(() -> new NotFoundException("일정을 찾을 수 없습니다."));
    }

    private boolean occursOn(Task task, LocalDate date) {
        if (date.isBefore(task.getDueDate())) return false;

        if (task.getRecurrence() == Recurrence.NONE) {
            return task.getDueDate().isEqual(date);
        }

        if (task.getRecurrence() == Recurrence.DAILY) {
            return true;
        }

        DayOfWeek startDow = task.getDueDate().getDayOfWeek();
        DayOfWeek targetDow = date.getDayOfWeek();
        return startDow == targetDow;
    }

    private Map<UUID, Boolean> completionMap(List<Task> tasks, LocalDate date) {
        if (tasks.isEmpty()) return Collections.emptyMap();

        List<TaskCompletion> completions = taskCompletionRepository.findByTaskInAndOccurrenceDate(tasks, date);
        Set<UUID> completedRecurringTaskIds = completions.stream().map(c -> c.getTask().getId()).collect(java.util.stream.Collectors.toSet());

        Map<UUID, Boolean> map = new HashMap<>();
        for (Task task : tasks) {
            if (task.getRecurrence() == Recurrence.NONE) {
                map.put(task.getId(), task.isCompleted());
            } else {
                map.put(task.getId(), completedRecurringTaskIds.contains(task.getId()));
            }
        }

        return map;
    }

    private String completionKey(UUID taskId, LocalDate date) {
        return taskId + "::" + date;
    }

    private Comparator<TaskDtos.TaskResponse> taskComparator(String sort) {
        if ("priority".equalsIgnoreCase(sort)) {
            return Comparator
                    .comparingInt((TaskDtos.TaskResponse t) -> priorityWeight(t.priority())).reversed()
                    .thenComparing(TaskDtos.TaskResponse::dueTime);
        }

        if ("recent".equalsIgnoreCase(sort)) {
            return Comparator.comparing(TaskDtos.TaskResponse::createdAt).reversed();
        }

        return Comparator
                .comparing(TaskDtos.TaskResponse::dueTime)
                .thenComparing((TaskDtos.TaskResponse t) -> priorityWeight(t.priority()), Comparator.reverseOrder());
    }

    private int priorityWeight(Priority priority) {
        return switch (priority) {
            case HIGH -> 3;
            case MEDIUM -> 2;
            case LOW -> 1;
        };
    }

    private TaskDtos.TaskResponse toResponse(Task task, LocalDate date) {
        return toResponse(task, date, task.isCompleted());
    }

    private TaskDtos.TaskResponse toResponse(Task task, LocalDate date, boolean completed) {
        return new TaskDtos.TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getSubject(),
                date,
                task.getDueTime(),
                task.getPriority(),
                task.getRecurrence(),
                completed,
                task.getCreatedAt()
        );
    }
}
