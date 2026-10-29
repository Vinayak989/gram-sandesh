package in.gramsandesh.announcement;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserAccountRepository accounts;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserAccountRepository accounts, PasswordEncoder passwordEncoder) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.noContent().build();
        }
        return accounts.findByUsernameIgnoreCase(authentication.getName())
                .<ResponseEntity<?>>map(account -> ResponseEntity.ok(UserAccountResponse.from(account)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/register")
    public ResponseEntity<UserAccountResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (accounts.existsByUsernameIgnoreCase(request.username().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "हे वापरकर्तानाव आधीपासून वापरात आहे.");
        }
        UserAccount account = accounts.save(new UserAccount(
                request.username().trim(),
                request.fullName().trim(),
                request.mobileNumber().trim(),
                request.wardNo().trim(),
                request.villageName().trim(),
                passwordEncoder.encode(request.password()),
                UserRole.VILLAGER
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(UserAccountResponse.from(account));
    }

    @PutMapping("/profile")
    public UserAccountResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
        UserAccount account = accounts.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (account.getRole() != UserRole.VILLAGER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only village members can edit a profile.");
        }
        account.setFullName(request.fullName().trim());
        account.setMobileNumber(request.mobileNumber().trim());
        account.setWardNo(request.wardNo().trim());
        account.setVillageName(request.villageName().trim());
        return UserAccountResponse.from(accounts.save(account));
    }

    @PutMapping("/password")
    public UserAccountResponse changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        UserAccount account = accounts.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (account.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the administrator can change this password.");
        }
        if (!passwordEncoder.matches(request.currentPassword(), account.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "सध्याचा पासवर्ड चुकीचा आहे.");
        }
        if (request.newPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "नवीन पासवर्ड ७२ बाइटपेक्षा लहान असावा.");
        }
        if (passwordEncoder.matches(request.newPassword(), account.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "नवीन पासवर्ड सध्याच्या पासवर्डपेक्षा वेगळा असावा.");
        }
        account.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        return UserAccountResponse.from(accounts.save(account));
    }
}
