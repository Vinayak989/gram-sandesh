package in.gramsandesh.announcement;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminAccountBootstrap implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminAccountBootstrap.class);

    private final UserAccountRepository accounts;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public AdminAccountBootstrap(
            UserAccountRepository accounts,
            PasswordEncoder passwordEncoder,
            @Value("${gram-sandesh.admin.username:Masuchiwadi}") String username,
            @Value("${gram-sandesh.admin.password:}") String password) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (accounts.existsByUsernameIgnoreCase(username)) return;
        if (password == null || password.isBlank()) {
            log.warn("Admin account was not created. Set gram-sandesh.admin.password in backend/local-secrets.properties.");
            return;
        }
        accounts.save(new UserAccount(username, "ग्रामपंचायत प्रशासक", passwordEncoder.encode(password), UserRole.ADMIN));
        log.info("Seeded the Gram Panchayat administrator account.");
    }
}
