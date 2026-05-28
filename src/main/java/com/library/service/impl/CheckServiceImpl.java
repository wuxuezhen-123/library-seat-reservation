package com.library.service.impl;

import com.library.entity.Reservation;
import com.library.entity.TimeSlot;
import com.library.mapper.ReservationMapper;
import com.library.mapper.SeatMapper;
import com.library.mapper.TimeSlotMapper;
import com.library.service.CheckService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class CheckServiceImpl implements CheckService {

    @Autowired
    private ReservationMapper reservationMapper;
    @Autowired
    private TimeSlotMapper timeSlotMapper;
    @Autowired
    private SeatMapper seatMapper;   // 补全：注入 SeatMapper

    @Override
    @Transactional
    public void checkin(Integer resId, String stuId, String adminId) {
        // 1. 查询预约记录
        Reservation reservation = reservationMapper.findById(resId);
        if (reservation == null) {
            throw new RuntimeException("预约记录不存在");
        }
        // 2. 校验学号是否匹配
        if (!reservation.getStuId().equals(stuId)) {
            throw new RuntimeException("学号与预约人不符");
        }
        // 3. 校验状态是否为“已预约”（0）
        if (reservation.getResStatus() != 0) {
            throw new RuntimeException("当前状态无法签到");
        }
        // 4. 校验签到时间是否在允许范围内（开始时间前后30分钟）
        TimeSlot slot = timeSlotMapper.findById(reservation.getSlotId());
        if (slot == null) {
            throw new RuntimeException("时段不存在");
        }
        LocalDateTime startTime = LocalDateTime.of(reservation.getResDate(), slot.getStartTime());
        LocalDateTime endTime = LocalDateTime.of(reservation.getResDate(), slot.getEndTime());
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(startTime.minusMinutes(30)) || now.isAfter(endTime)) {
            throw new RuntimeException("不在签到时间段内（开始前30分钟至结束后）");
        }
        // 5. 更新预约状态为“已签到”（1），记录签到时间
        reservationMapper.checkin(resId, now);
        // 6. 更新座位状态为“已占用”（2）
        seatMapper.updateStatus(reservation.getSeatId(), 2);
    }

    @Override
    @Transactional
    public void checkout(Integer resId, String stuId, String adminId) {
        // 1. 查询预约记录
        Reservation reservation = reservationMapper.findById(resId);
        if (reservation == null) {
            throw new RuntimeException("预约记录不存在");
        }
        // 2. 校验学号是否匹配
        if (!reservation.getStuId().equals(stuId)) {
            throw new RuntimeException("学号与预约人不符");
        }
        // 3. 校验状态是否为“已签到”（1）
        if (reservation.getResStatus() != 1) {
            throw new RuntimeException("未签到或已签退");
        }
        // 4. 签退时间任意，只要在结束时间之后（也可以不做限制，由管理员操作）
        reservationMapper.checkout(resId, LocalDateTime.now());
        // 5. 释放座位状态为“空闲”（0）
        seatMapper.updateStatus(reservation.getSeatId(), 0);
    }
}