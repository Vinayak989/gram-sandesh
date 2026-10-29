package in.gramsandesh.announcement;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_accounts")
public class UserAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String username;

    @Column(nullable = false, length = 70)
    private String fullName;

    @Column(length = 16)
    private String mobileNumber;

    @Column(length = 32)
    private String wardNo;

    @Column(length = 80)
    private String villageName;

    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private UserRole role;

    protected UserAccount() {
    }

    public UserAccount(String username, String fullName, String passwordHash, UserRole role) {
        this(username, fullName, null, null, passwordHash, role);
    }

    public UserAccount(String username, String fullName, String mobileNumber, String wardNo, String passwordHash, UserRole role) {
        this(username, fullName, mobileNumber, wardNo, null, passwordHash, role);
    }

    public UserAccount(String username, String fullName, String mobileNumber, String wardNo, String villageName, String passwordHash, UserRole role) {
        this.username = username;
        this.fullName = fullName;
        this.mobileNumber = mobileNumber;
        this.wardNo = wardNo;
        this.villageName = villageName;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getFullName() { return fullName; }
    public String getMobileNumber() { return mobileNumber; }
    public String getWardNo() { return wardNo; }
    public String getVillageName() { return villageName; }
    public String getPasswordHash() { return passwordHash; }
    public UserRole getRole() { return role; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }
    public void setWardNo(String wardNo) { this.wardNo = wardNo; }
    public void setVillageName(String villageName) { this.villageName = villageName; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}
