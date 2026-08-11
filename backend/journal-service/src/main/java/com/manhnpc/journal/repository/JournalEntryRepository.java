package com.manhnpc.journal.repository;

import com.manhnpc.journal.model.JournalEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    List<JournalEntry> findAllByOrderByEntryDateDescIdDesc();
}
