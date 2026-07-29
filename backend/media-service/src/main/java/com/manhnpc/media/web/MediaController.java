package com.manhnpc.media.web;

import com.manhnpc.media.model.Photo;
import com.manhnpc.media.model.Video;
import com.manhnpc.media.repository.PhotoRepository;
import com.manhnpc.media.repository.VideoRepository;
import com.manhnpc.media.web.error.NotFoundException;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
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
    private final Path uploadDir;

    public MediaController(PhotoRepository photos, VideoRepository videos,
                           @Value("${media.upload-dir:./uploads}") String uploadDir) {
        this.photos = photos;
        this.videos = videos;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create upload directory " + this.uploadDir, e);
        }
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
        String filename = store(file);
        String url = "/api/media/files/" + filename;
        Photo photo = Photo.builder()
                .title(title)
                .description(description)
                .url(url)
                .thumbnailUrl(url)
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
        String filename = store(file);
        Video video = Video.builder()
                .title(title)
                .description(description)
                .url("/api/media/files/" + filename)
                .thumbnailUrl("https://picsum.photos/seed/" + filename + "/640/360")
                .durationSeconds(durationSeconds)
                .category(category)
                .createdAt(LocalDateTime.now())
                .build();
        return videos.save(video);
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        Path path = uploadDir.resolve(filename).normalize();
        if (!path.startsWith(uploadDir) || !Files.isRegularFile(path)) {
            throw new NotFoundException("File not found: " + filename);
        }
        MediaType mediaType = MediaTypeFactory.getMediaType(filename)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .body(new FileSystemResource(path));
    }

    @DeleteMapping("/photos/{id}")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long id) {
        if (!photos.existsById(id)) {
            throw new NotFoundException("Photo not found: " + id);
        }
        photos.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/videos/{id}")
    public ResponseEntity<Void> deleteVideo(@PathVariable Long id) {
        if (!videos.existsById(id)) {
            throw new NotFoundException("Video not found: " + id);
        }
        videos.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }
        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String extension = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0 && dot < original.length() - 1) {
            extension = original.substring(dot).toLowerCase();
        }
        String filename = UUID.randomUUID() + extension;
        Files.copy(file.getInputStream(), uploadDir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }
}
