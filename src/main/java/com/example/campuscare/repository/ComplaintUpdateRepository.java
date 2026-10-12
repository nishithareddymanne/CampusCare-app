package com.example.campuscare.repository;

import com.example.campuscare.entity.ComplaintUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintUpdateRepository extends JpaRepository<ComplaintUpdate, Long> {
    List<ComplaintUpdate> findByComplaint_ComplaintIdOrderByUpdatedAtAscUpdateIdAsc(Long complaintId);
    List<ComplaintUpdate> findTop50ByOrderByUpdatedAtDescUpdateIdDesc();
}
