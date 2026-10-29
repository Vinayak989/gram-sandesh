package in.gramsandesh.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateIssueReportRequest(
        @NotBlank @Size(max = 90) String title,
        @NotBlank @Size(max = 700) String details,
        @NotNull ComplaintCategory category,
        @NotBlank @Size(max = 100) String area
) {
}
