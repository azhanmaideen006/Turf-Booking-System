
package com.turfbooking.turfbooking.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.turfbooking.turfbooking.dto.LoginRequest;
import com.turfbooking.turfbooking.dto.RegisterRequest;
import com.turfbooking.turfbooking.dto.UserResponse;
import com.turfbooking.turfbooking.entity.Customer;
import com.turfbooking.turfbooking.repository.CustomerRepository;

@Service
public class AuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public String register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (customerRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already registered");
        }

        Customer customer = new Customer();
        customer.setName(request.name().trim());
        customer.setEmail(email);
        customer.setPassword(
                passwordEncoder.encode(request.password()));
        customer.setRole("CUSTOMER");

        customerRepository.save(customer);

        return "Registration successful";
    }

    public UserResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        Customer customer = customerRepository
                .findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"));

        if (!passwordEncoder.matches(
                request.password(), customer.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password");
        }

        return new UserResponse(
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getRole()
        );
    }
}
