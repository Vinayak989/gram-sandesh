package in.gramsandesh.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 70) String fullName,
        @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{3,32}", message = "Username must use 3–32 English letters, numbers, _ or -") String username,
        @NotBlank @Pattern(regexp = "[6-9][0-9]{9}", message = "Mobile number must be a 10-digit Indian mobile number") String mobileNumber,
        @NotBlank @Size(max = 32) String wardNo,
        @NotBlank @Size(max = 80) String villageName,
        @NotBlank @Size(min = 8, max = 72) String password
) {
}
