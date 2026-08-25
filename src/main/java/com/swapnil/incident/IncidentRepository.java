package com.swapnil.incident;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    // Custom queries
    List<Incident> findByCategory(Category category);
    List<Incident> findBySeverity(Severity severity);
    Incident findByTicketNumber(String ticketNumber);
}