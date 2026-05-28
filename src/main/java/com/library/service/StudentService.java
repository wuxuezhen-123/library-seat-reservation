package com.library.service;

import com.library.entity.Reservation;
import com.library.entity.Student;
import com.library.entity.ViolateRecord;
import java.util.List;

public interface StudentService {
    Student getStudentInfo(String stuId);
    List<Reservation> getMyReservations(String stuId);
    List<ViolateRecord> getMyViolations(String stuId);
    boolean isBlacklisted(String stuId);
}