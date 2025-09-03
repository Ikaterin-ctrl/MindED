// Código corrigido
public SecurityFilterChain configure(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers("/", "/images/**", "/assets/**").permitAll() // Regra única e mais abrangente para recursos estáticos
            .anyRequest().authenticated() // Todas as outras requisições exigem autenticação
        )
        .oauth2Login(withDefaults()); // Habilita o login OAuth2 com as configurações padrão
    return http.build(); // Adicionar o .build() no final
}