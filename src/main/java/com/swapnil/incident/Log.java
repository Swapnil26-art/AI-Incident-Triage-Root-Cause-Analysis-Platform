package com.swapnil.incident;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "logs")
@Data
public class Log {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String message;

    @ManyToOne
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;
}