package com.example.campuscare.repository;

import com.example.campuscare.entity.Complaint;
import com.example.campuscare.entity.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long>, JpaSpecificationExecutor<Complaint> {

    List<Complaint> findByUser_UserIdOrderByCreatedAtDesc(Long userId);

    long countByUser_UserId(Long userId);

    long countByUser_UserIdAndStatus(Long userId, ComplaintStatus status);

    long countByStatus(ComplaintStatus status);

    Optional<Complaint> findByImageUrl(String imageUrl);

    @Query("select c.category, count(c) from Complaint c group by c.category")
    List<Object[]> countGroupedByCategory();

    @Query("select d.name, count(c) from Complaint c join c.department d group by d.name")
    List<Object[]> countGroupedByDepartment();
}
