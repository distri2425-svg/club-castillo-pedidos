package club.castillo.restaurantes.castillo.config;

import club.castillo.restaurantes.castillo.model.Role;
import club.castillo.restaurantes.castillo.model.User;
import club.castillo.restaurantes.castillo.repository.RoleRepository;
import club.castillo.restaurantes.castillo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Clave con la que se crean las cuentas iniciales. Se declara en el archivo
     * .env como SEED_USER_PASSWORD y nunca se escribe en el codigo, que si se
     * versiona.
     */
    @Value("${app.seed.password:}")
    private String claveDeclarada;

    /**
     * Devuelve la clave de siembra. Si no se declaro ninguna, se genera una
     * aleatoria y se registra en la bitacora de arranque, de manera que el
     * sistema pueda ponerse en marcha sin configuracion previa sin que ello
     * suponga una credencial conocida de antemano.
     */
    private String claveDeSiembra() {
        if (claveDeclarada != null && !claveDeclarada.isBlank()) {
            return claveDeclarada;
        }
        String generada = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        log.warn("No se declaro SEED_USER_PASSWORD: las cuentas iniciales se crean con la clave "
                + "generada [{}]. Declarela en el archivo .env para fijar una propia.", generada);
        return generada;
    }

    @Override
    public void run(String... args) {
        // 1. Obtener o crear roles
        Role ownerRole = roleRepository.findByName("OWNER").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name("OWNER")
                        .description("Puede gestionar todo el sistema, incluyendo bebidas")
                        .active(true)
                        .build())
        );

        Role adminRole = roleRepository.findByName("RESTAURANT_ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name("RESTAURANT_ADMIN")
                        .description("Puede gestionar su restaurante asignado")
                        .active(true)
                        .build())
        );

        Role customerRole = roleRepository.findByName("CUSTOMER").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Usuario regular que puede hacer pedidos")
                        .active(true)
                        .build())
        );

        Role invitedRole = roleRepository.findByName("INVITED").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name("INVITED")
                        .description("Usuario invitado, acceso limitado solo para pedidos")
                        .active(true)
                        .build())
        );

        // 2. Crear o actualizar usuarios por defecto
        LocalDateTime consentDate = LocalDateTime.now();
        String claveInicial = claveDeSiembra();

        if (userRepository.findByEmail("owner@club.com").isEmpty()) {
            User owner = User.builder()
                    .firstName("Admin")
                    .lastName("Owner")
                    .email("owner@club.com")
                    .password(passwordEncoder.encode(claveInicial))
                    .role(ownerRole)
                    .active(true)
                    .consentGiven(true)
                    .consentDate(consentDate)
                    .build();
            userRepository.save(owner);
        }

        if (userRepository.findByEmail("admin@restaurant.com").isEmpty()) {
            User restaurantAdmin = User.builder()
                    .firstName("Restaurant")
                    .lastName("Admin")
                    .email("admin@restaurant.com")
                    .password(passwordEncoder.encode(claveInicial))
                    .role(adminRole)
                    .active(true)
                    .consentGiven(true)
                    .consentDate(consentDate)
                    .build();
            userRepository.save(restaurantAdmin);
        }

        if (userRepository.findByEmail("customer@club.com").isEmpty()) {
            User customer = User.builder()
                    .firstName("Regular")
                    .lastName("Customer")
                    .email("customer@club.com")
                    .password(passwordEncoder.encode(claveInicial))
                    .role(customerRole)
                    .active(true)
                    .consentGiven(true)
                    .consentDate(consentDate)
                    .build();
            userRepository.save(customer);
        }

        if (userRepository.findByEmail("invitado@club.com").isEmpty()) {
            User invited = User.builder()
                    .firstName("Invitado")
                    .lastName("General")
                    .email("invitado@club.com")
                    .password(passwordEncoder.encode(claveInicial))
                    .role(invitedRole)
                    .active(true)
                    .consentGiven(false)
                    .build();
            userRepository.save(invited);
        }
    }
}
