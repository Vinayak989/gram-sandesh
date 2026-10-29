package in.gramsandesh.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CreateAnnouncementRequest(
        @NotBlank @Size(max = 90) String title,
        @NotBlank @Size(max = 600) String message,
        @NotNull AnnouncementCategory category,
        WaterUpdateType waterUpdateType,
        AnnouncementPriority priority,
        @Size(max = 80) String area,
        @Size(max = 60) String author,
        LocalDateTime startsAt,
        @Size(max = 2_100_000) String photoDataUrl
) {
}
