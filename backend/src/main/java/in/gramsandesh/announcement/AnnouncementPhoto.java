package in.gramsandesh.announcement;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "announcement_photos")
public class AnnouncementPhoto {
    @Id
    private Long announcementId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "announcement_id")
    private Announcement announcement;

    @Column(nullable = false)
    private byte[] data;

    @Column(name = "content_type", nullable = false, length = 32)
    private String contentType;

    protected AnnouncementPhoto() {
    }

    public AnnouncementPhoto(Announcement announcement, byte[] data, String contentType) {
        this.announcement = announcement;
        this.data = data;
        this.contentType = contentType;
    }

    public Long getAnnouncementId() { return announcementId; }
    public byte[] getData() { return data; }
    public String getContentType() { return contentType; }
    public void replaceData(byte[] data, String contentType) {
        this.data = data;
        this.contentType = contentType;
    }
}
