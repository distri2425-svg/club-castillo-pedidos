package club.castillo.restaurantes.castillo.repository;

import club.castillo.restaurantes.castillo.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    List<Restaurant> findByActiveTrue();
    Optional<Restaurant> findByIdAndActiveTrue(Long id);
    List<Restaurant> findByZoneId(Long zoneId);
    List<Restaurant> findByAdminId(Long adminId);
    // Un mismo administrador puede conducir mas de una unidad: la chef
    // principal de las etapas 1 y 3 del complejo es el caso real.
    List<Restaurant> findByAdminIdAndActiveTrue(Long adminId);

} 