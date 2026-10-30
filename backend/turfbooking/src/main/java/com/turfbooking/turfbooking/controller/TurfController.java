
package com.turfbooking.turfbooking.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.turfbooking.turfbooking.entity.Turf;
import com.turfbooking.turfbooking.service.TurfService;

@RestController
@RequestMapping("/api/turfs")
public class TurfController {

    private final TurfService turfService;
    private final Path uploadDirectory;

    public TurfController(
            TurfService turfService,
            @Value("${turfzone.upload-dir:uploads}") String uploadDir) {

        this.turfService = turfService;
        this.uploadDirectory = Paths.get(uploadDir)
                .toAbsolutePath()
                .normalize();

        try {
            Files.createDirectories(uploadDirectory);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Could not create upload directory: " + uploadDirectory, e);
        }
    }

    @GetMapping
    public List<Turf> getAllTurfs() {
        return turfService.getAllTurfs();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Turf> getTurfById(@PathVariable Long id) {
        return turfService.getTurfById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Turf> addTurf(@RequestBody Turf turf) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(turfService.addTurf(turf));
    }

    @PutMapping("/{id}")
    public Turf updateTurf(
            @PathVariable Long id,
            @RequestBody Turf turf) {
        return turfService.updateTurf(id, turf);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTurf(@PathVariable Long id) {
        turfService.deleteTurf(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(
            value = "/upload-image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadImage(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Please select an image");
        }

        String contentType = file.getContentType();

        Set<String> allowedTypes = Set.of(
                "image/jpeg",
                "image/png",
                "image/webp");

        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only JPG, PNG and WEBP images are allowed");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Image size must be 5 MB or less");
        }

        String originalName = file.getOriginalFilename();
        String extension = "";

        if (originalName != null && originalName.lastIndexOf('.') >= 0) {
            extension = originalName.substring(
                    originalName.lastIndexOf('.')).toLowerCase();
        }

        String fileName = UUID.randomUUID() + extension;

        try {
            Path destination = uploadDirectory.resolve(fileName).normalize();

            if (!destination.startsWith(uploadDirectory)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid file name");
            }

            Files.copy(
                    file.getInputStream(),
                    destination,
                    StandardCopyOption.REPLACE_EXISTING);

            return ResponseEntity.ok("/uploads/" + fileName);

        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Image upload failed")
                    
                    
            ;
        }
    }
}
