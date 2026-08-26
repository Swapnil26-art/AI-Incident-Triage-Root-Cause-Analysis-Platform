package com.swapnil.incident.dashboard;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.swapnil.incident.Incident;
import com.swapnil.incident.IncidentRepository;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private IncidentRepository incidentRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getIncidentMetrics() {
        Map<String, Object> metrics = new LinkedHashMap<>();
        long total = incidentRepository.count();
        metrics.put("total_incidents", total);
        metrics.put("open_incidents", incidentRepository.countByStatus(Incident.Status.OPEN));
        metrics.put("investigating_incidents", incidentRepository.countByStatus(Incident.Status.INVESTIGATING));
        metrics.put("ai_analyzed_incidents", incidentRepository.countByStatus(Incident.Status.AI_ANALYZED));
        metrics.put("resolved_incidents", incidentRepository.countByStatus(Incident.Status.RESOLVED));
        metrics.put("escalated_incidents", incidentRepository.countByStatus(Incident.Status.ESCALATED));
        metrics.put("closed_incidents", incidentRepository.countByStatus(Incident.Status.CLOSED));
        metrics.put("p1_incidents", incidentRepository.countBySeverity(Incident.Severity.P1));
        metrics.put("p2_incidents", incidentRepository.countBySeverity(Incident.Severity.P2));
        metrics.put("p3_incidents", incidentRepository.countBySeverity(Incident.Severity.P3));
        metrics.put("p4_incidents", incidentRepository.countBySeverity(Incident.Severity.P4));

        List<Incident> all = incidentRepository.findAll();
        long resolvedCount = all.stream().filter(i -> i.getStatus() == Incident.Status.RESOLVED || i.getStatus() == Incident.Status.CLOSED).count();
        metrics.put("resolution_rate", total > 0 ? Math.round((double) resolvedCount / total * 100) : 0);

        OptionalDouble avgMttm = all.stream()
                .filter(i -> i.getResolvedAt() != null && i.getCreatedAt() != null)
                .mapToLong(i -> ChronoUnit.MINUTES.between(i.getCreatedAt(), i.getResolvedAt()))
                .average();
        metrics.put("avg_resolution_minutes", avgMttm.isPresent() ? Math.round(avgMttm.getAsDouble()) : 0);

        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/incidents-by-category")
    public ResponseEntity<List<Map<String, Object>>> getIncidentsByCategory() {
        List<Incident> incidents = incidentRepository.findAll();
        List<Map<String, Object>> result = incidents.stream()
                .collect(Collectors.groupingBy(i -> i.getCategory().name(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("category", e.getKey());
                    map.put("count", e.getValue());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/incidents-by-severity")
    public ResponseEntity<List<Map<String, Object>>> getIncidentsBySeverity() {
        List<Incident> incidents = incidentRepository.findAll();
        List<Map<String, Object>> result = incidents.stream()
                .collect(Collectors.groupingBy(i -> i.getSeverity().name(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("severity", e.getKey());
                    map.put("count", e.getValue());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/incidents-by-status")
    public ResponseEntity<List<Map<String, Object>>> getIncidentsByStatus() {
        List<Incident> incidents = incidentRepository.findAll();
        List<Map<String, Object>> result = incidents.stream()
                .collect(Collectors.groupingBy(i -> i.getStatus().name(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("status", e.getKey());
                    map.put("count", e.getValue());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sla")
    public ResponseEntity<Map<String, Object>> getSlaCompliance() {
        List<Incident> all = incidentRepository.findAll();
        Map<String, Object> sla = new LinkedHashMap<>();

        Map<Incident.Severity, Integer> slaTargets = Map.of(
                Incident.Severity.P1, 120,
                Incident.Severity.P2, 240,
                Incident.Severity.P3, 480,
                Incident.Severity.P4, 2880
        );

        long total = all.stream().filter(i -> i.getResolvedAt() != null).count();
        sla.put("total_resolved", total);

        Map<String, Object> bySeverity = new LinkedHashMap<>();
        for (Incident.Severity sev : Incident.Severity.values()) {
            List<Incident> sevIncidents = all.stream()
                    .filter(i -> i.getSeverity() == sev && i.getResolvedAt() != null && i.getCreatedAt() != null)
                    .collect(Collectors.toList());

            int target = slaTargets.get(sev);
            long compliant = sevIncidents.stream()
                    .filter(i -> ChronoUnit.MINUTES.between(i.getCreatedAt(), i.getResolvedAt()) <= target)
                    .count();

            double pct = sevIncidents.isEmpty() ? 100.0 : Math.round((double) compliant / sevIncidents.size() * 1000.0) / 10.0;
            OptionalDouble avgMinutes = sevIncidents.stream()
                    .mapToLong(i -> ChronoUnit.MINUTES.between(i.getCreatedAt(), i.getResolvedAt()))
                    .average();

            bySeverity.put(sev.name(), Map.of(
                    "total", sevIncidents.size(),
                    "compliant", compliant,
                    "compliance_pct", pct,
                    "target_minutes", target,
                    "avg_resolution_minutes", avgMinutes.isPresent() ? Math.round(avgMinutes.getAsDouble()) : 0
            ));
        }
        sla.put("by_severity", bySeverity);

        long totalCompliant = all.stream()
                .filter(i -> i.getResolvedAt() != null && i.getCreatedAt() != null)
                .filter(i -> {
                    int target = slaTargets.getOrDefault(i.getSeverity(), 2880);
                    return ChronoUnit.MINUTES.between(i.getCreatedAt(), i.getResolvedAt()) <= target;
                })
                .count();
        sla.put("overall_compliance_pct", total > 0 ? Math.round((double) totalCompliant / total * 1000.0) / 10.0 : 100.0);

        return ResponseEntity.ok(sla);
    }

    @GetMapping("/reports/summary")
    public ResponseEntity<Map<String, Object>> getReportSummary() {
        List<Incident> all = incidentRepository.findAll();
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("generated_at", LocalDateTime.now().toString());
        report.put("total_incidents", all.size());

        Map<String, Object> summary = new LinkedHashMap<>();
        for (Incident.Status status : Incident.Status.values()) {
            long count = all.stream().filter(i -> i.getStatus() == status).count();
            summary.put(status.name().toLowerCase(), count);
        }
        report.put("by_status", summary);

        Map<String, Object> severityBreakdown = new LinkedHashMap<>();
        for (Incident.Severity sev : Incident.Severity.values()) {
            long count = all.stream().filter(i -> i.getSeverity() == sev).count();
            severityBreakdown.put(sev.name().toLowerCase(), count);
        }
        report.put("by_severity", severityBreakdown);

        Map<String, Object> categoryBreakdown = new LinkedHashMap<>();
        for (Incident.Category cat : Incident.Category.values()) {
            long count = all.stream().filter(i -> i.getCategory() == cat).count();
            categoryBreakdown.put(cat.name().toLowerCase(), count);
        }
        report.put("by_category", categoryBreakdown);

        long aiAnalyzed = all.stream().filter(i -> i.getAiRootCause() != null).count();
        report.put("ai_analyzed", aiAnalyzed);
        report.put("ai_analysis_rate", all.isEmpty() ? 0 : Math.round((double) aiAnalyzed / all.size() * 100));

        OptionalDouble avgConfidence = all.stream()
                .filter(i -> i.getAiConfidenceScore() != null)
                .mapToDouble(Incident::getAiConfidenceScore)
                .average();
        report.put("avg_ai_confidence", avgConfidence.isPresent() ? Math.round(avgConfidence.getAsDouble() * 100.0) / 100.0 : 0);

        Map<String, Long> assigneeWorkload = all.stream()
                .filter(i -> !["RESOLVED", "CLOSED"].contains(i.getStatus().name()))
                .filter(i -> i.getAssignedTo() != null)
                .collect(Collectors.groupingBy(Incident::getAssignedTo, Collectors.counting()));
        report.put("active_workload", assigneeWorkload);

        Map<String, Long> componentFrequency = all.stream()
                .collect(Collectors.groupingBy(Incident::getAffectedComponent, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));
        report.put("top_5_components", componentFrequency);

        return ResponseEntity.ok(report);
    }
}
