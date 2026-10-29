package in.gramsandesh.announcement;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/village-chat")
public class VillageChatController {
    private final UserAccountRepository accounts;
    private final VillageChatMessageRepository messages;

    public VillageChatController(UserAccountRepository accounts, VillageChatMessageRepository messages) {
        this.accounts = accounts;
        this.messages = messages;
    }

    @GetMapping("/conversations")
    public List<VillageConversationResponse> conversations(Authentication authentication) {
        requireAdmin(currentUser(authentication));
        return accounts.findByRoleOrderByFullNameAsc(UserRole.VILLAGER).stream()
                .map(villager -> VillageConversationResponse.from(
                        villager,
                        messages.findTopByVillagerIdOrderByCreatedAtDesc(villager.getId()).orElse(null)))
                .toList();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication authentication) {
        UserAccount user = currentUser(authentication);
        long count = user.getRole() == UserRole.ADMIN
                ? messages.countBySender_RoleAndReadAtIsNull(UserRole.VILLAGER)
                : messages.countByVillager_IdAndSender_RoleAndReadAtIsNull(user.getId(), UserRole.ADMIN);
        return Map.of("count", count);
    }

    @PostMapping("/read")
    public Map<String, Integer> markVillagerMessagesRead(Authentication authentication) {
        UserAccount villager = requireVillager(currentUser(authentication));
        int updated = messages.markUnreadAsRead(villager.getId(), UserRole.ADMIN, Instant.now());
        return Map.of("updated", updated);
    }

    @PostMapping("/conversations/{villagerId}/read")
    public Map<String, Integer> markAdminMessagesRead(@PathVariable Long villagerId,
                                                      Authentication authentication) {
        requireAdmin(currentUser(authentication));
        UserAccount villager = requireVillagerAccount(villagerId);
        int updated = messages.markUnreadAsRead(villager.getId(), UserRole.VILLAGER, Instant.now());
        return Map.of("updated", updated);
    }

    @GetMapping("/messages")
    public List<VillageChatMessageResponse> villagerMessages(Authentication authentication) {
        UserAccount villager = requireVillager(currentUser(authentication));
        return listMessages(villager);
    }

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public VillageChatMessageResponse sendAsVillager(@Valid @RequestBody CreateComplaintMessageRequest request,
                                                     Authentication authentication) {
        UserAccount villager = requireVillager(currentUser(authentication));
        return saveMessage(villager, villager, request.body());
    }

    @GetMapping("/conversations/{villagerId}/messages")
    public List<VillageChatMessageResponse> adminMessages(@PathVariable Long villagerId,
                                                          Authentication authentication) {
        requireAdmin(currentUser(authentication));
        return listMessages(requireVillagerAccount(villagerId));
    }

    @PostMapping("/conversations/{villagerId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public VillageChatMessageResponse sendAsAdmin(@PathVariable Long villagerId,
                                                  @Valid @RequestBody CreateComplaintMessageRequest request,
                                                  Authentication authentication) {
        UserAccount admin = requireAdmin(currentUser(authentication));
        return saveMessage(requireVillagerAccount(villagerId), admin, request.body());
    }

    private List<VillageChatMessageResponse> listMessages(UserAccount villager) {
        return messages.findByVillagerIdOrderByCreatedAtAsc(villager.getId()).stream()
                .map(VillageChatMessageResponse::from)
                .toList();
    }

    private VillageChatMessageResponse saveMessage(UserAccount villager, UserAccount sender, String body) {
        VillageChatMessage message = messages.save(new VillageChatMessage(villager, sender, body.trim()));
        return VillageChatMessageResponse.from(message);
    }

    private UserAccount requireVillagerAccount(Long villagerId) {
        UserAccount villager = accounts.findById(villagerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Villager not found."));
        return requireVillager(villager);
    }

    private UserAccount requireVillager(UserAccount user) {
        if (user.getRole() != UserRole.VILLAGER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This chat is available to village members.");
        }
        return user;
    }

    private UserAccount requireAdmin(UserAccount user) {
        if (user.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the village administrator can access this inbox.");
        }
        return user;
    }

    private UserAccount currentUser(Authentication authentication) {
        return accounts.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
}
