package in.gramsandesh.announcement;

import java.time.Instant;

public record ComplaintMessageResponse(
        Long id,
        Long complaintId,
        String senderName,
        String senderUsername,
        UserRole senderRole,
        String body,
        Instant createdAt
) {
    public static ComplaintMessageResponse from(ComplaintMessage message) {
        UserAccount sender = message.getSender();
        return new ComplaintMessageResponse(
                message.getId(),
                message.getComplaint().getId(),
                sender.getFullName(),
                sender.getUsername(),
                sender.getRole(),
                message.getBody(),
                message.getCreatedAt()
        );
    }
}
