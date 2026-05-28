package com.library.service.impl;

import com.library.entity.*;
import com.library.mapper.*;
import com.library.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AdminServiceImpl implements AdminService {

    @Autowired private AreaMapper areaMapper;
    @Autowired private SeatMapper seatMapper;
    @Autowired private TimeSlotMapper timeSlotMapper;
    @Autowired private StudentMapper studentMapper;

    @Override
    public void addArea(Area area) {
        areaMapper.insert(area);
    }

    @Override
    public void updateArea(Area area) {
        areaMapper.update(area);
    }

    @Override
    public void deleteArea(Integer areaId) {
        // 现在 seatMapper.countByAreaId 方法已存在
        if (seatMapper.countByAreaId(areaId) > 0) {
            throw new RuntimeException("该区域下存在座位，请先删除座位");
        }
        areaMapper.deleteById(areaId);
    }

    @Override
    public List<Area> listAllAreas() {
        return areaMapper.findAll();
    }

    @Override
    public void addSeat(Seat seat) {
        seatMapper.insert(seat);
    }

    @Override
    public void updateSeatStatus(Integer seatId, Integer status) {
        seatMapper.updateStatus(seatId, status);
    }

    @Override
    public void deleteSeat(Integer seatId) {
        seatMapper.deleteById(seatId);
    }

    @Override
    public List<Seat> listSeatsByArea(Integer areaId) {
        return seatMapper.findByAreaId(areaId);
    }

    @Override
    public void addTimeSlot(TimeSlot slot) {
        timeSlotMapper.insert(slot);
    }

    @Override
    public void updateTimeSlot(TimeSlot slot) {
        timeSlotMapper.update(slot);
    }

    @Override
    public void enableTimeSlot(Integer slotId, Integer status) {
        timeSlotMapper.updateStatus(slotId, status);
    }

    @Override
    public List<TimeSlot> listAllTimeSlots() {
        return timeSlotMapper.findAll();
    }

    @Override
    public List<Student> listAllStudents() {
        return studentMapper.findAll();
    }

    @Override
    @Transactional
    public void deleteStudent(String stuId) {
        // 这里可以添加检查是否有未完成预约等逻辑，暂时简单删除
        studentMapper.deleteByStuId(stuId);
    }

    @Override
    @Transactional
    public void resetViolation(String stuId) {
        studentMapper.clearBlacklist(stuId);
    }
}