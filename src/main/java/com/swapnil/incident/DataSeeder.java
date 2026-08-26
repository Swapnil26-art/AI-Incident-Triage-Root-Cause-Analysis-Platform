package com.swapnil.incident;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.swapnil.incident.auth.User;
import com.swapnil.incident.auth.UserRepository;
import com.swapnil.incident.oncall.OnCallSchedule;
import com.swapnil.incident.oncall.OnCallScheduleRepository;
import com.swapnil.incident.servicemap.ServiceDependency;
import com.swapnil.incident.servicemap.ServiceDependencyRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OnCallScheduleRepository onCallRepository;

    @Autowired
    private ServiceDependencyRepository serviceDependencyRepository;

    private final Random random = new Random();

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) seedUsers();
        if (incidentRepository.count() == 0) seedIncidents();
        if (onCallRepository.count() == 0) seedOnCall();
        if (serviceDependencyRepository.count() == 0) seedServiceMap();
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

            Log seedLog = new Log();
            seedLog.setIncident(incident);
            seedLog.setTimestamp(incident.getCreatedAt());
            seedLog.setAuthor("system");
            seedLog.setMessage("Incident created via " + data[4] + " source");
            incident.getLogs().add(seedLog);

            incidentRepository.save(incident);
        }
    }

    private void seedOnCall() {
        OnCallSchedule current = new OnCallSchedule();
        current.setUsername("admin");
        current.setRole("PRIMARY");
        current.setStartTime(LocalDateTime.now().minusHours(6));
        current.setEndTime(LocalDateTime.now().plusHours(18));
        current.setCreatedAt(LocalDateTime.now().minusHours(24));
        onCallRepository.save(current);

        OnCallSchedule secondary = new OnCallSchedule();
        secondary.setUsername("engineer");
        secondary.setRole("SECONDARY");
        secondary.setStartTime(LocalDateTime.now().plusHours(18));
        secondary.setEndTime(LocalDateTime.now().plusHours(42));
        secondary.setCreatedAt(LocalDateTime.now().minusHours(24));
        onCallRepository.save(secondary);

        OnCallSchedule past = new OnCallSchedule();
        past.setUsername("engineer");
        past.setRole("PRIMARY");
        past.setStartTime(LocalDateTime.now().minusHours(30));
        past.setEndTime(LocalDateTime.now().minusHours(6));
        past.setCreatedAt(LocalDateTime.now().minusHours(48));
        onCallRepository.save(past);
    }

    private void seedServiceMap() {
        Object[][] deps = {
                {"API Gateway", "Payment Service", "sync", "Primary payment processing", 45, 2.1},
                {"API Gateway", "Order Service", "sync", "Order management", 30, 1.5},
                {"API Gateway", "User Service", "sync", "User authentication", 20, 0.8},
                {"API Gateway", "Search Service", "sync", "Product search", 120, 3.2},
                {"Payment Service", "PostgreSQL Primary", "sync", "Transaction data", 15, 0.5},
                {"Payment Service", "Redis Cluster", "cache", "Session & rate limiting", 5, 0.2},
                {"Order Service", "PostgreSQL Primary", "sync", "Order persistence", 18, 0.8},
                {"Order Service", "Redis Cluster", "cache", "Order cache", 5, 0.3},
                {"Order Service", "Email Service", "async", "Order confirmation emails", 200, 1.0},
                {"User Service", "PostgreSQL Primary", "sync", "User data", 12, 0.4},
                {"User Service", "SSO Service", "sync", "Authentication", 35, 1.8},
                {"SSO Service", "JWT Service", "sync", "Token validation", 8, 0.1},
                {"Search Service", "ElasticSearch", "sync", "Full-text search", 80, 2.5},
                {"Email Service", "SMTP Gateway", "async", "Email delivery", 500, 0.5},
                {"CI/CD Pipeline", "API Gateway", "sync", "Deployment health checks", 60, 0.0},
                {"K8s Cluster", "API Gateway", "infra", "Container orchestration", 2, 0.1},
                {"K8s Cluster", "PostgreSQL Primary", "infra", "Database hosting", 2, 0.1},
                {"K8s Cluster", "Redis Cluster", "infra", "Cache hosting", 2, 0.1},
                {"Load Balancer", "API Gateway", "infra", "Traffic routing", 1, 0.2},
                {"Load Balancer", "K8s Cluster", "infra", "Service discovery", 3, 0.1},
                {"Core Router 01", "Load Balancer", "infra", "Network backbone", 1, 0.3},
                {"Firewall Cluster", "Core Router 01", "infra", "Security perimeter", 5, 0.4},
                {"CDN Cache Invalidation", "Search Service", "async", "Cache invalidation", 300, 1.2},
                {"Log Pipeline", "ElasticSearch", "async", "Log aggregation", 900, 0.8},
                {"Analytics DB", "PostgreSQL Primary", "sync", "Data warehousing", 120, 2.0},
        };

        for (Object[] dep : deps) {
            ServiceDependency d = new ServiceDependency();
            d.setSourceService((String) dep[0]);
            d.setTargetService((String) dep[1]);
            d.setDependencyType((String) dep[2]);
            d.setDescription((String) dep[3]);
            d.setLatencyMs((Integer) dep[4]);
            d.setErrorRate((Double) dep[5]);
            serviceDependencyRepository.save(d);
        }
    }
}
