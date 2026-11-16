package club.castillo.restaurantes.castillo.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    /**
     * LOPDP Art. 32 — Seguridad de datos.
     * En producción, define: ALLOWED_ORIGINS=https://clubcastillo.com
     * En desarrollo no es necesario configurar (usa localhost por defecto).
     */
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000}")
    private String allowedOriginsRaw;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // Rutas públicas
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        // De /zones solo la consulta es publica: la vista de restaurantes
                        // del socio y del invitado la necesita para agrupar las unidades
                        // por etapa. La escritura queda reservada al propietario, y se
                        // refuerza con @PreAuthorize en ZoneController.
                        .requestMatchers(HttpMethod.GET, "/zones", "/zones/**").permitAll()
                        .requestMatchers("/zones", "/zones/**").hasRole("OWNER")
                        .requestMatchers("/ws-orders/**").permitAll()
                        // De la carta de bebidas por unidad solo la consulta es publica. La
                        // regla anterior no restringia el metodo, de modo que el cambio de
                        // disponibilidad bajo esta misma ruta quedaba accesible sin sesion.
                        .requestMatchers(HttpMethod.GET, "/beverages/restaurant/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/qr-codes/restaurant/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/restaurants/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/restaurants/public").permitAll()
                        .requestMatchers(HttpMethod.GET, "/menu-items/restaurant/**").permitAll()
                        // Privadas desde aquí
                        .requestMatchers("/restaurants/**").authenticated()
                        .requestMatchers("/api/users/**").authenticated()
                        .requestMatchers("/beverages/**").authenticated()
                        .requestMatchers("/categories/**").authenticated()
                        .requestMatchers("/menu-items/**").authenticated()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Los origenes autorizados se declaran por configuracion en lugar de
        // admitir cualquiera, condicion necesaria para que la credencial de
        // sesion viaje solo hacia el cliente propio del sistema.
        configuration.setAllowedOrigins(Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(origen -> !origen.isEmpty())
                .toList());
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
