package com.example.minded.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import com.example.minded.service.UserDetailsServiceImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                 .authorizeHttpRequests(authorizeRequests ->
                         authorizeRequests
                                 .requestMatchers("/login", "/login.html", "/css/**", "/js/**", "/assets/**").permitAll()
                                 .anyRequest().authenticated()
                 )
                 .formLogin(formLogin ->
                         formLogin
                                 .loginPage("/login.html")
                                 .loginProcessingUrl("/login")
                                .defaultSuccessUrl("/menu.html", true)
                                .failureUrl("/login.html?error=true")
                                .defaultSuccessUrl("/menu", true)
                                .failureUrl("/login?error")
                                 .permitAll()
                 )
                 .logout(logout ->
                         logout
                                 .logoutUrl("/logout")
                                .logoutSuccessUrl("/login.html")
                                .logoutSuccessUrl("/login")
                );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
        authenticationProvider.setUserDetailsService(userDetailsService);
        authenticationProvider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(authenticationProvider);
    }
}
