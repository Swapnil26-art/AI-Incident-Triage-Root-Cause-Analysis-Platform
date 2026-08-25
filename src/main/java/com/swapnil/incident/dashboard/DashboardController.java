package com.swapnil.incident.dashboard;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.swapnil.incident.Incident;
import com.swapnil.incident.IncidentRepository;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class DashboardController {

    @Autowired
    private IncidentRepository incidentRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getIncidentMetrics() {
        List<Incident> incidents = incidentRepository.findAll();

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("total_incidents", incidents.size());
        metrics.put("open_incidents", incidentRepository.countByStatus(Incident.Status.OPEN));
        metrics.put("investigating_incidents", incidentRepository.countByStatus(Incident.Status.INVESTIGATING));
        metrics.put("ai_analyzed_incidents", incidentRepository.countByStatus(Incident.Status.AI_ANALYZED));
        metrics.put("resolved_incidents", incidentRepository.countByStatus(Incident.Status.RESOLVED));
        metrics.put("p1_incidents", incidentRepository.countBySeverity(Incident.Severity.P1));
        metrics.put("p2_incidents", incidentRepository.countBySeverity(Incident.Severity.P2));
        metrics.put("p3_incidents", incidentRepository.countBySeverity(Incident.Severity.P3));
        metrics.put("p4_incidents", incidentRepository.countBySeverity(Incident.Severity.P4));

        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/incidents-by-category")
    public ResponseEntity<List<Map<String, Object>>> getIncidentsByCategory() {
        List<Incident> incidents = incidentRepository.findAll();

        List<Map<String, Object>> result = incidents.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getCategory().name(),
                        Collectors.counting()))
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
                .collect(Collectors.groupingBy(
                        i -> i.getSeverity().name(),
                        Collectors.counting()))
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
                .collect(Collectors.groupingBy(
                        i -> i.getStatus().name(),
                        Collectors.counting()))
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
}
