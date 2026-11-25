package club.castillo.restaurantes.castillo.dto;

import club.castillo.restaurantes.castillo.model.OrderStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long restaurantId;
    private List<OrderItemDTO> items;
    private List<OrderBeverageDTO> beverages;
    private OrderStatus status;
    private BigDecimal total;
    // Sin la anotacion, Jackson publica el campo como "guest" (deriva el nombre
    // del getter isGuest()) y el reporte del propietario, que lee "isGuest",
    // contaba todos los pedidos como de socios.
    @JsonProperty("isGuest")
    private boolean isGuest;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 