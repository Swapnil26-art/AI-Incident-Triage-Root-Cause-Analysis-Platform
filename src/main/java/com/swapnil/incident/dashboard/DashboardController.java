package com.swapnil.incident.dashboard;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.swapnil.incident.incident.entity.Incident;
import com.swapnil.incident.incident.repository.IncidentRepository;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    @Autowired
    private IncidentRepository incidentRepository;

    @GetMapping
    public Map<String, Object> getIncidentMetrics() {
        List<Incident> incidents = incidentRepository.findAll();

        int total = incidents.size();
        int open = (int) incidents.stream().filter(i -> i.getStatus() == Incident.Status.OPEN).count();
        int p1 = (int) incidents.stream().filter(i -> i.getSeverity() == Incident.Severity.P1).count();
        int p2 = (int) incidents.stream().filter(i -> i.getSeverity() == Incident.Severity.P2).count();
        int resolved = (int) incidents.stream().filter(i -> i.getStatus() == Incident.Status.RESOLVED).count();

        return Map.of(
            "total_incidents", total,
            "open_incidents", open,
            "p1_incidents", p1,
            "p2_incidents", p2,
            "resolved_incidents", resolved
        );
    }

    @GetMapping("/incidents-by-category")
    public List<Map<String, String>> getIncidentsByCategory() {
        return incidentRepository.findAll().stream()
            .map(i -> Map.of("category", i.getCategory().name(), "count", 1))
            .collect(Collectors.groupingBy(Map::get,
                Collectors.counting()))
            .entrySet().stream()
            .map(e -> Map.of("category", e.getKey(), "count", e.getValue()))
            .toList();
    }
}