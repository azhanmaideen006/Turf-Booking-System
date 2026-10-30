
package com.turfbooking.turfbooking.service;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.turfbooking.turfbooking.entity.Customer;
import com.turfbooking.turfbooking.repository.CustomerRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final CustomerRepository customerRepository;

    public CustomUserDetailsService(
            CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        Customer customer = customerRepository
                .findByEmail(email.trim().toLowerCase())
                .orElseThrow(() ->
                    new UsernameNotFoundException(
                        "Invalid email or password"));

        return User.withUsername(customer.getEmail())
                .password(customer.getPassword())
                .roles(customer.getRole())
                .build();
    }
}
