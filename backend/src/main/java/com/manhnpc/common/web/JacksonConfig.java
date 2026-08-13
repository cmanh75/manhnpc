package com.manhnpc.common.web;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The app's only clock is the container's system clock, which every entity reads via
 * {@code LocalDateTime.now()} — under the production JRE (Alpine, no TZ set) that's UTC, but
 * {@code LocalDateTime} carries no zone info, so it serialized as a bare "2026-08-13T19:44:33"
 * string. The frontend's {@code new Date(...)} then read that as if it were already in the
 * visitor's local zone instead of UTC, showing every timestamp site-wide hours off (and
 * sometimes on the wrong day). Tagging the JSON output with a trailing "Z" makes the value
 * unambiguously UTC so the browser converts it correctly — output only, so existing
 * {@code LocalDateTime.parse(...)} calls on incoming request bodies are unaffected.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer utcLocalDateTimeSerialization() {
        return builder -> builder.serializerByType(LocalDateTime.class, new UtcLocalDateTimeSerializer());
    }

    private static final class UtcLocalDateTimeSerializer extends StdSerializer<LocalDateTime> {
        UtcLocalDateTimeSerializer() {
            super(LocalDateTime.class);
        }

        @Override
        public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
            gen.writeString(DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(value) + "Z");
        }
    }
}
