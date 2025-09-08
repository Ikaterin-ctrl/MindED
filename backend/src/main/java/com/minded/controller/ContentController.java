package com.minded.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ContentController {

    @PostMapping("/upload-and-adapt")
    public ResponseEntity<String> uploadAndAdapt(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a file to upload.");
        }

        try {
            // Save the file temporarily
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
            Path tempFilePath = Paths.get("temp_uploads", uniqueFileName);
            Files.createDirectories(tempFilePath.getParent());
            Files.copy(file.getInputStream(), tempFilePath);

            // TODO: Implement actual PDF reading and Gemini API adaptation here
            // For now, return a placeholder adapted content
            String adaptedContent = "Conteúdo adaptado do arquivo: " + originalFilename + ". (Adaptação real virá em breve!)";

            // Clean up the temporary file (optional, depending on further processing)
            Files.delete(tempFilePath);

            return ResponseEntity.ok(adaptedContent);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to upload and adapt content: " + e.getMessage());
        }
    }
}