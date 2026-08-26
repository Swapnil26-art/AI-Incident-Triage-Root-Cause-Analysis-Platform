package com.swapnil.incident.oncall;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OnCallScheduleRepository extends JpaRepository<OnCallSchedule, Long> {
    List<OnCallSchedule> findByUsername(String username);
    Optional<OnCallSchedule> findByStartTimeBeforeAndEndTimeAfter(java.time.LocalDateTime time);
    List<OnCallSchedule> findByStartTimeBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}
