package com.manhnpc.audit.repository;

import com.manhnpc.audit.model.VisitLog;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface VisitLogRepository extends JpaRepository<VisitLog, Long> {

    Page<VisitLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<VisitLog> findByCreatedAtAfter(LocalDateTime after);

    @Query("SELECT COUNT(DISTINCT v.ipAddress) FROM VisitLog v")
    long countDistinctIpAddress();

    long countByCreatedAtAfter(LocalDateTime after);
}
