package in.gramsandesh.announcement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IssueReportRepository extends JpaRepository<IssueReport, Long> {
    List<IssueReport> findByReporterIdOrderByCreatedAtDesc(Long reporterId);
    Optional<IssueReport> findByIdAndReporterId(Long id, Long reporterId);
}
