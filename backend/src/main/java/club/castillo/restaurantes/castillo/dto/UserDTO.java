package club.castillo.restaurantes.castillo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String profileImageBase64;
    private String password; // Solo para creación/edición, nunca devolver en GET
    /** Unidad principal. Se conserva por compatibilidad con el cliente. */
    private Long restauranteId;
    /** Todas las unidades activas que el usuario administra. */
    private List<Long> restauranteIds;

    /**
     * LOPDP Art. 8: constancia del consentimiento otorgado por el titular. Se
     * expone porque el registro de auditoria del propietario se construye sobre
     * estos dos valores; sin ellos la consulta nunca podia mostrarlos.
     */
    private boolean consentGiven;
    private LocalDateTime consentDate;
}
