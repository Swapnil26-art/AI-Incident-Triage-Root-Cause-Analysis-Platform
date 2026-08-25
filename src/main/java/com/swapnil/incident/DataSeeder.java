package com.swapnil.incident;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.swapnil.incident.auth.User;
import com.swapnil.incident.auth.UserRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final Random random = new Random();

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            seedUsers();
        }
        if (incidentRepository.count() == 0) {
            seedIncidents();
        }
    }

    private void seedUsers() {
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(User.Role.ROLE_ADMIN);
        admin.setEnabled(true);
        userRepository.save(admin);

        User engineer = new User();
        engineer.setUsername("engineer");
        engineer.setPassword(passwordEncoder.encode("engineer123"));
        engineer.setRole(User.Role.ROLE_ENGINEER);
        engineer.setEnabled(true);
        userRepository.save(engineer);

        User viewer = new User();
        viewer.setUsername("viewer");
        viewer.setPassword(passwordEncoder.encode("viewer123"));
        viewer.setRole(User.Role.ROLE_VIEWER);
        viewer.setEnabled(true);
        userRepository.save(viewer);
    }

    private void seedIncidents() {
        String[][] incidents = {
                {"P1", "HIGH", "NETWORK", "OPEN", "Monitoring Alert", "Core Router 01",
                 "BGP session flap detected on core router causing 40% packet loss across east-coast datacenter"},
                {"P1", "HIGH", "DATABASE", "INVESTIGATING", "Automated", "TiDB Cluster",
                 "TiDB cluster showing replication lag >30s, write throughput degraded by 60%"},
                {"P2", "HIGH", "APPLICATION", "OPEN", "User Report", "Payment Service",
                 "Payment processing timeout errors spiking, ~15% of transactions failing with 504"},
                {"P2", "MEDIUM", "API", "AI_ANALYZED", "Automated", "Gateway Service",
                 "API gateway returning 429 rate limit errors for partner integrations"},
                {"P2", "HIGH", "AUTHENTICATION", "INVESTIGATING", "User Report", "SSO Service",
                 "SSO login failures for 200+ users, SAML assertion validation errors in logs"},
                {"P3", "MEDIUM", "INFRASTRUCTURE", "RESOLVED", "Automated", "K8s Cluster",
                 "Kubernetes node pool running at 92% memory, multiple pod evictions observed"},
                {"P3", "MEDIUM", "NETWORK", "OPEN", "User Report", "VPN Gateway",
                 "Remote users experiencing intermittent VPN disconnections to EU region"},
                {"P3", "LOW", "APPLICATION", "WAITING_APPROVAL", "Monitoring Alert", "Search Service",
                 "ElasticSearch index shard relocation causing temporary search result gaps"},
                {"P3", "MEDIUM", "DATABASE", "INVESTIGATING", "Automated", "PostgreSQL Primary",
                 "Slow query log showing 200+ queries exceeding 5s threshold on orders table"},
                {"P4", "LOW", "INFRASTRUCTURE", "OPEN", "User Report", "Log Pipeline",
                 "Log aggregation pipeline 15 minutes behind, ELK stack resource utilization high"},
                {"P1", "HIGH", "NETWORK", "INVESTIGATING", "Monitoring Alert", "Firewall Cluster",
                 "State table overflow on primary firewall, failover to secondary triggered"},
                {"P2", "HIGH", "APPLICATION", "OPEN", "User Report", "Order Service",
                 "Order creation returning 500 errors for ~5% of requests since deployment v2.3.1"},
                {"P3", "MEDIUM", "API", "RESOLVED", "Automated", "REST API",
                 "GraphQL resolver N+1 query issue resolved with DataLoader implementation"},
                {"P2", "HIGH", "DATABASE", "AI_ANALYZED", "Monitoring Alert", "Redis Cluster",
                 "Redis cluster memory at 95%, eviction rate exceeding write throughput"},
                {"P3", "LOW", "AUTHENTICATION", "CLOSED", "User Report", "API Keys",
                 "Service-to-service API key rotation needed for 3 microservices by next sprint"},
                {"P4", "LOW", "INFRASTRUCTURE", "RESOLVED", "Automated", "CI/CD Pipeline",
                 "Jenkins agent disk full, cleaned workspace and increased volume size"},
                {"P1", "HIGH", "INFRASTRUCTURE", "ESCALATED", "Monitoring Alert", "Cloud Region",
                 "AWS us-east-1 availability zone experiencing elevated error rates across services"},
                {"P3", "MEDIUM", "APPLICATION", "OPEN", "User Report", "Email Service",
                 "Email delivery delays exceeding 30 minutes for transactional emails"},
                {"P2", "MEDIUM", "NETWORK", "INVESTIGATING", "Automated", "Load Balancer",
                 "ALB healthy host count dropping, target group health check failures on port 8443"},
                {"P3", "LOW", "DATABASE", "OPEN", "User Report", "Analytics DB",
                 "Analytics query timeouts on nightly aggregation jobs, warehouse resource contention"}
        };

        String[] assignees = {"admin", "engineer", null};

        for (int i = 0; i < incidents.length; i++) {
            String[] data = incidents[i];
            Incident incident = new Incident();
            incident.setTicketNumber("INC-" + String.format("%04d", i + 1));
            incident.setTitle(data[4] + " - " + data[5]);
            incident.setDescription(data[6]);
            incident.setSeverity(Incident.Severity.valueOf(data[0]));
            incident.setPriority(Incident.Priority.valueOf(data[1]));
            incident.setCategory(Incident.Category.valueOf(data[2]));
            incident.setStatus(Incident.Status.valueOf(data[3]));
            incident.setSource(data[4]);
            incident.setAffectedComponent(data[5]);
            incident.setAssignedTo(assignees[random.nextInt(assignees.length)]);
            incident.setCreatedAt(LocalDateTime.now().minusHours(random.nextInt(72) + 1));
            incident.setUpdatedAt(LocalDateTime.now().minusHours(random.nextInt(24)));

            if (incident.getStatus() == Incident.Status.RESOLVED || incident.getStatus() == Incident.Status.CLOSED) {
                incident.setResolvedAt(incident.getUpdatedAt());
            }

            if (incident.getStatus() == Incident.Status.AI_ANALYZED) {
                incident.setAiRootCause("Simulated root cause analysis for " + data[5] + " component");
                incident.setAiSuggestedActions("1. Review component health\n2. Check dependency status\n3. Verify configuration");
                incident.setAiConfidenceScore(0.75 + (random.nextDouble() * 0.20));
            }

            incidentRepository.save(incident);

            Log seedLog = new Log();
            seedLog.setIncident(incident);
            seedLog.setTimestamp(incident.getCreatedAt());
            seedLog.setAuthor("system");
            seedLog.setMessage("Incident created via " + data[4] + " source");
            incident.getLogs().add(seedLog);
            incidentRepository.save(incident);
        }
    }
}
