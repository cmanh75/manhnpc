package com.manhnpc.media.repository;

import com.manhnpc.media.model.Photo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhotoRepository extends JpaRepository<Photo, Long> {

    List<Photo> findByCategoryIgnoreCaseOrderByTakenAtDesc(String category);

    List<Photo> findAllByOrderByTakenAtDesc();
}
