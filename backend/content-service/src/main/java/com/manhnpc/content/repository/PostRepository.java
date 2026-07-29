package com.manhnpc.content.repository;

import com.manhnpc.content.model.Post;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    Optional<Post> findBySlug(String slug);

    List<Post> findByPublishedTrueOrderByCreatedAtDesc();
}
