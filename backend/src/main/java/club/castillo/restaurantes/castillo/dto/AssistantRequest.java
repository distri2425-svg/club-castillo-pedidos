package club.castillo.restaurantes.castillo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Consulta enviada al asistente virtual desde la aplicacion del cliente.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantRequest {

    /** Mensaje escrito por el usuario. */
    private String message;

    /**
     * Turnos previos de la conversacion, del mas antiguo al mas reciente. Se
     * envian para que el asistente conserve el hilo, ya que el servicio externo
     * no almacena estado entre peticiones.
     */
    private List<Turn> history;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Turn {
        /** Autor del turno: "user" para el socio y "model" para el asistente. */
        private String role;
        private String text;
    }
}
