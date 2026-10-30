
package com.turfbooking.turfbooking.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.turfbooking.turfbooking.entity.Customer;
import com.turfbooking.turfbooking.repository.CustomerRepository;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Admin dashboard
    @GetMapping("/dashboard")
    public Map<String, String> dashboard() {
        return Map.of(
            "message", "Admin authenticated successfully",
            "role", "ADMIN"
        );
    }

    // Get total number of admins
    @GetMapping("/count")
    public Map<String, Long> getAdminCount() {
        return Map.of(
            "totalAdmins",
            customerRepository.countByRole("ADMIN")
        );
    }

    // Get all admins
    @GetMapping("/admins")
    public List<AdminResponse> getAllAdmins() {

        return customerRepository.findAll()
                .stream()
                .filter(customer -> "ADMIN".equals(customer.getRole()))
                .map(customer -> new AdminResponse(
                        customer.getId(),
                        customer.getName(),
                        customer.getEmail()
                ))
                .toList();
    }

    // Create new admin
    @PostMapping("/admins")
    public ResponseEntity<?> createAdmin(
            @RequestBody CreateAdminRequest request) {

        if (request.name() == null || request.name().isBlank()
                || request.email() == null || request.email().isBlank()
                || request.password() == null
                || request.password().length() < 8) {

            return ResponseEntity.badRequest().body(
                Map.of("message",
                    "Name, email and password (minimum 8 characters) are required.")
            );
        }

        String email = request.email().trim().toLowerCase();

        if (customerRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of("message", "Email already exists.")
            );
        }

        Customer admin = new Customer();
        admin.setName(request.name().trim());
        admin.setEmail(email);
        admin.setPassword(
            passwordEncoder.encode(request.password())
        );
        admin.setRole("ADMIN");

        customerRepository.save(admin);

        return ResponseEntity.status(HttpStatus.CREATED).body(
            Map.of("message", "Admin created successfully.")
        );
    }

    // Delete another admin
    @DeleteMapping("/admins/{id}")
    public ResponseEntity<?> deleteAdmin(
            @PathVariable Long id,
            Authentication authentication) {

        Customer admin = customerRepository.findById(id)
                .orElse(null);

        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of("message", "Admin not found.")
            );
        }

        // Prevent deleting your own account
        if (admin.getEmail().equalsIgnoreCase(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                Map.of("message", "You cannot delete your own admin account.")
            );
        }

        // Prevent deleting the last admin
        if (customerRepository.countByRole("ADMIN") <= 1) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of("message", "At least one admin account must remain.")
            );
        }

        customerRepository.delete(admin);

        return ResponseEntity.ok(
            Map.of("message", "Admin deleted successfully.")
        );
    }

    public record CreateAdminRequest(
            String name,
            String email,
            String password) {
    }

    public record AdminResponse(
            Long id,
            String name,
            String email) {
    }
}
