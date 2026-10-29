package in.gramsandesh.announcement;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/complaints/{complaintId}/messages")
public class ComplaintChatController {
    private final IssueReportRepository complaints;
    private final UserAccountRepository accounts;
    private final ComplaintMessageRepository messages;

    public ComplaintChatController(IssueReportRepository complaints,
                                   UserAccountRepository accounts,
                                   ComplaintMessageRepository messages) {
        this.complaints = complaints;
        this.accounts = accounts;
        this.messages = messages;
    }

    @GetMapping
    public List<ComplaintMessageResponse> list(@PathVariable Long complaintId, Authentication authentication) {
        requireAccessibleComplaint(complaintId, authentication);
        return messages.findByComplaintIdOrderByCreatedAtAsc(complaintId)
                .stream()
                .map(ComplaintMessageResponse::from)
                .toList();
    }

    @PostMapping
    public ComplaintMessageResponse send(@PathVariable Long complaintId,
                                         @Valid @RequestBody CreateComplaintMessageRequest request,
                                         Authentication authentication) {
        IssueReport complaint = requireAccessibleComplaint(complaintId, authentication);
        if (complaint.getStatus() == ComplaintStatus.RESOLVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "निकाली निघालेल्या तक्रारीची चर्चा बंद आहे.");
        }
        UserAccount sender = currentUser(authentication);
        ComplaintMessage message = messages.save(new ComplaintMessage(complaint, sender, request.body().trim()));
        return ComplaintMessageResponse.from(message);
    }

    private IssueReport requireAccessibleComplaint(Long complaintId, Authentication authentication) {
        UserAccount user = currentUser(authentication);
        if (user.getRole() == UserRole.ADMIN) {
            return complaints.findById(complaintId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "तक्रार सापडली नाही."));
        }
        return complaints.findByIdAndReporterId(complaintId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "तक्रार सापडली नाही."));
    }

    private UserAccount currentUser(Authentication authentication) {
        return accounts.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
}
