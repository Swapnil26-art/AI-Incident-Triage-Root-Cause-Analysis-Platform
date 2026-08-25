package com.swapnil.incident.incident;

import com.swapnil.incident.incident.dto.IncidentDTO;
import com.swapnil.incident.incident.entity.Incident;
import com.swapnil.incident.incident.repository.IncidentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IncidentService {
    private final IncidentRepository incidentRepository;

    public IncidentService(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    public IncidentDTO createIncident(IncidentDTO incidentDTO) {
        Incident incident = new Incident();
        incident.setTicketNumber(incidentDTO.getTicketNumber());
        incident.setTitle(incidentDTO.getTitle());
        incident.setDescription(incidentDTO.getDescription());
        incident.setSeverity(incidentDTO.getSeverity());
        incident.setPriority(incidentDTO.getPriority());
        incident.setCategory(incidentDTO.getCategory());
        incident.setSource(incidentDTO.getSource());
        incident.setAffectedComponent(incidentDTO.getAffectedComponent());
        return IncidentDTO.fromIncident(incidentRepository.save(incident));
    }

    public List<IncidentDTO> getAllIncidents() {
        return IncidentDTO.fromIncidents(incidentRepository.findAll());
    }

    public IncidentDTO getIncidentById(Long id) {
        return IncidentDTO.fromIncident(incidentRepository.findById(id).orElse(null));
    }

    public IncidentDTO updateIncident(Long id, IncidentDTO incidentDTO) {
        Incident incident = incidentRepository.findById(id).orElse(null);
        if (incident == null) throw new RuntimeException("Incident not found");

        incident.setTitle(incidentDTO.getTitle());
        incident.setDescription(incidentDTO.getDescription());
        incident.setSeverity(incidentDTO.getSeverity());
        incident.setPriority(incidentDTO.getPriority());
        incident.setCategory(incidentDTO.getCategory());
        incident.setSource(incidentDTO.getSource());
        incident.setAffectedComponent(incidentDTO.getAffectedComponent());
        return IncidentDTO.fromIncident(incidentRepository.save(incident));
    }
}