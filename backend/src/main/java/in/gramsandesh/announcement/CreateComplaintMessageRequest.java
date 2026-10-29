package in.gramsandesh.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateComplaintMessageRequest(@NotBlank @Size(max = 1000) String body) {
}
