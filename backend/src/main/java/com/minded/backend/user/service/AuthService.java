package com.minded.backend.user.service;

import org.springframework.stereotype.Service;

@Service
public class AuthService {

    public boolean login(String username, String password) {
        // Placeholder for login logic
        System.out.println("Attempting to log in user: " + username);
        // In a real app, this would involve checking against a database
        return true; // Always true for now
    }

    public boolean register(String username, String password) {
        // Placeholder for registration logic
        System.out.println("Attempting to register user: " + username);
        // In a real app, this would involve saving to a database
        return true; // Always true for now
    }
}
