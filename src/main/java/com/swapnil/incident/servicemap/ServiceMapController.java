package com.swapnil.incident.servicemap;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/service-map")
public class ServiceMapController {

    @Autowired
    private ServiceDependencyRepository repository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getServiceGraph() {
        List<ServiceDependency> deps = repository.findAll();

        Set<String> services = new LinkedHashSet<>();
        deps.forEach(d -> {
            services.add(d.getSourceService());
            services.add(d.getTargetService());
        });

        List<Map<String, Object>> nodes = services.stream().map(name -> {
            long outgoing = deps.stream().filter(d -> d.getSourceService().equals(name)).count();
            long incoming = deps.stream().filter(d -> d.getTargetService().equals(name)).count();
            boolean healthy = deps.stream()
                    .filter(d -> d.getSourceService().equals(name) || d.getTargetService().equals(name))
                    .allMatch(d -> d.getErrorRate() == null || d.getErrorRate() < 5.0);
            return Map.of(
                    "id", name,
                    "outgoing", outgoing,
                    "incoming", incoming,
                    "healthy", healthy
            );
        }).collect(Collectors.toList());

        List<Map<String, Object>> edges = deps.stream().map(d -> {
            Map<String, Object> edge = new LinkedHashMap<>();
            edge.put("source", d.getSourceService());
            edge.put("target", d.getTargetService());
            edge.put("type", d.getDependencyType());
            edge.put("latencyMs", d.getLatencyMs());
            edge.put("errorRate", d.getErrorRate());
            edge.put("description", d.getDescription());
            return edge;
        }).collect(Collectors.toList());

        Map<String, Object> graph = new LinkedHashMap<>();
        graph.put("nodes", nodes);
        graph.put("edges", edges);
        graph.put("totalServices", services.size());
        graph.put("totalDependencies", deps.size());
        return ResponseEntity.ok(graph);
    }

    @PostMapping
    public ResponseEntity<ServiceDependency> addDependency(@RequestBody ServiceDependency dep) {
        return ResponseEntity.ok(repository.save(dep));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDependency(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
