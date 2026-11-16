package club.castillo.restaurantes.castillo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Respuesta del asistente virtual.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantResponse {

    /** Texto que se muestra al usuario. */
    private String reply;

    /**
     * Indica si la respuesta la genero el modelo de lenguaje. Cuando el servicio
     * no esta disponible la aplicacion del cliente responde con su repertorio
     * local y lo señala, de modo que nunca se presente como generada.
     */
    private boolean generatedByAi;
}
