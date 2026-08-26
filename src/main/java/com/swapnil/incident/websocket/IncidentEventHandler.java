package com.swapnil.incident.websocket;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.swapnil.incident.Incident;

@Component
public class IncidentEventHandler {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void broadcastIncidentUpdate(Incident incident, String eventType) {
        Map<String, Object> payload = Map.of(
                "eventType", eventType,
                "ticketNumber", incident.getTicketNumber() != null ? incident.getTicketNumber() : "",
                "status", incident.getStatus() != null ? incident.getStatus().name() : "UNKNOWN",
                "severity", incident.getSeverity() != null ? incident.getSeverity().name() : "UNKNOWN",
                "title", incident.getTitle() != null ? incident.getTitle() : "",
                "timestamp", java.time.LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/incidents", payload);
    }

    public void broadcastDashboardUpdate() {
        messagingTemplate.convertAndSend("/topic/dashboard", Map.of(
                "eventType", "DASHBOARD_UPDATE",
                "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }
}
