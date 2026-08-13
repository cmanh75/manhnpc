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
        socials.put("github", "https://github.com/cmanh75");
        socials.put("linkedin", "https://www.linkedin.com/in/cmanh75/");
        socials.put("email", "npcm752004t2k29@gmail.com");

        Map<String, Integer> stats = new LinkedHashMap<>();
        stats.put("yearsOfExperience", 1);
        stats.put("projectsCompleted", 3);
        stats.put("countriesVisited", 9);
        stats.put("cupsOfCoffee", 9999);

        return new ProfileResponse(
                "Nguyen Phi Cuong Manh",
                "manhnpc",
                "Junior Software Engineer",
                "Viettel Software",
                "Hanoi, Vietnam",
                "I build software and keep the moments around it. This is my personal universe — "
                        + "a self-hosted home for my photos, journeys, writing, and the things I create along the way.",
                List.of("Java", "Spring Boot", "Python", "FastAPI", "ReactJS", "WebSocket",
                        "PostgreSQL", "MariaDB", "Docker", "Git", "C", "C++"),
                socials,
                stats);
    }
}
