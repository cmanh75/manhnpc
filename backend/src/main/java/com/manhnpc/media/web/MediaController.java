package com.manhnpc.media.web;

import com.manhnpc.media.model.Photo;
import com.manhnpc.media.model.Video;
import com.manhnpc.media.repository.PhotoRepository;
import com.manhnpc.media.repository.VideoRepository;
import com.manhnpc.common.storage.R2StorageService;
import com.manhnpc.common.storage.R2StorageService.UploadResult;
import com.manhnpc.media.storage.VideoProcessor;
import com.manhnpc.media.storage.VideoProcessor.ProcessedVideo;
import com.manhnpc.common.web.error.NotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
    private final VideoProcessor videoProcessor;

    public MediaController(PhotoRepository photos, VideoRepository videos, R2StorageService storage, VideoProcessor videoProcessor) {
        this.photos = photos;
        this.videos = videos;
        this.storage = storage;
        this.videoProcessor = videoProcessor;
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
                .takenAt(LocalDateTime.now())
                .width(0)
                .height(0)
                .featured(false)
                .build();
        return photos.save(photo);
    }

    @PostMapping("/photos/upload-batch")
    @ResponseStatus(HttpStatus.CREATED)
    public List<Photo> uploadPhotoBatch(@RequestParam("files") List<MultipartFile> files,
                                        @RequestParam(defaultValue = "Untitled photo") String title,
                                        @RequestParam(required = false) String description,
                                        @RequestParam(defaultValue = "life") String category,
                                        @RequestParam(required = false) String location) throws IOException {
        String groupId = files.size() > 1 ? UUID.randomUUID().toString() : null;
        List<Photo> saved = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            UploadResult result = storage.upload(files.get(i), "photos");
            Photo photo = Photo.builder()
                    .title(title)
                    .description(description)
                    .url(result.url())
                    .thumbnailUrl(result.url())
                    .storageKey(result.key())
                    .groupId(groupId)
                    .position(i)
                    .category(category)
                    .location(location)
                    .takenAt(LocalDateTime.now())
                    .width(0)
                    .height(0)
                    .featured(false)
                    .build();
            saved.add(photos.save(photo));
        }
        return saved;
    }

    @PostMapping("/videos/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public Video uploadVideo(@RequestParam("file") MultipartFile file,
                             @RequestParam(defaultValue = "Untitled video") String title,
                             @RequestParam(required = false) String description,
                             @RequestParam(defaultValue = "life") String category) throws IOException {
        return processAndSaveVideo(file, title, description, category, null, 0);
    }

    @PostMapping("/videos/upload-batch")
    @ResponseStatus(HttpStatus.CREATED)
    public List<Video> uploadVideoBatch(@RequestParam("files") List<MultipartFile> files,
                                        @RequestParam(defaultValue = "Untitled video") String title,
                                        @RequestParam(required = false) String description,
                                        @RequestParam(defaultValue = "life") String category) throws IOException {
        String groupId = files.size() > 1 ? UUID.randomUUID().toString() : null;
        List<Video> saved = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            saved.add(processAndSaveVideo(files.get(i), title, description, category, groupId, i));
        }
        return saved;
    }

    private Video processAndSaveVideo(MultipartFile file, String title, String description, String category,
                                       String groupId, int position) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }
        Path input = Files.createTempFile("upload-", ".src");
        ProcessedVideo processed = null;
        try {
            file.transferTo(input);
            // re-encode to H.264/AAC MP4 regardless of source codec/container — browsers
            // can't reliably decode arbitrary formats (e.g. HEVC .mov from screen recorders) —
            // and grab a real frame instead of an unrelated placeholder thumbnail.
            processed = videoProcessor.process(input);
            UploadResult videoResult = storage.uploadFile(processed.video(), "video/mp4", "videos", ".mp4");
            UploadResult thumbResult = storage.uploadFile(processed.thumbnail(), "image/jpeg", "thumbnails", ".jpg");
            Video video = Video.builder()
                    .title(title)
                    .description(description)
                    .url(videoResult.url())
                    .thumbnailUrl(thumbResult.url())
                    .storageKey(videoResult.key())
                    .thumbnailKey(thumbResult.key())
                    .groupId(groupId)
                    .position(position)
                    .durationSeconds(processed.durationSeconds())
                    .category(category)
                    .createdAt(LocalDateTime.now())
                    .build();
            return videos.save(video);
        } finally {
            Files.deleteIfExists(input);
            if (processed != null) {
                Files.deleteIfExists(processed.video());
                Files.deleteIfExists(processed.thumbnail());
            }
        }
    }

    @PutMapping("/photos/{id}")
    public Photo updatePhoto(@PathVariable Long id,
                             @RequestParam(required = false) MultipartFile file,
                             @RequestParam(required = false) String title,
                             @RequestParam(required = false) String description,
                             @RequestParam(required = false) String category,
                             @RequestParam(required = false) String location,
                             @RequestParam(required = false) String takenAt) throws IOException {
        Photo photo = photos.findById(id).orElseThrow(() -> new NotFoundException("Photo not found: " + id));
        if (title != null && !title.isBlank()) photo.setTitle(title);
        if (description != null) photo.setDescription(description);
        if (category != null && !category.isBlank()) photo.setCategory(category);
        if (location != null) photo.setLocation(location);
        if (takenAt != null && !takenAt.isBlank()) photo.setTakenAt(LocalDateTime.parse(takenAt));
        if (file != null && !file.isEmpty()) {
            String oldKey = photo.getStorageKey();
            UploadResult result = storage.upload(file, "photos");
            photo.setUrl(result.url());
            photo.setThumbnailUrl(result.url());
            photo.setStorageKey(result.key());
            storage.delete(oldKey);
        }
        return photos.save(photo);
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
        storage.delete(video.getThumbnailKey());
        return ResponseEntity.noContent().build();
    }
}
