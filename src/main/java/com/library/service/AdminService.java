package com.library.service;

import com.library.entity.*;
import java.util.List;

public interface AdminService {
    void addArea(Area area);
    void updateArea(Area area);
    void deleteArea(Integer areaId);
    List<Area> listAllAreas();

    void addSeat(Seat seat);
    void updateSeatStatus(Integer seatId, Integer status);
    void deleteSeat(Integer seatId);
    List<Seat> listSeatsByArea(Integer areaId);

    void addTimeSlot(TimeSlot slot);
    void updateTimeSlot(TimeSlot slot);
    void enableTimeSlot(Integer slotId, Integer status);
    List<TimeSlot> listAllTimeSlots();

    List<Student> listAllStudents();
    void deleteStudent(String stuId);
    void resetViolation(String stuId);
}