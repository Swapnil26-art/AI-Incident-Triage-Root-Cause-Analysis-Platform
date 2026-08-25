package com.swapnil.incident.websocket;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
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
                "incident", incident,
                "ticketNumber", incident.getTicketNumber(),
                "status", incident.getStatus().name(),
                "severity", incident.getSeverity().name()
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
