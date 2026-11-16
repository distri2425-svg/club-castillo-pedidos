package club.castillo.restaurantes.castillo.controller;

import club.castillo.restaurantes.castillo.dto.AuthenticationRequest;
import club.castillo.restaurantes.castillo.dto.AuthenticationResponse;
import club.castillo.restaurantes.castillo.dto.RegisterRequest;
import club.castillo.restaurantes.castillo.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationController.class);

    private final AuthenticationService service;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(
            @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(
            @RequestBody AuthenticationRequest request
    ) {
        try {
            return ResponseEntity.ok(service.authenticate(request));
        } catch (AuthenticationException e) {
            // Antes el rechazo salia como un 403 sin cuerpo, indistinguible de
            // una falta de permisos. Se deja constancia del correo intentado
            // (nunca de la clave) y se responde 401 con un mensaje legible.
            log.warn("Intento de acceso rechazado para [{}]: {}", request.getEmail(), e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Credenciales inválidas"));
        }
    }

    @PostMapping("/guest-login")
    public ResponseEntity<AuthenticationResponse> guestLogin() {
        return ResponseEntity.ok(service.authenticateAsGuest());
    }

}
