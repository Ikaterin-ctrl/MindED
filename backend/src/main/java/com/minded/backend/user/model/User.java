package com.minded.backend.user.model;

public class User {
    private String username;
    private String password; // In a real app, this should be hashed

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
