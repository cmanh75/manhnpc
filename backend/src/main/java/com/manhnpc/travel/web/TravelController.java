package com.manhnpc.travel.web;

import com.manhnpc.travel.model.VisitedPlace;
import com.manhnpc.travel.repository.VisitedPlaceRepository;
import com.manhnpc.common.web.error.NotFoundException;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/travel")
public class TravelController {

    public record TravelStats(long countries, long places, LocalDate firstTrip, LocalDate latestTrip) {
    }

    private final VisitedPlaceRepository places;

    public TravelController(VisitedPlaceRepository places) {
        this.places = places;
    }

    @GetMapping("/locations")
    public List<VisitedPlace> locations() {
        return places.findAllByOrderByVisitedAtAsc();
    }

    @GetMapping("/stats")
    public TravelStats stats() {
        List<VisitedPlace> all = places.findAllByOrderByVisitedAtAsc();
        long countries = all.stream()
                .map(VisitedPlace::getCountry)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        LocalDate first = all.isEmpty() ? null : all.get(0).getVisitedAt();
        LocalDate latest = all.isEmpty() ? null : all.get(all.size() - 1).getVisitedAt();
        return new TravelStats(countries, all.size(), first, latest);
    }

    @PostMapping("/locations")
    @ResponseStatus(HttpStatus.CREATED)
    public VisitedPlace create(@RequestBody VisitedPlace place) {
        place.setId(null);
        return places.save(place);
    }

    @PutMapping("/locations/{id}")
    public VisitedPlace update(@PathVariable Long id, @RequestBody VisitedPlace update) {
        VisitedPlace place = places.findById(id)
                .orElseThrow(() -> new NotFoundException("Place not found: " + id));
        place.setName(update.getName());
        place.setCountry(update.getCountry());
        place.setCountryCode(update.getCountryCode());
        place.setLat(update.getLat());
        place.setLng(update.getLng());
        place.setVisitedAt(update.getVisitedAt());
        place.setDescription(update.getDescription());
        place.setHighlight(update.getHighlight());
        place.setColor(update.getColor());
        place.setPhotosCount(update.getPhotosCount());
        place.setRating(update.getRating());
        return places.save(place);
    }

    @DeleteMapping("/locations/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!places.existsById(id)) {
            throw new NotFoundException("Place not found: " + id);
        }
        places.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
