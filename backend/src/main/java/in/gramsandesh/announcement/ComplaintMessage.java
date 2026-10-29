package in.gramsandesh.announcement;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "complaint_messages")
public class ComplaintMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "complaint_id", nullable = false)
    private IssueReport complaint;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private UserAccount sender;

    @Column(nullable = false, length = 1000)
    private String body;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected ComplaintMessage() {
    }

    public ComplaintMessage(IssueReport complaint, UserAccount sender, String body) {
        this.complaint = complaint;
        this.sender = sender;
        this.body = body;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public IssueReport getComplaint() { return complaint; }
    public UserAccount getSender() { return sender; }
    public String getBody() { return body; }
    public Instant getCreatedAt() { return createdAt; }
}
