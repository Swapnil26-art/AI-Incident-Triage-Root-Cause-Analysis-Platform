package com.swapnil.incident;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByCategory(Incident.Category category);
    List<Incident> findBySeverity(Incident.Severity severity);
    List<Incident> findByStatus(Incident.Status status);
    List<Incident> findByCategoryAndSeverity(Incident.Category category, Incident.Severity severity);
    List<Incident> findByCategoryAndStatus(Incident.Category category, Incident.Status status);
    List<Incident> findBySeverityAndStatus(Incident.Severity severity, Incident.Status status);
    List<Incident> findByCategoryAndSeverityAndStatus(Incident.Category category, Incident.Severity severity, Incident.Status status);
    Incident findByTicketNumber(String ticketNumber);
    long countByStatus(Incident.Status status);
    long countBySeverity(Incident.Severity severity);
}
