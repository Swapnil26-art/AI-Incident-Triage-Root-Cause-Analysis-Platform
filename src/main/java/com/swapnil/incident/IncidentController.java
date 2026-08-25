package com.swapnil.incident;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class IncidentController {

    @Autowired
    private IncidentRepository incidentRepository;

    @PostMapping
    public ResponseEntity<Incident> createIncident(@RequestBody Incident incident) {
        incident.setCreatedAt(java.time.LocalDateTime.now());
        incident.setUpdatedAt(java.time.LocalDateTime.now());
        if (incident.getStatus() == null) {
            incident.setStatus(Incident.Status.OPEN);
        }
        return ResponseEntity.ok(incidentRepository.save(incident));
    }

    @GetMapping
    public ResponseEntity<List<Incident>> getAllIncidents(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status) {

        List<Incident> incidents;

        if (category != null && !category.isEmpty()) {
            incidents = incidentRepository.findByCategory(Incident.Category.valueOf(category.toUpperCase()));
        } else if (severity != null && !severity.isEmpty()) {
            incidents = incidentRepository.findBySeverity(Incident.Severity.valueOf(severity.toUpperCase()));
        } else if (status != null && !status.isEmpty()) {
            incidents = incidentRepository.findByStatus(Incident.Status.valueOf(status.toUpperCase()));
        } else {
            incidents = incidentRepository.findAll();
        }

        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncidentById(@PathVariable Long id) {
        Optional<Incident> incident = incidentRepository.findById(id);
        return incident.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Incident> updateIncident(@PathVariable Long id, @RequestBody Incident updatedIncident) {
        return incidentRepository.findById(id).map(incident -> {
            incident.setTitle(updatedIncident.getTitle());
            incident.setDescription(updatedIncident.getDescription());
            incident.setSeverity(updatedIncident.getSeverity());
            incident.setPriority(updatedIncident.getPriority());
            incident.setCategory(updatedIncident.getCategory());
            incident.setStatus(updatedIncident.getStatus());
            incident.setSource(updatedIncident.getSource());
            incident.setAffectedComponent(updatedIncident.getAffectedComponent());
            incident.setAssignedTo(updatedIncident.getAssignedTo());
            incident.setUpdatedAt(java.time.LocalDateTime.now());
            if (updatedIncident.getStatus() == Incident.Status.RESOLVED && incident.getResolvedAt() == null) {
                incident.setResolvedAt(java.time.LocalDateTime.now());
            }
            return ResponseEntity.ok(incidentRepository.save(incident));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncident(@PathVariable Long id) {
        if (incidentRepository.existsById(id)) {
            incidentRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/logs")
    public ResponseEntity<Incident> addLog(@PathVariable Long id, @RequestBody Log log) {
        return incidentRepository.findById(id).map(incident -> {
            log.setIncident(incident);
            log.setTimestamp(java.time.LocalDateTime.now());
            incident.getLogs().add(log);
            incident.setUpdatedAt(java.time.LocalDateTime.now());
            return ResponseEntity.ok(incidentRepository.save(incident));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<Log>> getIncidentLogs(@PathVariable Long id) {
        return incidentRepository.findById(id)
                .map(incident -> ResponseEntity.ok(incident.getLogs()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
