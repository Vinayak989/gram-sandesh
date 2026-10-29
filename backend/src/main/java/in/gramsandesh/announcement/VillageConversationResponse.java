package in.gramsandesh.announcement;

import java.time.Instant;

public record VillageConversationResponse(
        Long villagerId,
        String villagerName,
        String username,
        String wardNo,
        String lastMessage,
        Instant lastMessageAt
) {
    public static VillageConversationResponse from(UserAccount villager, VillageChatMessage latest) {
        return new VillageConversationResponse(
                villager.getId(),
                villager.getFullName(),
                villager.getUsername(),
                villager.getWardNo(),
                latest == null ? null : latest.getBody(),
                latest == null ? null : latest.getCreatedAt()
        );
    }
}
