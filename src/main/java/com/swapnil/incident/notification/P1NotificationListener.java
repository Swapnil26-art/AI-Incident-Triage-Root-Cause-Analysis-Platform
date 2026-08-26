package com.swapnil.incident.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.swapnil.incident.Incident;

import java.util.Map;

@Component
public class P1NotificationListener {

    private static final Logger log = LoggerFactory.getLogger(P1NotificationListener.class);

    @EventListener
    @Async
    public void onP1Created(P1CreatedEvent event) {
        Incident incident = event.getIncident();
        log.warn("P1 ALERT: {} - {} [Component: {}]", incident.getTicketNumber(), incident.getTitle(), incident.getAffectedComponent());

        Map<String, Object> slackPayload = Map.of(
                "text", String.format(":rotating_light: *P1 CRITICAL INCIDENT* :rotating_light:\n*%s* — %s\nComponent: %s\nAssigned: %s",
                        incident.getTicketNumber(),
                        incident.getTitle(),
                        incident.getAffectedComponent(),
                        incident.getAssignedTo() != null ? incident.getAssignedTo() : "Unassigned")
        );

        log.info("Slack webhook payload (would be sent to configured webhook URL): {}", slackPayload);

        String emailBody = String.format(
                "P1 CRITICAL INCIDENT\n\nTicket: %s\nTitle: %s\nComponent: %s\nSeverity: %s\nStatus: %s\n\nPlease investigate immediately.",
                incident.getTicketNumber(),
                incident.getTitle(),
                incident.getAffectedComponent(),
                incident.getSeverity(),
                incident.getStatus()
        );
        log.info("Email notification body (would be sent to on-call team): {}", emailBody);
    }
}
