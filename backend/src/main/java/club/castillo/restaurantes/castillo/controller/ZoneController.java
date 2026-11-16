package club.castillo.restaurantes.castillo.controller;

import club.castillo.restaurantes.castillo.dto.ZoneDTO;
import club.castillo.restaurantes.castillo.model.Zone;
import club.castillo.restaurantes.castillo.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/zones")
@RequiredArgsConstructor
public class ZoneController {

    private final ZoneRepository zoneRepository;

    private ZoneDTO toDTO(Zone z) {
        return new ZoneDTO(
                z.getId(),
                z.getName(),
                z.getDescription(),
                z.getCreatedAt() != null ? z.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : "",
                z.isActive()
        );
    }

    // La consulta permanece publica: la vista de restaurantes del socio y del
    // invitado la utiliza para agrupar las unidades por etapa del complejo, y
    // solo expone el nombre y la descripcion de cada zona.
    @GetMapping
    public ResponseEntity<List<ZoneDTO>> getAllZones() {
        List<ZoneDTO> dtos = zoneRepository.findAll()
                .stream()
                .filter(Zone::isActive)
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ZoneDTO> createZone(@RequestBody ZoneDTO dto) {
        Zone zone = Zone.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .active(true)
                .build();
        zone = zoneRepository.save(zone);
        return ResponseEntity.ok(toDTO(zone));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ZoneDTO> updateZone(@PathVariable Long id, @RequestBody ZoneDTO dto) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zone not found"));
        zone.setName(dto.getName());
        zone.setDescription(dto.getDescription());
        zoneRepository.save(zone);
        return ResponseEntity.ok(toDTO(zone));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteZone(@PathVariable Long id) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zone not found"));
        zone.setActive(false);
        zoneRepository.save(zone);
        return ResponseEntity.ok().build();
    }
}
