package com.manhnpc.media.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

/**
 * Shells out to ffmpeg (must be on PATH) to normalize an uploaded video to a
 * browser-safe H.264/AAC MP4 and grab a real frame as a JPEG thumbnail —
 * source containers/codecs (e.g. HEVC .mov from screen recorders) aren't
 * reliably decodable by browsers otherwise.
 */
@Component
public class VideoProcessor {

    private static final int TIMEOUT_SECONDS = 90;

    public record ProcessedVideo(Path video, Path thumbnail) {}

    public ProcessedVideo process(Path input) throws IOException {
        Path video = Files.createTempFile("transcoded-", ".mp4");
        Path thumbnail = Files.createTempFile("thumb-", ".jpg");
        try {
            run(List.of("ffmpeg", "-y", "-i", input.toString(),
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
                    "-c:a", "aac", "-b:a", "128k",
                    "-movflags", "+faststart",
                    video.toString()));
            run(List.of("ffmpeg", "-y", "-i", input.toString(),
                    "-ss", "00:00:00.5", "-vframes", "1",
                    "-vf", "scale=640:-1",
                    thumbnail.toString()));
            return new ProcessedVideo(video, thumbnail);
        } catch (IOException | RuntimeException e) {
            Files.deleteIfExists(video);
            Files.deleteIfExists(thumbnail);
            throw e;
        }
    }

    private void run(List<String> command) throws IOException {
        Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
        String output;
        try (var in = process.getInputStream()) {
            output = new String(in.readAllBytes());
        }
        boolean finished;
        try {
            finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("ffmpeg interrupted", e);
        }
        if (!finished) {
            process.destroyForcibly();
            throw new IOException("ffmpeg timed out after " + TIMEOUT_SECONDS + "s: " + command);
        }
        if (process.exitValue() != 0) {
            throw new IOException("ffmpeg failed (exit " + process.exitValue() + "): " + output);
        }
    }
}
