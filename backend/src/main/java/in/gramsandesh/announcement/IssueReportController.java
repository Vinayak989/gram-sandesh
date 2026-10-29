package in.gramsandesh.announcement;

import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class IssueReportController {
    private final IssueReportRepository repository;
    private final UserAccountRepository accounts;

    public IssueReportController(IssueReportRepository repository, UserAccountRepository accounts) {
        this.repository = repository;
        this.accounts = accounts;
    }

    @GetMapping
    public List<IssueReportResponse> listReports(Authentication authentication) {
        UserAccount viewer = currentUser(authentication);
        List<IssueReport> reports = viewer.getRole() == UserRole.ADMIN
                ? repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                : repository.findByReporterIdOrderByCreatedAtDesc(viewer.getId());
        return reports
                .stream()
                .map(IssueReportResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IssueReportResponse createReport(@Valid @RequestBody CreateIssueReportRequest request, Authentication authentication) {
        UserAccount reporter = currentUser(authentication);
        if (reporter.getRole() != UserRole.VILLAGER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "फक्त गावकरी नवीन तक्रार नोंदवू शकतात.");
        }
        IssueReport report = new IssueReport(
                request.title().trim(),
                request.details().trim(),
                request.category(),
                request.area().trim(),
                reporter
        );
        return IssueReportResponse.from(repository.save(report));
    }

    @PostMapping("/{id}/start")
    public IssueReportResponse startWork(@PathVariable Long id, Authentication authentication) {
        if (currentUser(authentication).getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "फक्त प्रशासक तक्रारीवर काम सुरू करू शकतो.");
        }
        IssueReport report = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "तक्रार सापडली नाही."));
        if (report.getStatus() == ComplaintStatus.RESOLVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "निकाली काढलेल्या तक्रारीवर काम सुरू करता येत नाही.");
        }
        report.setStatus(ComplaintStatus.IN_PROGRESS);
        return IssueReportResponse.from(repository.save(report));
    }

    @PostMapping("/{id}/resolve")
    public IssueReportResponse resolve(@PathVariable Long id, Authentication authentication) {
        if (currentUser(authentication).getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "फक्त प्रशासक तक्रार निकाली काढू शकतो.");
        }
        IssueReport report = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "तक्रार सापडली नाही."));
        report.setStatus(ComplaintStatus.RESOLVED);
        return IssueReportResponse.from(repository.save(report));
    }

    private UserAccount currentUser(Authentication authentication) {
        return accounts.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
}
