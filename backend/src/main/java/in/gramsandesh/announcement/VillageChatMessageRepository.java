package in.gramsandesh.announcement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface VillageChatMessageRepository extends JpaRepository<VillageChatMessage, Long> {
    List<VillageChatMessage> findByVillagerIdOrderByCreatedAtAsc(Long villagerId);
    Optional<VillageChatMessage> findTopByVillagerIdOrderByCreatedAtDesc(Long villagerId);
    long countByVillager_IdAndSender_RoleAndReadAtIsNull(Long villagerId, UserRole senderRole);
    long countBySender_RoleAndReadAtIsNull(UserRole senderRole);

    @Modifying
    @Transactional
    @Query("update VillageChatMessage message set message.readAt = :readAt where message.villager.id = :villagerId and message.sender.role = :senderRole and message.readAt is null")
    int markUnreadAsRead(@Param("villagerId") Long villagerId,
                         @Param("senderRole") UserRole senderRole,
                         @Param("readAt") java.time.Instant readAt);
}
