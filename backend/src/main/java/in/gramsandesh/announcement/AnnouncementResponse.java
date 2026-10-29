package in.gramsandesh.announcement;

import java.time.Instant;
import java.time.LocalDateTime;

public record AnnouncementResponse(
        Long id,
        String title,
        String message,
        AnnouncementCategory category,
        AnnouncementPriority priority,
        String area,
        String author,
        LocalDateTime startsAt,
        Instant createdAt,
        Instant updatedAt,
        String photoUrl,
        WaterUpdateType waterUpdateType
) {
    public static AnnouncementResponse from(Announcement announcement) {
        return new AnnouncementResponse(
                announcement.getId(),
                announcement.getTitle(),
                announcement.getMessage(),
                announcement.getCategory(),
                announcement.getPriority(),
                announcement.getArea(),
                announcement.getAuthor(),
                announcement.getStartsAt(),
                announcement.getCreatedAt(),
                announcement.getUpdatedAt(),
                announcement.hasPhoto() ? "/api/announcements/" + announcement.getId() + "/photo" : null,
                announcement.getWaterUpdateType()
        );
    }
}
