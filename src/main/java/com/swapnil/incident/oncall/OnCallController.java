package com.swapnil.incident.oncall;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/oncall")
public class OnCallController {

    @Autowired
    private OnCallScheduleRepository repository;

    @GetMapping
    public ResponseEntity<List<OnCallSchedule>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentOnCall() {
        Optional<OnCallSchedule> current = repository.findByStartTimeBeforeAndEndTimeAfter(LocalDateTime.now());
        if (current.isEmpty()) {
            return ResponseEntity.ok(Map.of("active", false, "message", "No one is currently on call"));
        }
        OnCallSchedule schedule = current.get();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("active", true);
        result.put("id", schedule.getId());
        result.put("username", schedule.getUsername());
        result.put("role", schedule.getRole());
        result.put("startTime", schedule.getStartTime().toString());
        result.put("endTime", schedule.getEndTime().toString());
        result.put("hoursRemaining", java.time.temporal.ChronoUnit.HOURS.between(LocalDateTime.now(), schedule.getEndTime()));
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createSchedule(@RequestBody Map<String, Object> body) {
        String username = (String) body.get("username");
        String role = (String) body.getOrDefault("role", "PRIMARY");
        String startStr = (String) body.get("startTime");
        String endStr = (String) body.get("endTime");

        if (username == null || startStr == null || endStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "username, startTime, endTime are required"));
        }

        OnCallSchedule schedule = new OnCallSchedule();
        schedule.setUsername(username);
        schedule.setRole(role);
        schedule.setStartTime(LocalDateTime.parse(startStr));
        schedule.setEndTime(LocalDateTime.parse(endStr));
        schedule.setCreatedAt(LocalDateTime.now());

        return ResponseEntity.ok(repository.save(schedule));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSchedule(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
