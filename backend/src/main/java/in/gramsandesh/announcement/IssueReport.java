package in.gramsandesh.announcement;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "issue_reports")
public class IssueReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 90)
    private String title;

    @Column(nullable = false, length = 700)
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ComplaintCategory category;

    @Column(nullable = false, length = 100)
    private String area;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reporter_id")
    private UserAccount reporter;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ComplaintStatus status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column
    private Instant updatedAt;

    protected IssueReport() {
    }

    public IssueReport(String title, String details, ComplaintCategory category, String area, UserAccount reporter) {
        this.title = title;
        this.details = details;
        this.category = category;
        this.area = area;
        this.reporter = reporter;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (status == null) {
            status = ComplaintStatus.OPEN;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDetails() { return details; }
    public ComplaintCategory getCategory() { return category; }
    public String getArea() { return area; }
    public UserAccount getReporter() { return reporter; }
    public ComplaintStatus getStatus() { return status == null ? ComplaintStatus.OPEN : status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt == null ? createdAt : updatedAt; }
    public void setStatus(ComplaintStatus status) { this.status = status; }
}
