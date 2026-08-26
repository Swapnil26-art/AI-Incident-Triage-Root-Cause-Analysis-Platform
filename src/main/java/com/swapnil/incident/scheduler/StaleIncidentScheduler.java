package com.swapnil.incident.scheduler;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.swapnil.incident.Incident;
import com.swapnil.incident.IncidentRepository;
import com.swapnil.incident.websocket.IncidentEventHandler;

@Component
public class StaleIncidentScheduler {

    private static final Logger log = LoggerFactory.getLogger(StaleIncidentScheduler.class);

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private IncidentEventHandler eventHandler;

    @Scheduled(fixedRate = 300000)
    public void autoEscalateStaleIncidents() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(4);
        List<Incident> openIncidents = incidentRepository.findByStatus(Incident.Status.OPEN);

        int escalated = 0;
        for (Incident incident : openIncidents) {
            if (incident.getCreatedAt() != null && incident.getCreatedAt().isBefore(threshold)) {
                incident.setStatus(Incident.Status.ESCALATED);
                incident.setUpdatedAt(LocalDateTime.now());
                incidentRepository.save(incident);
                eventHandler.broadcastIncidentUpdate(incident, "AUTO_ESCALATED");
                escalated++;
                log.info("Auto-escalated stale incident: {}", incident.getTicketNumber());
            }
        }

        List<Incident> investigatingIncidents = incidentRepository.findByStatus(Incident.Status.INVESTIGATING);
        LocalDateTime deepThreshold = LocalDateTime.now().minusHours(8);
        for (Incident incident : investigatingIncidents) {
            if (incident.getUpdatedAt() != null && incident.getUpdatedAt().isBefore(deepThreshold)) {
                incident.setStatus(Incident.Status.ESCALATED);
                incident.setUpdatedAt(LocalDateTime.now());
                incidentRepository.save(incident);
                eventHandler.broadcastIncidentUpdate(incident, "AUTO_ESCALATED");
                escalated++;
                log.info("Auto-escalated long-investigating incident: {}", incident.getTicketNumber());
            }
        }

        if (escalated > 0) {
            eventHandler.broadcastDashboardUpdate();
            log.info("Stale incident check complete. Escalated {} incidents.", escalated);
        }
    }
}
