package com.studyplanner.backend.task;

import com.studyplanner.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByUser(User user);
    Optional<Task> findByIdAndUser(UUID id, User user);

    @Query("""
            select t from Task t
            where t.user = :user
              and (
                    (t.recurrence = com.studyplanner.backend.task.Recurrence.NONE and t.dueDate = :date)
                    or
                    (t.recurrence <> com.studyplanner.backend.task.Recurrence.NONE and t.dueDate <= :date)
              )
            """)
    List<Task> findByUserForDate(@Param("user") User user, @Param("date") LocalDate date);

    @Query("""
            select t from Task t
            where t.user = :user
              and (
                    (t.recurrence = com.studyplanner.backend.task.Recurrence.NONE and t.dueDate between :first and :last)
                    or
                    (t.recurrence <> com.studyplanner.backend.task.Recurrence.NONE and t.dueDate <= :last)
              )
            """)
    List<Task> findByUserForMonth(
            @Param("user") User user,
            @Param("first") LocalDate first,
            @Param("last") LocalDate last
    );
}
