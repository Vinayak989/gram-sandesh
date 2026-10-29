package in.gramsandesh.announcement;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
public class Announcement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 90)
    private String title;

    @Column(nullable = false, length = 600)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private AnnouncementCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private AnnouncementPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private WaterUpdateType waterUpdateType;

    @Column(length = 80)
    private String area;

    @Column(nullable = false, length = 60)
    private String author;

    private LocalDateTime startsAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @Column(name = "has_photo")
    private Boolean hasPhoto = false;

    protected Announcement() {
    }

    public Announcement(String title, String message, AnnouncementCategory category,
                        AnnouncementPriority priority, String area, String author,
                        LocalDateTime startsAt) {
        this(title, message, category, priority, area, author, startsAt, false);
    }

    public Announcement(String title, String message, AnnouncementCategory category,
                        AnnouncementPriority priority, String area, String author,
                        LocalDateTime startsAt, boolean hasPhoto) {
        this(title, message, category, priority, area, author, startsAt, hasPhoto, null);
    }

    public Announcement(String title, String message, AnnouncementCategory category,
                        AnnouncementPriority priority, String area, String author,
                        LocalDateTime startsAt, boolean hasPhoto, WaterUpdateType waterUpdateType) {
        this.title = title;
        this.message = message;
        this.category = category;
        this.priority = priority;
        this.waterUpdateType = waterUpdateType;
        this.area = area;
        this.author = author;
        this.startsAt = startsAt;
        this.hasPhoto = hasPhoto;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = createdAt;
        }
    }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public AnnouncementCategory getCategory() { return category; }
    public AnnouncementPriority getPriority() { return priority; }
    public WaterUpdateType getWaterUpdateType() { return waterUpdateType; }
    public String getArea() { return area; }
    public String getAuthor() { return author; }
    public LocalDateTime getStartsAt() { return startsAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt == null ? createdAt : updatedAt; }
    public boolean hasPhoto() { return Boolean.TRUE.equals(hasPhoto); }

    public void updateContent(String title, String message, AnnouncementCategory category,
                              AnnouncementPriority priority, String area, String author,
                              LocalDateTime startsAt, boolean hasPhoto, WaterUpdateType waterUpdateType) {
        this.title = title;
        this.message = message;
        this.category = category;
        this.priority = priority;
        this.waterUpdateType = waterUpdateType;
        this.area = area;
        this.author = author;
        this.startsAt = startsAt;
        this.hasPhoto = hasPhoto;
    }
}
