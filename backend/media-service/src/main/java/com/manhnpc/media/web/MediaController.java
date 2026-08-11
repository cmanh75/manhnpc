package com.manhnpc.media.web;

import com.manhnpc.media.model.Photo;
import com.manhnpc.media.model.Video;
import com.manhnpc.media.repository.PhotoRepository;
import com.manhnpc.media.repository.VideoRepository;
import com.manhnpc.media.storage.R2StorageService;
import com.manhnpc.media.storage.R2StorageService.UploadResult;
import com.manhnpc.media.web.error.NotFoundException;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final PhotoRepository photos;
    private final VideoRepository videos;
    private final R2StorageService storage;

    public MediaController(PhotoRepository photos, VideoRepository videos, R2StorageService storage) {
        this.photos = photos;
        this.videos = videos;
        this.storage = storage;
    }

    @GetMapping("/photos")
    public List<Photo> photos(@RequestParam(required = false) String category) {
        if (category == null || category.isBlank()) {
            return photos.findAllByOrderByTakenAtDesc();
        }
        return photos.findByCategoryIgnoreCaseOrderByTakenAtDesc(category);
    }

    @GetMapping("/videos")
    public List<Video> videos() {
        return videos.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/photos/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public Photo uploadPhoto(@RequestParam("file") MultipartFile file,
                             @RequestParam(defaultValue = "Untitled photo") String title,
                             @RequestParam(required = false) String description,
                             @RequestParam(defaultValue = "life") String category,
                             @RequestParam(required = false) String location) throws IOException {
        UploadResult result = storage.upload(file, "photos");
        Photo photo = Photo.builder()
                .title(title)
                .description(description)
                .url(result.url())
                .thumbnailUrl(result.url())
                .storageKey(result.key())
                .category(category)
                .location(location)
                .takenAt(LocalDate.now())
                .width(0)
                .height(0)
                .featured(false)
                .build();
        return photos.save(photo);
    }

    @PostMapping("/videos/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public Video uploadVideo(@RequestParam("file") MultipartFile file,
                             @RequestParam(defaultValue = "Untitled video") String title,
                             @RequestParam(required = false) String description,
                             @RequestParam(defaultValue = "life") String category,
                             @RequestParam(defaultValue = "0") int durationSeconds) throws IOException {
        UploadResult result = storage.upload(file, "videos");
        Video video = Video.builder()
                .title(title)
                .description(description)
                .url(result.url())
                .thumbnailUrl("https://picsum.photos/seed/" + result.key() + "/640/360")
                .storageKey(result.key())
                .durationSeconds(durationSeconds)
                .category(category)
                .createdAt(LocalDateTime.now())
                .build();
        return videos.save(video);
    }

    @DeleteMapping("/photos/{id}")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long id) {
        Photo photo = photos.findById(id).orElseThrow(() -> new NotFoundException("Photo not found: " + id));
        photos.deleteById(id);
        storage.delete(photo.getStorageKey());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/videos/{id}")
    public ResponseEntity<Void> deleteVideo(@PathVariable Long id) {
        Video video = videos.findById(id).orElseThrow(() -> new NotFoundException("Video not found: " + id));
        videos.deleteById(id);
        storage.delete(video.getStorageKey());
        return ResponseEntity.noContent().build();
    }
}
