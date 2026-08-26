package com.swapnil.incident.servicemap;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceDependencyRepository extends JpaRepository<ServiceDependency, Long> {
    List<ServiceDependency> findBySourceService(String sourceService);
    List<ServiceDependency> findByTargetService(String targetService);
}
