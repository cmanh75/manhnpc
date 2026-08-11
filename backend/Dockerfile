FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY discovery-server/pom.xml discovery-server/pom.xml
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY auth-service/pom.xml auth-service/pom.xml
COPY content-service/pom.xml content-service/pom.xml
COPY media-service/pom.xml media-service/pom.xml
COPY travel-service/pom.xml travel-service/pom.xml
COPY guestbook-service/pom.xml guestbook-service/pom.xml
COPY journal-service/pom.xml journal-service/pom.xml
RUN mvn -B -DskipTests dependency:go-offline
COPY . .
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
ARG SERVICE
ENV SERVICE_NAME=${SERVICE}
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /workspace/${SERVICE}/target/${SERVICE}-1.0.0.jar /app/app.jar
RUN mkdir -p /app/data /app/uploads && chown -R app:app /app
USER app
ENTRYPOINT ["java","-XX:MaxRAMPercentage=70","-XX:+ExitOnOutOfMemoryError","-jar","/app/app.jar"]
