package com.swapnil.incident.servicemap;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "service_dependencies")
@Data
public class ServiceDependency {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_service", nullable = false)
    private String sourceService;

    @Column(name = "target_service", nullable = false)
    private String targetService;

    @Column(name = "dependency_type", nullable = false)
    private String dependencyType = "sync";

    @Column(name = "description")
    private String description;

    @Column(name = "latency_ms")
    private Integer latencyMs;

    @Column(name = "error_rate")
    private Double errorRate;
}
