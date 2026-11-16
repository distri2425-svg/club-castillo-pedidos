package club.castillo.restaurantes.castillo.service;

import club.castillo.restaurantes.castillo.dto.AssistantRequest;
import club.castillo.restaurantes.castillo.model.MenuItem;
import club.castillo.restaurantes.castillo.model.Restaurant;
import club.castillo.restaurantes.castillo.model.RestaurantStatus;
import club.castillo.restaurantes.castillo.model.Zone;
import club.castillo.restaurantes.castillo.repository.MenuItemRepository;
import club.castillo.restaurantes.castillo.repository.RestaurantRepository;
import club.castillo.restaurantes.castillo.repository.ZoneRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Asistente virtual del club.
 *
 * La consulta al modelo de lenguaje se realiza desde el servidor y no desde el
 * navegador, de modo que la credencial del servicio permanezca en el entorno del
 * backend: en la implementacion anterior viajaba dentro del paquete de la
 * aplicacion web y quedaba a la vista de cualquier visitante. Ademas, al
 * resolverse aqui, la consulta puede acompañarse del catalogo real de zonas,
 * restaurantes y platos, con lo que el asistente responde sobre la operacion
 * vigente del club y no unicamente con conocimiento general.
 */
@Service
public class AssistantService {

    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);

    /** Longitud maxima admitida para el mensaje del usuario. */
    private static final int LIMITE_MENSAJE = 500;

    /** Cantidad de turnos previos que se conservan del hilo de la conversacion. */
    private static final int LIMITE_HISTORIAL = 6;

    /** Platos que se listan por restaurante al describir la carta. */
    private static final int PLATOS_POR_RESTAURANTE = 10;

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final ZoneRepository zoneRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient;

    private final String apiKey;
    private final String modelo;
    /** Direccion del servicio. Se declara por configuracion para poder sustituirla en las pruebas. */
    private final String urlBase;

    public AssistantService(
            RestaurantRepository restaurantRepository,
            MenuItemRepository menuItemRepository,
            ZoneRepository zoneRepository,
            @Value("${assistant.gemini.api-key:}") String apiKey,
            @Value("${assistant.gemini.model:gemini-3.6-flash}") String modelo,
            @Value("${assistant.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models/}") String urlBase
    ) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.zoneRepository = zoneRepository;
        this.apiKey = apiKey;
        this.modelo = modelo;
        this.urlBase = urlBase;

        // Los tiempos de espera se acotan para que una demora del servicio
        // externo no deje la peticion del usuario abierta de forma indefinida.
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(5000);
        fabrica.setReadTimeout(20000);
        this.restClient = RestClient.builder().requestFactory(fabrica).build();
    }

    /** Indica si el asistente tiene credencial configurada y puede consultarse. */
    public boolean estaDisponible() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Resuelve la consulta del usuario contra el modelo de lenguaje.
     *
     * @throws AsistenteNoDisponibleException cuando falta la credencial o el
     *         servicio externo no responde de forma utilizable.
     */
    @Transactional(readOnly = true)
    public String responder(String mensaje, List<AssistantRequest.Turn> historial) {
        if (!estaDisponible()) {
            throw new AsistenteNoDisponibleException("El asistente no tiene credencial configurada");
        }
        if (mensaje == null || mensaje.isBlank()) {
            throw new AsistenteNoDisponibleException("El mensaje esta vacio");
        }

        String consulta = mensaje.length() > LIMITE_MENSAJE
                ? mensaje.substring(0, LIMITE_MENSAJE)
                : mensaje;

        try {
            JsonNode respuesta = restClient.post()
                    .uri(urlBase + modelo + ":generateContent")
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(construirPeticion(consulta, historial))
                    .retrieve()
                    .body(JsonNode.class);

            String texto = extraerTexto(respuesta);
            if (texto == null || texto.isBlank()) {
                throw new AsistenteNoDisponibleException("El servicio no devolvio contenido");
            }
            return texto.trim();
        } catch (AsistenteNoDisponibleException e) {
            throw e;
        } catch (Exception e) {
            // Se deja constancia del motivo real: sin este registro, un rechazo
            // del servicio externo resulta indistinguible de una credencial
            // ausente, ya que en ambos casos el cliente recibe la misma
            // respuesta. El mensaje no contiene la credencial.
            log.warn("El asistente no pudo resolver la consulta: {}", e.getMessage());
            throw new AsistenteNoDisponibleException("No fue posible consultar el asistente", e);
        }
    }

    // ── Armado de la peticion ────────────────────────────────────────

    private ObjectNode construirPeticion(String mensaje, List<AssistantRequest.Turn> historial) {
        ObjectNode cuerpo = objectMapper.createObjectNode();

        ObjectNode instruccion = cuerpo.putObject("system_instruction");
        instruccion.putArray("parts").addObject().put("text", construirInstruccion());

        ArrayNode contenidos = cuerpo.putArray("contents");
        for (AssistantRequest.Turn turno : recortarHistorial(historial)) {
            ObjectNode entrada = contenidos.addObject();
            entrada.put("role", "model".equals(turno.getRole()) ? "model" : "user");
            entrada.putArray("parts").addObject().put("text", turno.getText());
        }
        ObjectNode actual = contenidos.addObject();
        actual.put("role", "user");
        actual.putArray("parts").addObject().put("text", mensaje);

        ObjectNode configuracion = cuerpo.putObject("generationConfig");
        configuracion.put("temperature", 0.4);
        configuracion.put("maxOutputTokens", 600);

        return cuerpo;
    }

    /**
     * Conserva unicamente los ultimos turnos con contenido utilizable. El
     * historial debe comenzar en un turno del usuario, ya que el servicio
     * rechaza una conversacion que abre con una intervencion del modelo, como
     * ocurre con el saludo inicial de la ventana.
     */
    List<AssistantRequest.Turn> recortarHistorial(List<AssistantRequest.Turn> historial) {
        if (historial == null || historial.isEmpty()) {
            return List.of();
        }
        List<AssistantRequest.Turn> validos = new ArrayList<>(historial.stream()
                .filter(t -> t != null && t.getText() != null && !t.getText().isBlank())
                .toList());

        int desde = Math.max(0, validos.size() - LIMITE_HISTORIAL);
        List<AssistantRequest.Turn> recorte = new ArrayList<>(validos.subList(desde, validos.size()));

        while (!recorte.isEmpty() && "model".equals(recorte.get(0).getRole())) {
            recorte.remove(0);
        }
        return recorte;
    }

    /**
     * Instruccion de sistema con el catalogo vigente. El asistente queda acotado
     * a la operacion del club, con lo que se evita que responda sobre asuntos
     * ajenos o que invente unidades y precios que no existen.
     */
    String construirInstruccion() {
        StringBuilder texto = new StringBuilder();
        texto.append("Eres el asistente virtual del Club Campestre Castillo de Amaguaña, en el Valle ")
                .append("de los Chillos, Quito, Ecuador. Atiendes a los socios y a los invitados del club ")
                .append("dentro de su plataforma de pedidos gastronomicos.\n\n")
                .append("Reglas de la respuesta:\n")
                .append("- Responde en español, de forma breve y cordial, con viñetas cuando ayuden.\n")
                .append("- Utiliza unicamente la informacion del catalogo que se detalla mas abajo. ")
                .append("Si no dispones del dato, indicalo y sugiere consultarlo en la carta del restaurante.\n")
                .append("- No inventes restaurantes, platos, precios ni horarios.\n")
                .append("- No solicites datos personales, contraseñas ni informacion de pago.\n")
                .append("- Para hacer un pedido se escanea el codigo QR de la mesa o zona, se elige el ")
                .append("restaurante, se agregan los productos y se confirma la orden; el estado del pedido ")
                .append("se sigue en tiempo real desde la pantalla de seguimiento.\n\n");

        List<Zone> zonas = zoneRepository.findAll().stream().filter(Zone::isActive).toList();
        texto.append("Zonas del complejo:\n");
        if (zonas.isEmpty()) {
            texto.append("- No hay zonas registradas.\n");
        } else {
            for (Zone zona : zonas) {
                texto.append("- ").append(zona.getName());
                if (zona.getDescription() != null && !zona.getDescription().isBlank()) {
                    texto.append(": ").append(zona.getDescription());
                }
                texto.append('\n');
            }
        }

        List<Restaurant> restaurantes = restaurantRepository.findByActiveTrue();
        texto.append("\nRestaurantes y carta:\n");
        if (restaurantes.isEmpty()) {
            texto.append("- No hay restaurantes registrados.\n");
        }
        for (Restaurant restaurante : restaurantes) {
            texto.append("- ").append(restaurante.getName())
                    .append(" (").append(restaurante.getStatus() == RestaurantStatus.OPEN ? "abierto" : "cerrado").append(")");
            if (restaurante.getZone() != null) {
                texto.append(", ubicado en ").append(restaurante.getZone().getName());
            }
            if (restaurante.getDescription() != null && !restaurante.getDescription().isBlank()) {
                texto.append(". ").append(restaurante.getDescription());
            }
            texto.append('\n');

            List<MenuItem> platos = menuItemRepository.findByRestaurantIdAndActiveTrue(restaurante.getId())
                    .stream()
                    .filter(MenuItem::isAvailable)
                    .limit(PLATOS_POR_RESTAURANTE)
                    .toList();
            for (MenuItem plato : platos) {
                texto.append("    · ").append(plato.getName())
                        .append(" — USD ").append(plato.getPrice())
                        .append('\n');
            }
        }

        return texto.toString();
    }

    // ── Lectura de la respuesta ──────────────────────────────────────

    private String extraerTexto(JsonNode respuesta) {
        if (respuesta == null) {
            return null;
        }
        JsonNode candidatos = respuesta.path("candidates");
        if (!candidatos.isArray() || candidatos.isEmpty()) {
            return null;
        }
        JsonNode partes = candidatos.get(0).path("content").path("parts");
        if (!partes.isArray()) {
            return null;
        }
        List<String> fragmentos = new ArrayList<>();
        partes.forEach(parte -> {
            String valor = parte.path("text").asText("");
            if (!valor.isBlank()) {
                fragmentos.add(valor);
            }
        });
        return String.join("", fragmentos);
    }

    /** Se lanza cuando el asistente no puede resolver la consulta. */
    public static class AsistenteNoDisponibleException extends RuntimeException {
        public AsistenteNoDisponibleException(String mensaje) {
            super(mensaje);
        }

        public AsistenteNoDisponibleException(String mensaje, Throwable causa) {
            super(mensaje, causa);
        }
    }
}
