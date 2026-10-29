package in.gramsandesh.announcement;

import java.time.Instant;

public record IssueReportResponse(
        Long id,
        String title,
        String details,
        ComplaintCategory category,
        String area,
        String reporterName,
        String reporterMobile,
        String reporterWard,
        Long reporterId,
        ComplaintStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static IssueReportResponse from(IssueReport report) {
        UserAccount reporter = report.getReporter();
        return new IssueReportResponse(
                report.getId(),
                report.getTitle(),
                report.getDetails(),
                report.getCategory(),
                report.getArea(),
                reporter == null ? "गावकरी" : reporter.getFullName(),
                reporter == null ? null : reporter.getMobileNumber(),
                reporter == null ? null : reporter.getWardNo(),
                reporter == null ? null : reporter.getId(),
                report.getStatus(),
                report.getCreatedAt(),
                report.getUpdatedAt()
        );
    }
}
