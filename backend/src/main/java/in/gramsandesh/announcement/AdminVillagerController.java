package in.gramsandesh.announcement;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/villagers")
public class AdminVillagerController {
    private final UserAccountRepository accounts;

    public AdminVillagerController(UserAccountRepository accounts) {
        this.accounts = accounts;
    }

    @GetMapping
    public List<VillagerDetailsResponse> listVillagers(Authentication authentication) {
        UserAccount viewer = accounts.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (viewer.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the administrator can view registered villagers.");
        }
        return accounts.findByRoleOrderByFullNameAsc(UserRole.VILLAGER).stream()
                .map(VillagerDetailsResponse::from)
                .toList();
    }
}
