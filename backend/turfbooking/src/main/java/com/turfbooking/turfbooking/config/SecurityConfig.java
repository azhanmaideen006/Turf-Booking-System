
package com.turfbooking.turfbooking.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(List.of(
                    "http://localhost:5173",
                    "http://127.0.0.1:5173"
                ));

                config.setAllowedMethods(List.of(
                    "GET", "POST", "PUT", "DELETE", "OPTIONS"
                ));

                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);

                return config;
            }))

            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/").permitAll()
                .requestMatchers("/api/auth/**").permitAll()

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/turfs",
                    "/api/turfs/**"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/turfs/upload-image",
                    "/api/turfs"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/turfs/**"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/turfs/**"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/bookings/availability",
                    "/api/bookings/my-bookings"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/bookings"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/bookings/*/cancel"
                ).permitAll()

                .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")

                .anyRequest().authenticated()
            )

            .httpBasic(basic -> basic.authenticationEntryPoint(
                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
            ))

            .formLogin(form -> form.disable());

        return http.build();
    }
}
