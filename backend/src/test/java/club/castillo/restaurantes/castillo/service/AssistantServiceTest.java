package club.castillo.restaurantes.castillo.service;

import club.castillo.restaurantes.castillo.dto.AssistantRequest;
import club.castillo.restaurantes.castillo.model.MenuItem;
import club.castillo.restaurantes.castillo.model.Restaurant;
import club.castillo.restaurantes.castillo.model.RestaurantStatus;
import club.castillo.restaurantes.castillo.model.Zone;
import club.castillo.restaurantes.castillo.repository.MenuItemRepository;
import club.castillo.restaurantes.castillo.repository.RestaurantRepository;
import club.castillo.restaurantes.castillo.repository.ZoneRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para el servicio AssistantService.
 *
 * Se validan tres aspectos que no dependen del servicio externo:
 *  1. La disponibilidad del asistente segun exista o no una credencial configurada,
 *     y el rechazo de la consulta cuando falta.
 *  2. El recorte del historial de la conversacion, que debe descartar los turnos
 *     vacios y comenzar siempre en una intervencion del usuario.
 *  3. El armado de la instruccion de sistema, que debe incorporar las zonas, los
 *     restaurantes y los platos vigentes tomados de la base de datos.
 *
 * Se utilizan mocks de los repositorios, de modo que las pruebas se ejecuten de
 * forma aislada y sin conexion a la base ni al servicio de lenguaje.
 */
class AssistantServiceTest {

    private RestaurantRepository restaurantRepository;
    private MenuItemRepository menuItemRepository;
    private ZoneRepository zoneRepository;

    @BeforeEach
    void setUp() {
        restaurantRepository = mock(RestaurantRepository.class);
        menuItemRepository = mock(MenuItemRepository.class);
        zoneRepository = mock(ZoneRepository.class);
    }

    private AssistantService crearServicio(String apiKey) {
        return new AssistantService(
                restaurantRepository,
                menuItemRepository,
                zoneRepository,
                apiKey,
                "gemini-3.6-flash",
                "http://localhost:0/models/"
        );
    }

    /**
     * Sin credencial configurada el asistente se declara no disponible y la
     * consulta se rechaza, para que la aplicacion del cliente responda con su
     * repertorio local en lugar de quedar a la espera.
     */
    @Test
    void sinCredencialElAsistenteNoEstaDisponible() {
        AssistantService servicio = crearServicio("");

        assertFalse(servicio.estaDisponible());
        assertThrows(
                AssistantService.AsistenteNoDisponibleException.class,
                () -> servicio.responder("¿Cuáles son los horarios?", List.of())
        );
    }

    /**
     * Con credencial configurada el asistente se declara disponible, pero un
     * mensaje vacio sigue rechazandose antes de consultar el servicio externo.
     */
    @Test
    void conCredencialElAsistenteEstaDisponibleYRechazaMensajeVacio() {
        AssistantService servicio = crearServicio("clave-de-prueba");

        assertTrue(servicio.estaDisponible());
        assertThrows(
                AssistantService.AsistenteNoDisponibleException.class,
                () -> servicio.responder("   ", List.of())
        );
    }

    /**
     * El historial se limpia de turnos vacios y no puede comenzar con una
     * intervencion del modelo, como el saludo inicial de la ventana del chat.
     */
    @Test
    void elHistorialDescartaElSaludoInicialYLosTurnosVacios() {
        AssistantService servicio = crearServicio("clave-de-prueba");

        List<AssistantRequest.Turn> historial = List.of(
                new AssistantRequest.Turn("model", "¡Hola! Bienvenido al Club Castillo."),
                new AssistantRequest.Turn("user", "   "),
                new AssistantRequest.Turn("user", "¿Qué restaurantes hay?"),
                new AssistantRequest.Turn("model", "Tenemos tres unidades.")
        );

        List<AssistantRequest.Turn> recorte = servicio.recortarHistorial(historial);

        assertEquals(2, recorte.size());
        assertEquals("user", recorte.get(0).getRole());
        assertEquals("¿Qué restaurantes hay?", recorte.get(0).getText());
        assertTrue(servicio.recortarHistorial(null).isEmpty());
    }

    /**
     * La instruccion de sistema debe llevar el catalogo real: la zona, el
     * restaurante con su estado y los platos disponibles con su precio.
     */
    @Test
    void laInstruccionIncorporaElCatalogoVigente() {
        Zone zona = Zone.builder()
                .id(1L)
                .name("Etapa 1")
                .description("Zona de la piscina principal")
                .active(true)
                .build();

        Restaurant restaurante = Restaurant.builder()
                .id(10L)
                .name("Restaurante Etapa 1")
                .description("Comida tradicional")
                .status(RestaurantStatus.OPEN)
                .zone(zona)
                .build();

        MenuItem disponible = MenuItem.builder()
                .id(100L)
                .name("Seco de pollo")
                .price(new BigDecimal("8.50"))
                .restaurant(restaurante)
                .active(true)
                .available(true)
                .build();

        MenuItem agotado = MenuItem.builder()
                .id(101L)
                .name("Fritada")
                .price(new BigDecimal("9.00"))
                .restaurant(restaurante)
                .active(true)
                .available(false)
                .build();

        when(zoneRepository.findAll()).thenReturn(List.of(zona));
        when(restaurantRepository.findByActiveTrue()).thenReturn(List.of(restaurante));
        when(menuItemRepository.findByRestaurantIdAndActiveTrue(10L))
                .thenReturn(List.of(disponible, agotado));

        String instruccion = crearServicio("clave-de-prueba").construirInstruccion();

        assertTrue(instruccion.contains("Etapa 1"));
        assertTrue(instruccion.contains("Restaurante Etapa 1"));
        assertTrue(instruccion.contains("abierto"));
        assertTrue(instruccion.contains("Seco de pollo"));
        assertTrue(instruccion.contains("8.50"));
        // Un plato marcado como no disponible no debe ofrecerse al socio.
        assertFalse(instruccion.contains("Fritada"));
    }
}
