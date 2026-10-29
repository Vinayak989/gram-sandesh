package in.gramsandesh.announcement;

public record VillagerDetailsResponse(
        Long id,
        String fullName,
        String username,
        String mobileNumber,
        String wardNo,
        String villageName
) {
    public static VillagerDetailsResponse from(UserAccount account) {
        return new VillagerDetailsResponse(
                account.getId(),
                account.getFullName(),
                account.getUsername(),
                account.getMobileNumber(),
                account.getWardNo(),
                account.getVillageName()
        );
    }
}
