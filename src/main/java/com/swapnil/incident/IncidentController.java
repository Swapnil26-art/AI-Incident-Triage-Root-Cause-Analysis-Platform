package com.swapnil.incident;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.swapnil.incident.auth.JwtUtil;
import com.swapnil.incident.auth.User;

import java.util.*;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {
    @Autowired
    private IncidentRepository incidentRepository;
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<Incident> createIncident(@RequestBody Incident incident, @RequestHeader("Authorization") String authHeader) {
        User user = jwtUtil.extractUserDetails(authHeader);
        incident.setAssignedTo(user.getUsername());
        return ResponseEntity.ok(incidentRepository.save(incident));
    }

    @GetMapping
    public ResponseEntity<List<Incident>> getAllIncidents(@RequestHeader("Authorization") String authHeader, Category? category, Severity? severity) {
        User user = jwtUtil.extractUserDetails(authHeader);
        List<Incident> incidents = incidentRepository.findAll();
        // Apply filters
        if (category.isPresent()) incidents = incidentRepository.findByCategory(category.get());
        if (severity.isPresent()) incidents = incidentRepository.findBySeverity(severity.get());
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncidentById(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(incidentRepository.findById(id).orElse(null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Incident> updateIncident(@PathVariable Long id, @RequestBody Incident updatedIncident, @RequestHeader("Authorization") String authHeader) {
        Incident incident = incidentRepository.findById(id).orElse(null);
        if (incident == null) return ResponseEntity.notFound().build();
        updatedIncident.setId(id);
        return ResponseEntity.ok(incidentRepository.save(updatedIncident));
    }

    @PostMapping("/{id}/logs")
    public ResponseEntity<Incident> addLog(@PathVariable Long id, @RequestBody Log log, @RequestHeader("Authorization") String authHeader) {
        Incident incident = incidentRepository.findById(id).orElse(null);
        if (incident == null) return ResponseEntity.notFound().build();
        log.setIncident(incident);
        incident.getLogs().add(log);
        return ResponseEntity.ok(incidentRepository.save(incident));
    }
}