package com.swapnil.incident;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.swapnil.incident.websocket.IncidentEventHandler;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private IncidentEventHandler eventHandler;

    private final AtomicLong ticketCounter = new AtomicLong(1000);

    private String generateTicketNumber() {
        return "INC-" + String.format("%04d", ticketCounter.incrementAndGet());
    }

    private Incident.Status safeParseStatus(String status, Incident.Status defaultVal) {
        if (status == null || status.isBlank()) return defaultVal;
        try {
            return Incident.Status.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return defaultVal;
        }
    }

    private Incident.Severity safeParseSeverity(String severity, Incident.Severity defaultVal) {
        if (severity == null || severity.isBlank()) return defaultVal;
        try {
            return Incident.Severity.valueOf(severity.toUpperCase());
        } catch (IllegalArgumentException e) {
            return defaultVal;
        }
    }

    private Incident.Category safeParseCategory(String category, Incident.Category defaultVal) {
        if (category == null || category.isBlank()) return defaultVal;
        try {
            return Incident.Category.valueOf(category.toUpperCase());
        } catch (IllegalArgumentException e) {
            return defaultVal;
        }
    }

    private Incident.Priority safeParsePriority(String priority, Incident.Priority defaultVal) {
        if (priority == null || priority.isBlank()) return defaultVal;
        try {
            return Incident.Priority.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            return defaultVal;
        }
    }

    @PostMapping
    public ResponseEntity<Incident> createIncident(@RequestBody Incident incident) {
        incident.setTicketNumber(generateTicketNumber());
        incident.setCreatedAt(java.time.LocalDateTime.now());
        incident.setUpdatedAt(java.time.LocalDateTime.now());
        if (incident.getStatus() == null) {
            incident.setStatus(Incident.Status.OPEN);
        }
        Incident saved = incidentRepository.save(incident);
        eventHandler.broadcastIncidentUpdate(saved, "CREATED");
        eventHandler.broadcastDashboardUpdate();
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<Incident>> getAllIncidents(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status) {

        List<Incident> incidents;

        Incident.Category cat = safeParseCategory(category, null);
        Incident.Severity sev = safeParseSeverity(severity, null);
        Incident.Status sta = safeParseStatus(status, null);

        if (cat != null && sev != null && sta != null) {
            incidents = incidentRepository.findByCategoryAndSeverityAndStatus(cat, sev, sta);
        } else if (cat != null && sev != null) {
            incidents = incidentRepository.findByCategoryAndSeverity(cat, sev);
        } else if (cat != null && sta != null) {
            incidents = incidentRepository.findByCategoryAndStatus(cat, sta);
        } else if (sev != null && sta != null) {
            incidents = incidentRepository.findBySeverityAndStatus(sev, sta);
        } else if (cat != null) {
            incidents = incidentRepository.findByCategory(cat);
        } else if (sev != null) {
            incidents = incidentRepository.findBySeverity(sev);
        } else if (sta != null) {
            incidents = incidentRepository.findByStatus(sta);
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
            if (updatedIncident.getTitle() != null) incident.setTitle(updatedIncident.getTitle());
            if (updatedIncident.getDescription() != null) incident.setDescription(updatedIncident.getDescription());
            if (updatedIncident.getSeverity() != null) incident.setSeverity(updatedIncident.getSeverity());
            if (updatedIncident.getPriority() != null) incident.setPriority(updatedIncident.getPriority());
            if (updatedIncident.getCategory() != null) incident.setCategory(updatedIncident.getCategory());
            if (updatedIncident.getStatus() != null) incident.setStatus(updatedIncident.getStatus());
            if (updatedIncident.getSource() != null) incident.setSource(updatedIncident.getSource());
            if (updatedIncident.getAffectedComponent() != null) incident.setAffectedComponent(updatedIncident.getAffectedComponent());
            if (updatedIncident.getAssignedTo() != null) incident.setAssignedTo(updatedIncident.getAssignedTo());
            incident.setUpdatedAt(java.time.LocalDateTime.now());
            if (updatedIncident.getStatus() == Incident.Status.RESOLVED && incident.getResolvedAt() == null) {
                incident.setResolvedAt(java.time.LocalDateTime.now());
            }
            Incident saved = incidentRepository.save(incident);
            eventHandler.broadcastIncidentUpdate(saved, "UPDATED");
            eventHandler.broadcastDashboardUpdate();
            return ResponseEntity.ok(saved);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Incident> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        String statusStr = body.get("status");
        Incident.Status newStatus = safeParseStatus(statusStr, null);
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }
        return incidentRepository.findById(id).map(incident -> {
            incident.setStatus(newStatus);
            incident.setUpdatedAt(java.time.LocalDateTime.now());
            if (newStatus == Incident.Status.RESOLVED && incident.getResolvedAt() == null) {
                incident.setResolvedAt(java.time.LocalDateTime.now());
            }
            Incident saved = incidentRepository.save(incident);
            eventHandler.broadcastIncidentUpdate(saved, "STATUS_CHANGED");
            eventHandler.broadcastDashboardUpdate();
            return ResponseEntity.ok(saved);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncident(@PathVariable Long id) {
        return incidentRepository.findById(id).map(incident -> {
            eventHandler.broadcastIncidentUpdate(incident, "DELETED");
            incidentRepository.deleteById(id);
            eventHandler.broadcastDashboardUpdate();
            return ResponseEntity.noContent().<Void>build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Transactional
    @PostMapping("/{id}/logs")
    public ResponseEntity<Incident> addLog(@PathVariable Long id, @RequestBody Log log) {
        if (log.getMessage() == null || log.getMessage().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return incidentRepository.findById(id).map(incident -> {
            Log newLog = new Log();
            newLog.setIncident(incident);
            newLog.setTimestamp(java.time.LocalDateTime.now());
            newLog.setAuthor(log.getAuthor() != null ? log.getAuthor() : "user");
            newLog.setMessage(log.getMessage());
            incident.getLogs().add(newLog);
            incident.setUpdatedAt(java.time.LocalDateTime.now());
            Incident saved = incidentRepository.save(incident);
            eventHandler.broadcastIncidentUpdate(saved, "LOG_ADDED");
            return ResponseEntity.ok(saved);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Transactional
    @GetMapping("/{id}/logs")
    public ResponseEntity<List<Log>> getIncidentLogs(@PathVariable Long id) {
        return incidentRepository.findById(id)
                .map(incident -> ResponseEntity.ok(incident.getLogs()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
