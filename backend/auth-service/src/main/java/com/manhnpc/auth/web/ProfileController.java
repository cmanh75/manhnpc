package com.manhnpc.auth.web;

import com.manhnpc.auth.web.dto.AuthDtos.ProfileResponse;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProfileController {

    @GetMapping("/api/profile")
    public ProfileResponse profile() {
        Map<String, String> socials = new LinkedHashMap<>();
        socials.put("github", "https://github.com/manhnpc");
        socials.put("linkedin", "https://www.linkedin.com/in/manhnpc");
        socials.put("email", "khanhnd75@viettel.com.vn");

        Map<String, Integer> stats = new LinkedHashMap<>();
        stats.put("yearsOfExperience", 5);
        stats.put("projectsCompleted", 20);
        stats.put("countriesVisited", 9);
        stats.put("cupsOfCoffee", 9999);

        return new ProfileResponse(
                "Nguyễn Đình Khánh",
                "manhnpc",
                "Software Engineer",
                "Viettel",
                "Hanoi, Vietnam",
                "Backend engineer who ships distributed systems by day and tends a digital garden by night. "
                        + "I spend most of my time taming microservices, event streams, and the occasional memory leak. "
                        + "When the deploy is green, you will find me chasing street food and new stamps for my passport.",
                List.of("Java", "Spring Boot", "Microservices", "Kafka", "React", "TypeScript",
                        "Docker", "Kubernetes", "PostgreSQL", "Redis", "AWS", "CI/CD"),
                socials,
                stats);
    }
}
