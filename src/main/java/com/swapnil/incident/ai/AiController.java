package com.swapnil.incident.ai;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.swapnil.incident.Incident;
import com.swapnil.incident.IncidentRepository;
import com.swapnil.incident.Log;
import com.swapnil.incident.websocket.IncidentEventHandler;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private IncidentEventHandler eventHandler;

    private final Random random = new Random();

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> request) {
        String message = (String) request.getOrDefault("message", "");
        String response = generateChatResponse(message);
        return ResponseEntity.ok(Map.of("response", response));
    }

    private String generateChatResponse(String message) {
        String q = message.toLowerCase();

        if (q.contains("critical") || q.contains("p1") || q.contains("urgent")) {
            var p1 = incidentRepository.findBySeverity(Incident.Severity.P1);
            if (p1.isEmpty()) return "There are currently no P1 critical incidents. The infrastructure appears healthy.";
            StringBuilder sb = new StringBuilder("**P1 Critical Incidents (" + p1.size() + "):**\n\n");
            for (var inc : p1) {
                sb.append("- **").append(inc.getTicketNumber()).append("**: ").append(inc.getTitle())
                  .append("\n  Component: ").append(inc.getAffectedComponent())
                  .append(" | Status: ").append(inc.getStatus()).append("\n\n");
            }
            sb.append("**Recommendation:** Focus on the oldest P1 incident first. Escalate if investigation has been ongoing for more than 2 hours.");
            return sb.toString();
        }

        if (q.contains("open") || q.contains("outstanding")) {
            var open = incidentRepository.findByStatus(Incident.Status.OPEN);
            StringBuilder sb = new StringBuilder("**Open Incidents Summary (" + open.size() + "):**\n\n");
            for (var inc : open) {
                sb.append("- **").append(inc.getTicketNumber()).append("** (").append(inc.getSeverity())
                  .append(") - ").append(inc.getAffectedComponent()).append(": ").append(inc.getTitle()).append("\n");
            }
            sb.append("\n**Priority:** Address P1/P2 incidents before they escalate.");
            return sb.toString();
        }

        if (q.contains("network")) {
            var net = incidentRepository.findByCategory(Incident.Category.NETWORK);
            StringBuilder sb = new StringBuilder("**Network Incidents (" + net.size() + "):**\n\n");
            for (var inc : net) {
                sb.append("- **").append(inc.getTicketNumber()).append("** (").append(inc.getSeverity())
                  .append(") - ").append(inc.getStatus()).append(": ").append(inc.getTitle()).append("\n");
            }
            return sb.toString();
        }

        if (q.contains("database") || q.contains("db")) {
            var db = incidentRepository.findByCategory(Incident.Category.DATABASE);
            StringBuilder sb = new StringBuilder("**Database Incidents (" + db.size() + "):**\n\n");
            for (var inc : db) {
                sb.append("- **").append(inc.getTicketNumber()).append("** (").append(inc.getSeverity())
                  .append(") - ").append(inc.getStatus()).append(": ").append(inc.getTitle()).append("\n");
            }
            return sb.toString();
        }

        if (q.contains("security") || q.contains("auth")) {
            var auth = incidentRepository.findByCategory(Incident.Category.AUTHENTICATION);
            StringBuilder sb = new StringBuilder("**Security/Auth Incidents (" + auth.size() + "):**\n\n");
            for (var inc : auth) {
                sb.append("- **").append(inc.getTicketNumber()).append("** (").append(inc.getSeverity())
                  .append(") - ").append(inc.getStatus()).append(": ").append(inc.getTitle()).append("\n");
            }
            return sb.toString();
        }

        if (q.contains("resolved") || q.contains("closed")) {
            var resolved = incidentRepository.findByStatus(Incident.Status.RESOLVED);
            var closed = incidentRepository.findByStatus(Incident.Status.CLOSED);
            int total = resolved.size() + closed.size();
            return "**Resolved/Closed Incidents (" + total + "):**\n\n" +
                   "- Resolved: " + resolved.size() + "\n" +
                   "- Closed: " + closed.size() + "\n\n" +
                   "**Insights:** " + (total > 0 ? "Your team is resolving incidents effectively." : "No resolved incidents yet — keep investigating!");
        }

        if (q.contains("runbook") || q.contains("playbook")) {
            return "**Incident Response Runbook:**\n\n" +
                "**Step 1: Triage**\n- Confirm the incident is valid\n- Determine severity\n- Assign an owner\n\n" +
                "**Step 2: Investigate**\n- Check monitoring dashboards\n- Review recent deployments\n- Examine logs\n\n" +
                "**Step 3: Mitigate**\n- Rollback if recent deployment caused it\n- Scale up if under load\n- Enable circuit breakers\n\n" +
                "**Step 4: Resolve**\n- Implement the fix\n- Verify in production\n- Monitor for 30 minutes\n\n" +
                "**Step 5: Document**\n- Update with root cause\n- Create post-mortem if P1/P2";
        }

        if (q.contains("sla") || q.contains("compliance")) {
            long total = incidentRepository.count();
            long p1Count = incidentRepository.countBySeverity(Incident.Severity.P1);
            long resolved = incidentRepository.countByStatus(Incident.Status.RESOLVED);
            long escalated = incidentRepository.countByStatus(Incident.Status.ESCALATED);
            return "**SLA Compliance Report:**\n\n" +
                   "- Total incidents: " + total + "\n" +
                   "- P1 Critical: " + p1Count + "\n" +
                   "- Resolved: " + resolved + "\n" +
                   "- Escalated: " + escalated + "\n\n" +
                   "**SLA Targets:**\n" +
                   "- P1: Resolve within 2 hours\n" +
                   "- P2: Resolve within 4 hours\n" +
                   "- P3: Resolve within 8 hours\n" +
                   "- P4: Resolve within 48 hours";
        }

        if (q.contains("trend") || q.contains("pattern")) {
            long total = incidentRepository.count();
            var network = incidentRepository.findByCategory(Incident.Category.NETWORK);
            var app = incidentRepository.findByCategory(Incident.Category.APPLICATION);
            var db = incidentRepository.findByCategory(Incident.Category.DATABASE);
            return "**Incident Trends:**\n\n" +
                   "- Total incidents: " + total + "\n" +
                   "- Network: " + network.size() + "\n" +
                   "- Application: " + app.size() + "\n" +
                   "- Database: " + db.size() + "\n\n" +
                   "**Tip:** Network and Database incidents tend to have the highest blast radius. Consider adding redundancy.";
        }

        long total = incidentRepository.count();
        return "I can help you analyze your " + total + " incidents. Try asking about:\n\n" +
            "- Critical/P1 incidents\n" +
            "- Open incidents\n" +
            "- Network/Database/Security issues\n" +
            "- SLA compliance\n" +
            "- Trends and patterns\n" +
            "- Runbooks and playbooks";
    }

    @PostMapping("/analyze/{id}")
    public ResponseEntity<?> analyzeIncident(@PathVariable Long id) {
        return incidentRepository.findById(id).map(incident -> {
            Map<String, Object> analysis = performSimulatedAnalysis(incident);

            incident.setAiRootCause((String) analysis.get("root_cause"));
            incident.setAiSuggestedActions((String) analysis.get("suggested_actions"));
            incident.setAiConfidenceScore((Double) analysis.get("confidence_score"));
            incident.setStatus(Incident.Status.AI_ANALYZED);
            incident.setUpdatedAt(LocalDateTime.now());

            Log aiLog = new Log();
            aiLog.setIncident(incident);
            aiLog.setTimestamp(LocalDateTime.now());
            aiLog.setAuthor("AI-ANALYSIS");
            aiLog.setMessage("AI Analysis completed. Confidence: " + String.format("%.1f%%", (Double) analysis.get("confidence_score") * 100));
            incident.getLogs().add(aiLog);

            Incident saved = incidentRepository.save(incident);
            eventHandler.broadcastIncidentUpdate(saved, "AI_ANALYZED");
            eventHandler.broadcastDashboardUpdate();

            return ResponseEntity.ok(analysis);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/analyze/{id}")
    public ResponseEntity<?> getAnalysis(@PathVariable Long id) {
        return incidentRepository.findById(id).map(incident -> {
            Map<String, Object> analysis = new LinkedHashMap<>();
            analysis.put("incident_id", incident.getId());
            analysis.put("ticket_number", incident.getTicketNumber());
            analysis.put("root_cause", incident.getAiRootCause());
            analysis.put("suggested_actions", incident.getAiSuggestedActions());
            analysis.put("confidence_score", incident.getAiConfidenceScore());
            analysis.put("analyzed", incident.getAiRootCause() != null);
            return ResponseEntity.ok(analysis);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private Map<String, Object> performSimulatedAnalysis(Incident incident) {
        Map<String, Object> analysis = new LinkedHashMap<>();
        analysis.put("incident_id", incident.getId());
        analysis.put("ticket_number", incident.getTicketNumber());

        String rootCause = generateRootCause(incident);
        String suggestedActions = generateSuggestedActions(incident);
        double confidence = 0.70 + (random.nextDouble() * 0.28);

        analysis.put("root_cause", rootCause);
        analysis.put("suggested_actions", suggestedActions);
        analysis.put("confidence_score", Math.round(confidence * 100.0) / 100.0);
        analysis.put("severity_assessment", assessSeverity(incident));
        analysis.put("similar_incidents_count", random.nextInt(15) + 1);
        analysis.put("estimated_resolution_time", estimateResolutionTime(incident));
        analysis.put("analyzed_at", LocalDateTime.now().toString());

        return analysis;
    }

    private String generateRootCause(Incident incident) {
        Map<Incident.Category, List<String>> causes = new HashMap<>();
        causes.put(Incident.Category.NETWORK, List.of(
                "DNS resolution failure due to upstream resolver timeout",
                "BGP route flapping causing intermittent connectivity loss",
                "Network interface buffer overflow due to traffic spike",
                "STP topology change causing bridge loop on VLAN 100",
                "MTU mismatch between core and distribution switches"
        ));
        causes.put(Incident.Category.APPLICATION, List.of(
                "Memory leak in connection pool causing OOM after 48h uptime",
                "Race condition in session management module",
                "Unhandled exception in async task queue processor",
                "Stale cache serving outdated data after deployment"
        ));
        causes.put(Incident.Category.DATABASE, List.of(
                "Deadlock detected in transaction involving orders and inventory tables",
                "Missing index on high-frequency query causing full table scan",
                "Replication lag exceeding threshold due to large batch insert",
                "Connection pool exhaustion from unclosed prepared statements"
        ));
        causes.put(Incident.Category.API, List.of(
                "Rate limiter misconfiguration blocking legitimate traffic",
                "Certificate expiry on internal service mesh gateway",
                "Timeout cascade from slow downstream dependency",
                "Schema validation mismatch in v2 API endpoint"
        ));
        causes.put(Incident.Category.AUTHENTICATION, List.of(
                "JWT token expiry not handled gracefully by client",
                "OAuth2 refresh token rotation failure",
                "LDAP bind failure due to expired service account credentials"
        ));
        causes.put(Incident.Category.INFRASTRUCTURE, List.of(
                "Disk space exhaustion on log volume reaching 98% utilization",
                "Kubernetes pod eviction due to node memory pressure",
                "Load balancer health check endpoint returning 503",
                "TLS certificate auto-renewal failing due to DNS validation timeout"
        ));
        causes.put(Incident.Category.OTHER, List.of(
                "Configuration drift between staging and production environments",
                "Third-party service degradation affecting downstream integrations"
        ));

        List<String> categoryCauses = causes.getOrDefault(incident.getCategory(),
                List.of("Unable to determine root cause from available data"));
        return categoryCauses.get(random.nextInt(categoryCauses.size()));
    }

    private String generateSuggestedActions(Incident incident) {
        Map<Incident.Category, List<String>> actions = new HashMap<>();
        actions.put(Incident.Category.NETWORK, List.of(
                "1. Verify DNS resolver health and failover configuration",
                "2. Check BGP peer stability and route advertisements",
                "3. Review interface error counters on affected switches",
                "4. Validate MTU settings across the path"
        ));
        actions.put(Incident.Category.APPLICATION, List.of(
                "1. Review heap dump for memory leak patterns",
                "2. Check thread pool utilization and queue depth",
                "3. Verify async task processing pipeline health",
                "4. Invalidate cache and monitor recovery"
        ));
        actions.put(Incident.Category.DATABASE, List.of(
                "1. Analyze deadlock logs and optimize transaction ordering",
                "2. Add recommended indexes and run ANALYZE",
                "3. Check replication lag and optimize batch operations",
                "4. Tune connection pool settings (max-active, timeout)"
        ));
        actions.put(Incident.Category.API, List.of(
                "1. Review rate limiter configuration per endpoint",
                "2. Check certificate expiration dates across all services",
                "3. Implement circuit breaker for slow dependencies",
                "4. Validate API schema compatibility"
        ));
        actions.put(Incident.Category.AUTHENTICATION, List.of(
                "1. Implement token refresh middleware on client",
                "2. Verify OAuth2 provider token rotation settings",
                "3. Update service account credentials in vault"
        ));
        actions.put(Incident.Category.INFRASTRUCTURE, List.of(
                "1. Clean up log rotation and set retention policies",
                "2. Review pod resource limits and node capacity",
                "3. Verify load balancer health check configuration",
                "4. Check cert-manager logs for renewal failures"
        ));
        actions.put(Incident.Category.OTHER, List.of(
                "1. Sync configuration between environments",
                "2. Contact third-party vendor support"
        ));

        List<String> categoryActions = actions.getOrDefault(incident.getCategory(),
                List.of("1. Gather more information about the incident"));
        return String.join("\n", categoryActions);
    }

    private String assessSeverity(Incident incident) {
        if (incident.getSeverity() == Incident.Severity.P1) {
            return "CRITICAL — Immediate attention required. Multiple systems potentially affected.";
        } else if (incident.getSeverity() == Incident.Severity.P2) {
            return "HIGH — Significant impact on service availability. Escalation recommended.";
        } else if (incident.getSeverity() == Incident.Severity.P3) {
            return "MODERATE — Limited impact. Can be resolved within standard SLA.";
        }
        return "LOW — Minimal impact. Schedule for next maintenance window.";
    }

    private String estimateResolutionTime(Incident incident) {
        return switch (incident.getSeverity()) {
            case P1 -> "1-2 hours";
            case P2 -> "2-4 hours";
            case P3 -> "4-8 hours";
            case P4 -> "1-2 business days";
        };
    }
}
