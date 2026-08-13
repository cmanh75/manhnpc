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

    public record ProcessedVideo(Path video, Path thumbnail, int durationSeconds) {}

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
            int durationSeconds = (int) Math.round(probeDurationSeconds(video));
            return new ProcessedVideo(video, thumbnail, durationSeconds);
        } catch (IOException | RuntimeException e) {
            Files.deleteIfExists(video);
            Files.deleteIfExists(thumbnail);
            throw e;
        }
    }

    /** Reads the real duration off the transcoded file via ffprobe (ships alongside ffmpeg). */
    private double probeDurationSeconds(Path video) throws IOException {
        List<String> command = List.of("ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                video.toString());
        Process process = new ProcessBuilder(command).start();
        String output;
        try (var in = process.getInputStream()) {
            output = new String(in.readAllBytes()).trim();
        }
        awaitOrThrow(process, "ffprobe", command);
        try {
            return Double.parseDouble(output);
        } catch (NumberFormatException e) {
            throw new IOException("ffprobe returned unparsable duration: " + output, e);
        }
    }

    private void run(List<String> command) throws IOException {
        Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
        String output;
        try (var in = process.getInputStream()) {
            output = new String(in.readAllBytes());
        }
        awaitOrThrow(process, "ffmpeg", command, output);
    }

    private void awaitOrThrow(Process process, String toolName, List<String> command) throws IOException {
        awaitOrThrow(process, toolName, command, null);
    }

    private void awaitOrThrow(Process process, String toolName, List<String> command, String output) throws IOException {
        boolean finished;
        try {
            finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException(toolName + " interrupted", e);
        }
        if (!finished) {
            process.destroyForcibly();
            throw new IOException(toolName + " timed out after " + TIMEOUT_SECONDS + "s: " + command);
        }
        if (process.exitValue() != 0) {
            throw new IOException(toolName + " failed (exit " + process.exitValue() + "): " + (output != null ? output : ""));
        }
    }
}
