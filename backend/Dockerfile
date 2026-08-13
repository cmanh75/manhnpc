FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline
COPY . .
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# media uploads shell out to ffmpeg to transcode and grab a real thumbnail frame
RUN apk add --no-cache ffmpeg
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /workspace/target/manhnpc-backend-1.0.0.jar /app/app.jar
RUN mkdir -p /app/data && chown -R app:app /app
USER app
ENTRYPOINT ["java","-XX:MaxRAMPercentage=70","-XX:+ExitOnOutOfMemoryError","-jar","/app/app.jar"]
