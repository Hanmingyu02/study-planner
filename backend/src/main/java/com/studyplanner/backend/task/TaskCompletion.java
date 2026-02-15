package com.studyplanner.backend.task;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "task_completions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_completion_task_date", columnNames = {"task_id", "occurrence_date"})
        },
        indexes = {
                @Index(name = "idx_completion_task_date", columnList = "task_id,occurrence_date")
        }
)
public class TaskCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id")
    private Task task;

    @Column(name = "occurrence_date", nullable = false)
    private LocalDate occurrenceDate;

    public UUID getId() { return id; }
    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }
    public LocalDate getOccurrenceDate() { return occurrenceDate; }
    public void setOccurrenceDate(LocalDate occurrenceDate) { this.occurrenceDate = occurrenceDate; }
}
