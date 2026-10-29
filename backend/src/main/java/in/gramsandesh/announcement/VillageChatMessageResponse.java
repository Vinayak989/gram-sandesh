package in.gramsandesh.announcement;

import java.time.Instant;

public record VillageChatMessageResponse(
        Long id,
        Long villagerId,
        String senderName,
        String senderUsername,
        UserRole senderRole,
        String body,
        Instant createdAt
) {
    public static VillageChatMessageResponse from(VillageChatMessage message) {
        UserAccount sender = message.getSender();
        return new VillageChatMessageResponse(
                message.getId(),
                message.getVillager().getId(),
                sender.getFullName(),
                sender.getUsername(),
                sender.getRole(),
                message.getBody(),
                message.getCreatedAt()
        );
    }
}
