package in.gramsandesh.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 70) String fullName,
        @NotBlank @Pattern(regexp = "[6-9][0-9]{9}") String mobileNumber,
        @NotBlank @Size(max = 32) String wardNo,
        @NotBlank @Size(max = 80) String villageName
) {
}
