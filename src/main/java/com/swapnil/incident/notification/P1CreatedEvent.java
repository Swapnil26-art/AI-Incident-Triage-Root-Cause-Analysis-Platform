package com.swapnil.incident.notification;

import com.swapnil.incident.Incident;
import org.springframework.context.ApplicationEvent;

public class P1CreatedEvent extends ApplicationEvent {
    private final Incident incident;

    public P1CreatedEvent(Object source, Incident incident) {
        super(source);
        this.incident = incident;
    }

    public Incident getIncident() {
        return incident;
    }
}
