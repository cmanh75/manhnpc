package com.manhnpc.journal.storage;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/** Uploads journal images to the shared Cloudflare R2 bucket via its S3-compatible API. */
@Service
public class R2StorageService {

    private final S3Client client;
    private final String bucket;
    private final String publicBaseUrl;

    public R2StorageService(
            @Value("${r2.account-id}") String accountId,
            @Value("${r2.access-key-id}") String accessKeyId,
            @Value("${r2.secret-access-key}") String secretAccessKey,
            @Value("${r2.bucket}") String bucket,
            @Value("${r2.public-base-url}") String publicBaseUrl) {
        this.bucket = bucket;
        this.publicBaseUrl = publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
        this.client = S3Client.builder()
                .endpointOverride(URI.create("https://" + accountId + ".r2.cloudflarestorage.com"))
                .region(Region.of("auto"))
                .forcePathStyle(true)
                // pin the HTTP client explicitly — SdkDefaultClientBuilder's auto-discovery
                // prefers apache5-client when it's transitively present, but that module
                // requires org.apache.httpcomponents.client5:httpclient5 as a *separate*
                // dependency we don't carry, so auto-discovery throws NoClassDefFoundError.
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                .build();
    }

    public record UploadResult(String key, String url) {}

    public UploadResult upload(MultipartFile file, String keyPrefix) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }
        String key = keyPrefix + "/" + UUID.randomUUID() + extensionOf(file.getOriginalFilename());
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .contentLength(file.getSize())
                        .build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        return new UploadResult(key, publicBaseUrl + "/" + key);
    }

    private static String extensionOf(String originalFilename) {
        if (originalFilename == null) {
            return "";
        }
        int dot = originalFilename.lastIndexOf('.');
        return (dot >= 0 && dot < originalFilename.length() - 1)
                ? originalFilename.substring(dot).toLowerCase()
                : "";
    }
}
