package com.manhnpc.journal.web;

import com.manhnpc.journal.storage.R2StorageService;
import com.manhnpc.journal.storage.R2StorageService.UploadResult;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/journal/images")
public class JournalImageController {

    private final R2StorageService storage;

    public JournalImageController(R2StorageService storage) {
        this.storage = storage;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        UploadResult result = storage.upload(file, "journal");
        return Map.of("url", result.url());
    }
}
