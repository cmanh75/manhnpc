package com.manhnpc.guestbook.repository;

import com.manhnpc.guestbook.model.GuestEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestEntryRepository extends JpaRepository<GuestEntry, Long> {

    List<GuestEntry> findTop200ByOrderByCreatedAtDesc();
}
