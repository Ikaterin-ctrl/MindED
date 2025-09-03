package com.minded.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/", "/images/**").permitAll() // Allow access to home and images
                .anyRequest().authenticated() // All other requests require authentication
            )
            .oauth2Login(withDefaults()) // Enable OAuth2 login
            .logout(withDefaults()); // Enable logout with defaults
        return http.build();
    }
}