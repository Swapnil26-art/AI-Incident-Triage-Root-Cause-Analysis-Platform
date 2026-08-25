package com.swapnil.incident;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "incidents")
@Data
public class Incident {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "ticket_number", unique = true, nullable = false)
    private String ticketNumber;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    private Severity severity = Severity.P3;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private Category category = Category.OTHER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.OPEN;

    @Column(name = "source", nullable = false)
    private String source;

    @Column(name = "affected_component", nullable = false)
    private String affectedComponent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "assigned_to", nullable = true)
    private String assignedTo;

    @Column(name = "resolved_at", nullable = true)
    private LocalDateTime resolvedAt;

    // Relationship with Logs
    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL)
    private List<Log> logs = new ArrayList<>();

    // Enums
    public enum Severity {
        P1, P2, P3, P4
    }

    public enum Priority {
        HIGH, MEDIUM, LOW
    }

    public enum Category {
        NETWORK, APPLICATION, DATABASE, API, AUTHENTICATION, INFRASTRUCTURE, OTHER
    }

    public enum Status {
        OPEN, INVESTIGATING, AI_ANALYZED, WAITING_APPROVAL, RESOLVED, ESCALATED, CLOSED
    }
}