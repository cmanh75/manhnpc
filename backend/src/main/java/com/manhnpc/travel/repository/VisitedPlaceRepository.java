package com.manhnpc.travel.repository;

import com.manhnpc.travel.model.VisitedPlace;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitedPlaceRepository extends JpaRepository<VisitedPlace, Long> {

    List<VisitedPlace> findAllByOrderByVisitedAtAsc();
}
