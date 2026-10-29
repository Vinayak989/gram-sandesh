package in.gramsandesh.announcement;

public record UserAccountResponse(Long id, String username, String fullName, String mobileNumber, String wardNo, String villageName, UserRole role) {
    public static UserAccountResponse from(UserAccount account) {
        return new UserAccountResponse(account.getId(), account.getUsername(), account.getFullName(), account.getMobileNumber(), account.getWardNo(), account.getVillageName(), account.getRole());
    }
}
