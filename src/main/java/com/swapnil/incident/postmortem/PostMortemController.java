package com.swapnil.incident.postmortem;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.swapnil.incident.Incident;
import com.swapnil.incident.IncidentRepository;
import com.swapnil.incident.Log;

@RestController
@RequestMapping("/api/incidents")
public class PostMortemController {

    @Autowired
    private IncidentRepository incidentRepository;

    @GetMapping("/{id}/postmortem")
    @Transactional
    public ResponseEntity<?> generatePostMortem(@PathVariable Long id) {
        return incidentRepository.findById(id).map(incident -> {
            Map<String, Object> report = new LinkedHashMap<>();
            report.put("incident_id", incident.getId());
            report.put("ticket_number", incident.getTicketNumber());
            report.put("title", incident.getTitle());
            report.put("generated_at", LocalDateTime.now().toString());

            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("severity", incident.getSeverity().name());
            summary.put("category", incident.getCategory().name());
            summary.put("status", incident.getStatus().name());
            summary.put("affected_component", incident.getAffectedComponent());
            summary.put("source", incident.getSource());
            summary.put("assigned_to", incident.getAssignedTo() != null ? incident.getAssignedTo() : "Unassigned");
            report.put("summary", summary);

            Map<String, Object> timeline = new LinkedHashMap<>();
            timeline.put("created", incident.getCreatedAt() != null ? incident.getCreatedAt().toString() : "N/A");
            timeline.put("resolved", incident.getResolvedAt() != null ? incident.getResolvedAt().toString() : "N/A");

            if (incident.getCreatedAt() != null && incident.getResolvedAt() != null) {
                long minutes = ChronoUnit.MINUTES.between(incident.getCreatedAt(), incident.getResolvedAt());
                long hours = minutes / 60;
                long mins = minutes % 60;
                timeline.put("duration", hours + "h " + mins + "m (" + minutes + " minutes)");
                timeline.put("duration_minutes", minutes);
            } else if (incident.getCreatedAt() != null) {
                long minutes = ChronoUnit.MINUTES.between(incident.getCreatedAt(), LocalDateTime.now());
                long hours = minutes / 60;
                long mins = minutes % 60;
                timeline.put("duration", "Ongoing — " + hours + "h " + mins + "m (" + minutes + " minutes)");
                timeline.put("duration_minutes", minutes);
            }
            report.put("timeline", timeline);

            if (incident.getAiRootCause() != null) {
                Map<String, Object> ai = new LinkedHashMap<>();
                ai.put("root_cause", incident.getAiRootCause());
                ai.put("suggested_actions", incident.getAiSuggestedActions());
                ai.put("confidence_score", incident.getAiConfidenceScore());
                report.put("ai_analysis", ai);
            }

            if (incident.getLogs() != null) {
                java.util.List<Map<String, Object>> activityLog = incident.getLogs().stream().map(log -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("timestamp", log.getTimestamp() != null ? log.getTimestamp().toString() : "N/A");
                    entry.put("author", log.getAuthor());
                    entry.put("message", log.getMessage());
                    return entry;
                }).collect(java.util.stream.Collectors.toList());
                report.put("activity_log", activityLog);
            }

            report.put("description", incident.getDescription());

            Map<String, Object> actionItems = new LinkedHashMap<>();
            if (incident.getSeverity() == Incident.Severity.P1 || incident.getSeverity() == Incident.Severity.P2) {
                actionItems.put("post_mortem_required", true);
                actionItems.put("review_deadline", "Within 48 hours");
                actionItems.put("stakeholders", "Engineering Lead, SRE, Product Manager");
            } else {
                actionItems.put("post_mortem_required", false);
                actionItems.put("review_deadline", "Within 1 week");
                actionItems.put("stakeholders", "Engineering Lead");
            }
            actionItems.put("prevention_improvements", "Review monitoring gaps, update runbooks, consider automation");
            report.put("action_items", actionItems);

            String markdown = generateMarkdown(incident);
            report.put("markdown", markdown);

            return ResponseEntity.ok(report);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private String generateMarkdown(Incident incident) {
        StringBuilder md = new StringBuilder();
        md.append("# Post-Mortem Report\n\n");
        md.append("## Incident: ").append(incident.getTicketNumber()).append(" — ").append(incident.getTitle()).append("\n\n");
        md.append("| Field | Value |\n|---|---|\n");
        md.append("| **Severity** | ").append(incident.getSeverity().name()).append(" |\n");
        md.append("| **Category** | ").append(incident.getCategory().name()).append(" |\n");
        md.append("| **Status** | ").append(incident.getStatus().name()).append(" |\n");
        md.append("| **Component** | ").append(incident.getAffectedComponent()).append(" |\n");
        md.append("| **Assigned To** | ").append(incident.getAssignedTo() != null ? incident.getAssignedTo() : "Unassigned").append(" |\n");
        md.append("| **Created** | ").append(incident.getCreatedAt() != null ? incident.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "N/A").append(" |\n");
        md.append("| **Resolved** | ").append(incident.getResolvedAt() != null ? incident.getResolvedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "Ongoing").append(" |\n\n");

        md.append("## Description\n\n").append(incident.getDescription()).append("\n\n");

        if (incident.getAiRootCause() != null) {
            md.append("## AI Root Cause Analysis\n\n").append(incident.getAiRootCause()).append("\n\n");
            if (incident.getAiConfidenceScore() != null) {
                md.append("**Confidence:** ").append(String.format("%.1f%%", incident.getAiConfidenceScore() * 100)).append("\n\n");
            }
        }

        if (incident.getAiSuggestedActions() != null) {
            md.append("## Suggested Actions\n\n").append(incident.getAiSuggestedActions()).append("\n\n");
        }

        if (incident.getLogs() != null && !incident.getLogs().isEmpty()) {
            md.append("## Activity Log\n\n");
            md.append("| Time | Author | Message |\n|---|---|---|\n");
            for (Log log : incident.getLogs()) {
                md.append("| ").append(log.getTimestamp() != null ? log.getTimestamp().format(DateTimeFormatter.ofPattern("MM-dd HH:mm")) : "N/A")
                  .append(" | ").append(log.getAuthor() != null ? log.getAuthor() : "system")
                  .append(" | ").append(log.getMessage()).append(" |\n");
            }
            md.append("\n");
        }

        if (incident.getSeverity() == Incident.Severity.P1 || incident.getSeverity() == Incident.Severity.P2) {
            md.append("## Action Items\n\n");
            md.append("- [ ] Complete post-mortem review within 48 hours\n");
            md.append("- [ ] Update runbooks based on findings\n");
            md.append("- [ ] Review monitoring gaps\n");
            md.append("- [ ] Schedule prevention improvement tasks\n\n");
        }

        md.append("---\n*Generated by AI Incident Triage Platform*\n");
        return md.toString();
    }
}
