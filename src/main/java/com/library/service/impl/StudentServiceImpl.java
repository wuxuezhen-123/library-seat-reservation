package com.library.service.impl;

import com.library.entity.Reservation;
import com.library.entity.Student;
import com.library.entity.ViolateRecord;
import com.library.mapper.ReservationMapper;
import com.library.mapper.StudentMapper;
import com.library.mapper.ViolateRecordMapper;
import com.library.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class StudentServiceImpl implements StudentService {

    @Autowired
    private StudentMapper studentMapper;
    @Autowired
    private ReservationMapper reservationMapper;
    @Autowired
    private ViolateRecordMapper violateRecordMapper;

    @Override
    public Student getStudentInfo(String stuId) {
        Student student = studentMapper.findByStuId(stuId);
        if (student == null) {
            throw new RuntimeException("学生不存在");
        }
        return student;
    }

    @Override
    public List<Reservation> getMyReservations(String stuId) {
        return reservationMapper.findByStuId(stuId);
    }

    @Override
    public List<ViolateRecord> getMyViolations(String stuId) {
        return violateRecordMapper.findByStuId(stuId);
    }

    @Override
    public boolean isBlacklisted(String stuId) {
        Student student = studentMapper.findByStuId(stuId);
        if (student == null) return false;
        if (student.getIsBlacklisted() == 1 && student.getBanExpireTime() != null) {
            return student.getBanExpireTime().isAfter(LocalDateTime.now());
        }
        return false;
    }
}