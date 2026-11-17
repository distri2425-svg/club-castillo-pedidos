package club.castillo.restaurantes.castillo.controller;

import club.castillo.restaurantes.castillo.dto.OrderDTO;
import club.castillo.restaurantes.castillo.dto.UserDTO;
import club.castillo.restaurantes.castillo.model.Order;
import club.castillo.restaurantes.castillo.model.Role;
import club.castillo.restaurantes.castillo.model.Restaurant;
import club.castillo.restaurantes.castillo.model.User;
import club.castillo.restaurantes.castillo.repository.OrderRepository;
import club.castillo.restaurantes.castillo.repository.RestaurantRepository;
import club.castillo.restaurantes.castillo.repository.RoleRepository;
import club.castillo.restaurantes.castillo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;

    // --- Obtener usuario autenticado (con imagen base64) ---
    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return ResponseEntity.ok(toDTO(user, true));
    }

    // La administracion de cuentas (listar, crear, editar y dar de baja) queda
    // reservada al propietario. Antes bastaba una sesion valida, de modo que la
    // restriccion existia unicamente en la interfaz.
    // --- Listar usuarios CON PAGINACIÓN (sin imagen base64) ---
    @PreAuthorize("hasRole('OWNER')")
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage;

        if (role != null && search != null) {
            userPage = userRepository.findByRoleNameAndActiveTrueAndSearchTerm(role, search, pageable);
        } else if (role != null) {
            userPage = userRepository.findByRoleNameAndActiveTrue(role, pageable);
        } else if (search != null) {
            userPage = userRepository.findByActiveTrueAndSearchTerm(search, pageable);
        } else {
            userPage = userRepository.findByActiveTrue(pageable);
        }

        List<UserDTO> users = userPage.getContent().stream()
                .map(u -> toDTO(u, false)) // SIN imágenes para el listado
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("users", users);
        response.put("totalElements", userPage.getTotalElements());
        response.put("totalPages", userPage.getTotalPages());
        response.put("currentPage", userPage.getNumber());
        response.put("pageSize", userPage.getSize());
        response.put("hasNext", userPage.hasNext());
        response.put("hasPrevious", userPage.hasPrevious());

        return ResponseEntity.ok(response);
    }

    // --- NUEVO: Endpoint para obtener imágenes de usuarios específicos ---
    @PreAuthorize("hasRole('OWNER')")
    @GetMapping("/images")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<Long, String>> getUserImages(@RequestParam List<Long> userIds) {
        List<User> users = userRepository.findAllById(userIds);

        Map<Long, String> images = users.stream()
                .filter(user -> user.getProfileImageBase64() != null)
                .collect(Collectors.toMap(
                        User::getId,
                        User::getProfileImageBase64
                ));

        return ResponseEntity.ok(images);
    }

    // --- Crear usuario ---
    @PreAuthorize("hasRole('OWNER')")
    @PostMapping
    @Transactional
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            return ResponseEntity.badRequest().build();
        }
        Role role = roleRepository.findByNameAndActiveTrue(userDTO.getRole())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        User user = User.builder()
                .firstName(userDTO.getFirstName())
                .lastName(userDTO.getLastName())
                .email(userDTO.getEmail())
                .password(passwordEncoder.encode(
                        userDTO.getPassword() != null && !userDTO.getPassword().isBlank()
                                ? userDTO.getPassword()
                                : "password"
                ))
                .role(role)
                .profileImageBase64(userDTO.getProfileImageBase64())
                .active(true)
                .createdAt(LocalDateTime.now())
                // LOPDP Art. 9: si la cuenta se crea con constancia del
                // consentimiento del titular, se registra con su fecha.
                .consentGiven(userDTO.isConsentGiven())
                .consentDate(userDTO.isConsentGiven() ? LocalDateTime.now() : null)
                .build();

        user = userRepository.save(user);
        return ResponseEntity.ok(toDTO(user, true));
    }

    // --- Editar usuario (con imagen) ---
    @PreAuthorize("hasRole('OWNER')")
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Role role = roleRepository.findByNameAndActiveTrue(userDTO.getRole())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        if ("OWNER".equals(user.getRole().getName())) {
            user.setFirstName(userDTO.getFirstName());
            user.setLastName(userDTO.getLastName());
            user.setEmail(userDTO.getEmail());
            user.setRole(role);
            user.setProfileImageBase64(userDTO.getProfileImageBase64());
            user.setUpdatedAt(LocalDateTime.now());
        } else {
            user.setFirstName(userDTO.getFirstName());
            user.setLastName(userDTO.getLastName());
            user.setEmail(userDTO.getEmail());
            user.setRole(role);
            user.setProfileImageBase64(userDTO.getProfileImageBase64());
            user.setUpdatedAt(LocalDateTime.now());
            if (userDTO.getPassword() != null && !userDTO.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            }
        }

        user = userRepository.save(user);
        return ResponseEntity.ok(toDTO(user, true));
    }

    // --- LOPDP Art. 21: Derecho de supresión — anonimización real (admin) ---
    @PreAuthorize("hasRole('OWNER')")
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if ("OWNER".equals(user.getRole().getName())) {
            return ResponseEntity.status(403).build();
        }
        LocalDateTime now = LocalDateTime.now();
        // Anonimizar datos personales — se mantiene el registro por auditoría contable
        user.setFirstName("[Eliminado]");
        user.setLastName("[Eliminado]");
        user.setEmail("deleted_" + user.getId() + "@noreply.castillo");
        user.setProfileImageBase64(null);
        user.setActive(false);
        user.setDeletedAt(now);
        user.setUpdatedAt(now);
        // Desvincular pedidos del usuario (conservar historial sin datos personales)
        orderRepository.findByCustomer(user).forEach(order -> {
            order.setCustomer(null);
            orderRepository.save(order);
        });
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    // --- LOPDP Art. 21: Derecho de supresión — auto-eliminación del usuario autenticado ---
    @DeleteMapping("/me")
    @Transactional
    public ResponseEntity<?> deleteCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if ("OWNER".equals(user.getRole().getName())) {
            return ResponseEntity.status(403).body("El propietario no puede auto-eliminarse");
        }
        LocalDateTime now = LocalDateTime.now();
        user.setFirstName("[Eliminado]");
        user.setLastName("[Eliminado]");
        user.setEmail("deleted_" + user.getId() + "@noreply.castillo");
        user.setProfileImageBase64(null);
        user.setActive(false);
        user.setDeletedAt(now);
        user.setUpdatedAt(now);
        orderRepository.findByCustomer(user).forEach(order -> {
            order.setCustomer(null);
            orderRepository.save(order);
        });
        userRepository.save(user);
        return ResponseEntity.ok().body("Datos personales eliminados correctamente");
    }

    // --- Actualizar perfil del usuario autenticado (con imagen) ---
    @PutMapping("/me")
    @Transactional
    public ResponseEntity<UserDTO> updateCurrentUser(@RequestBody UserDTO userDTO, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String role = user.getRole().getName();
        if ("OWNER".equals(role)) {
            return ResponseEntity.status(403).build(); // O con mensaje personalizado si quieres
        }

        user.setFirstName(userDTO.getFirstName());
        user.setLastName(userDTO.getLastName());
        user.setProfileImageBase64(userDTO.getProfileImageBase64());
        user.setUpdatedAt(LocalDateTime.now());

        user = userRepository.save(user);
        return ResponseEntity.ok(toDTO(user, true));
    }


    // --- Utilidad: convertir entidad a DTO, según si se necesita imagen o no ---
    private UserDTO toDTO(User user, boolean includeImage) {
        Long restaurantId = null;
        List<Long> restaurantIds = List.of();
        if ("RESTAURANT_ADMIN".equals(user.getRole().getName())) {
            // Un administrador puede tener varias unidades a su cargo.
            var restaurants = restaurantRepository.findByAdminIdAndActiveTrue(user.getId());
            restaurantIds = restaurants.stream().map(Restaurant::getId).toList();
            if (!restaurantIds.isEmpty()) {
                restaurantId = restaurantIds.get(0);
            }
        }
        return new UserDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole().getName(),
                includeImage ? user.getProfileImageBase64() : null,
                null,
                restaurantId,
                restaurantIds,
                user.isConsentGiven(),
                user.getConsentDate()
        );
    }
    // --- LOPDP Art. 19: Derecho de acceso — historial de pedidos propios ---
    @GetMapping("/me/orders")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getMyOrders(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        List<Map<String, Object>> orders = orderRepository.findByCustomer(user).stream().map(order -> {
            Map<String, Object> o = new HashMap<>();
            o.put("id", order.getId());
            o.put("total", order.getTotal());
            o.put("status", order.getStatus());
            o.put("createdAt", order.getCreatedAt());
            o.put("restaurant", order.getRestaurant() != null ? order.getRestaurant().getName() : null);
            return o;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(orders);
    }

    // --- LOPDP Art. 22: Derecho de portabilidad — exportar todos los datos propios ---
    @GetMapping("/me/export")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> exportMyData(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Map<String, Object> data = new HashMap<>();
        // Datos personales
        Map<String, Object> personal = new HashMap<>();
        personal.put("id", user.getId());
        personal.put("firstName", user.getFirstName());
        personal.put("lastName", user.getLastName());
        personal.put("email", user.getEmail());
        personal.put("role", user.getRole().getName());
        personal.put("createdAt", user.getCreatedAt());
        personal.put("consentGiven", user.isConsentGiven());
        personal.put("consentDate", user.getConsentDate());
        data.put("personalData", personal);
        // Historial de pedidos
        List<Map<String, Object>> orders = orderRepository.findByCustomer(user).stream().map(order -> {
            Map<String, Object> o = new HashMap<>();
            o.put("id", order.getId());
            o.put("total", order.getTotal());
            o.put("status", order.getStatus());
            o.put("createdAt", order.getCreatedAt());
            o.put("restaurant", order.getRestaurant() != null ? order.getRestaurant().getName() : null);
            return o;
        }).collect(Collectors.toList());
        data.put("orders", orders);
        data.put("exportedAt", LocalDateTime.now());
        data.put("law", "Ley Orgánica de Protección de Datos Personales (LOPDP) - Ecuador");
        return ResponseEntity.ok(data);
    }

    @PreAuthorize("hasRole('OWNER')")
    @GetMapping("/all")
    @Transactional(readOnly = true)
    public ResponseEntity<List<UserDTO>> getAllUsersByRole(@RequestParam(name = "role", required = false) String role) {
        List<User> users;
        if (role != null) {
            users = userRepository.findByRoleNameAndActiveTrue(role, Pageable.unpaged()).getContent();
        } else {
            users = userRepository.findByActiveTrue(Pageable.unpaged()).getContent();
        }
        List<UserDTO> dtos = users.stream().map(u -> toDTO(u, false)).toList();
        return ResponseEntity.ok(dtos);
    }

    // --- Cambiar contraseña del usuario autenticado ---
    @PutMapping("/change-password")
    @Transactional
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> payload,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("No autenticado");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String role = user.getRole().getName();
        if ("OWNER".equals(role)) {
            return ResponseEntity.status(403).body("No autorizado para cambiar contraseña");
        }

        String oldPassword = payload.get("oldPassword");
        String newPassword = payload.get("newPassword");

        if (oldPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Campos obligatorios faltantes");
        }

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.status(403).body("La contraseña actual no es correcta");
        }
        if (oldPassword.equals(newPassword)) {
            return ResponseEntity.badRequest().body("La nueva contraseña no puede ser igual a la anterior");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return ResponseEntity.ok().body("Contraseña actualizada");
    }

}