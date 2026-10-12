package com.example.campuscare.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "departments", uniqueConstraints = @UniqueConstraint(name = "uk_departments_name", columnNames = "name"))
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "department_id")
    private Long departmentId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    public Department() { }

    public Department(String name, String contactEmail) {
        this.name = name;
        this.contactEmail = contactEmail;
    }

    public Long getDepartmentId() { return departmentId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
}
