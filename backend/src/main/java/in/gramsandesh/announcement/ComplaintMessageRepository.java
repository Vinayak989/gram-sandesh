package in.gramsandesh.announcement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintMessageRepository extends JpaRepository<ComplaintMessage, Long> {
    List<ComplaintMessage> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);
}
