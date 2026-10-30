
package com.turfbooking.turfbooking.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${turfzone.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        try {
            Path uploadDirectory = Paths.get(uploadDir)
                    .toAbsolutePath()
                    .normalize();

            Files.createDirectories(uploadDirectory);

            String uploadLocation = uploadDirectory.toUri().toString();

            registry.addResourceHandler("/uploads/**")
                    .addResourceLocations(uploadLocation);
        } catch (IOException | InvalidPathException | SecurityException e) {
            throw new IllegalStateException(
                    "Could not configure turf image directory: " + uploadDir, e);
        }
    }
}
