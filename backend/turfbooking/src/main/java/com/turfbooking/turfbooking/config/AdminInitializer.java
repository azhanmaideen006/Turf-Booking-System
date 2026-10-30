
package com.turfbooking.turfbooking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.turfbooking.turfbooking.entity.Customer;
import com.turfbooking.turfbooking.repository.CustomerRepository;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner createAdmin(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email}") String adminEmail,
            @Value("${app.admin.password}") String adminPassword) {

        return args -> {
            String email = adminEmail.trim().toLowerCase();

            Customer admin = customerRepository.findByEmail(email)
                    .orElseGet(() -> {
                        Customer newAdmin = new Customer();
                        newAdmin.setName("TurfZone Admin");
                        newAdmin.setEmail(email);
                        newAdmin.setRole("ADMIN");
                        return newAdmin;
                    });

            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ADMIN");

            customerRepository.save(admin);

            System.out.println("Admin account created or updated successfully.");
        };
    }
}
