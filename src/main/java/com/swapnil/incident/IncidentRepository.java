package com.swapnil.incident;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByCategory(Incident.Category category);
    List<Incident> findBySeverity(Incident.Severity severity);
    List<Incident> findByStatus(Incident.Status status);
    Incident findByTicketNumber(String ticketNumber);
    long countByStatus(Incident.Status status);
    long countBySeverity(Incident.Severity severity);
}
