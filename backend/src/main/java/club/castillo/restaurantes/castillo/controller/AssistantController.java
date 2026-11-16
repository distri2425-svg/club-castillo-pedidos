package club.castillo.restaurantes.castillo.controller;

import club.castillo.restaurantes.castillo.dto.AssistantRequest;
import club.castillo.restaurantes.castillo.dto.AssistantResponse;
import club.castillo.restaurantes.castillo.service.AssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Punto de acceso del asistente virtual. La ruta queda bajo la regla general de
 * la cadena de filtros, por lo que exige una sesion valida: tanto el socio como
 * el invitado la obtienen al ingresar, y de este modo la credencial del servicio
 * externo no queda expuesta a peticiones anonimas.
 */
@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;

    /** Informa si el asistente esta configurado, sin revelar la credencial. */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> status() {
        return ResponseEntity.ok(Map.of("available", assistantService.estaDisponible()));
    }

    @PostMapping("/chat")
    public ResponseEntity<AssistantResponse> chat(@RequestBody AssistantRequest request) {
        try {
            String respuesta = assistantService.responder(request.getMessage(), request.getHistory());
            return ResponseEntity.ok(
                    AssistantResponse.builder()
                            .reply(respuesta)
                            .generatedByAi(true)
                            .build()
            );
        } catch (AssistantService.AsistenteNoDisponibleException e) {
            // La aplicacion del cliente responde entonces con su repertorio
            // local y lo señala en la conversacion.
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(AssistantResponse.builder()
                            .reply(null)
                            .generatedByAi(false)
                            .build());
        }
    }
}
