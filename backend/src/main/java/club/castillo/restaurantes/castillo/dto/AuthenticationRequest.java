package club.castillo.restaurantes.castillo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationRequest {
    private String email;
    private String password;
    /**
     * LOPDP Art. 8: la casilla de consentimiento se presenta en la pantalla de
     * acceso. Si el titular la acciona y su cuenta aun no registra el
     * consentimiento, este se persiste con su fecha en el momento del ingreso.
     */
    private boolean consentGiven;
}