package com.library.service.impl;

import com.library.dto.ReserveRequest;
import com.library.entity.Reservation;
import com.library.entity.Seat;
import com.library.entity.Student;
import com.library.entity.TimeSlot;
import com.library.mapper.ReservationMapper;
import com.library.mapper.SeatMapper;
import com.library.mapper.StudentMapper;
import com.library.mapper.TimeSlotMapper;
import com.library.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class ReservationServiceImpl implements ReservationService {

    @Autowired
    private ReservationMapper reservationMapper;
    @Autowired
    private SeatMapper seatMapper;
    @Autowired
    private StudentMapper studentMapper;
    @Autowired
    private TimeSlotMapper timeSlotMapper;

    @Override
    @Transactional
    public void reserve(ReserveRequest request) {
        // 1. 校验学生是否存在及黑名单状态
        Student student = studentMapper.findByStuId(request.getStuId());
        if (student == null) {
            throw new RuntimeException("学号不存在");
        }
        if (student.getIsBlacklisted() == 1 && student.getBanExpireTime() != null
                && student.getBanExpireTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("您已被列入黑名单，无法预约直至 " + student.getBanExpireTime());
        }

        // 2. 校验座位是否存在
        Seat seat = seatMapper.findById(request.getSeatId());
        if (seat == null) {
            throw new RuntimeException("座位不存在");
        }
        // 可选：校验座位是否空闲（状态0）
        if (seat.getSeatStatus() != 0) {
            throw new RuntimeException("该座位当前不可预约");
        }

        // 3. 校验时段是否启用
        TimeSlot slot = timeSlotMapper.findById(request.getSlotId());
        if (slot == null || slot.getStatus() != 1) {
            throw new RuntimeException("预约时段无效或已停用");
        }

        // 4. 校验预约日期（仅限当天或未来一天）
        LocalDate today = LocalDate.now();
        if (request.getResDate().isBefore(today) || request.getResDate().isAfter(today.plusDays(1))) {
            throw new RuntimeException("只能预约当天或明天的场次");
        }

        // 5. 唯一性校验：同一座位同一时段
        int seatCount = reservationMapper.countBySeatAndSlot(request.getSeatId(), request.getSlotId(), request.getResDate());
        if (seatCount > 0) {
            throw new RuntimeException("该座位在该时段已被预约");
        }

        // 6. 唯一性校验：同一用户同一时段
        int stuCount = reservationMapper.countByStuAndSlot(request.getStuId(), request.getSlotId(), request.getResDate());
        if (stuCount > 0) {
            throw new RuntimeException("您已预约该时段的其他座位");
        }

        // 7. 创建预约记录
        Reservation reservation = new Reservation();
        reservation.setStuId(request.getStuId());
        reservation.setSeatId(request.getSeatId());
        reservation.setSlotId(request.getSlotId());
        reservation.setResDate(request.getResDate());
        reservation.setResStatus(0); // 已预约
        reservationMapper.insert(reservation);

        // 8. 更新座位状态为已预约（1）
        seatMapper.updateStatus(request.getSeatId(), 1);
    }

    @Override
    @Transactional
    public void cancel(Integer resId, String stuId) {
        Reservation reservation = reservationMapper.findById(resId);
        if (reservation == null) {
            throw new RuntimeException("预约记录不存在");
        }
        if (!reservation.getStuId().equals(stuId)) {
            throw new RuntimeException("无权取消他人的预约");
        }
        if (reservation.getResStatus() != 0) {
            throw new RuntimeException("当前状态不可取消");
        }
        // 判断是否已开始：预约日期+时段结束时间 > 当前时间
        TimeSlot slot = timeSlotMapper.findById(reservation.getSlotId());
        LocalDateTime endDateTime = LocalDateTime.of(reservation.getResDate(), slot.getEndTime());
        if (endDateTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("场次已开始或已结束，无法取消");
        }
        // 更新预约状态为已取消（3）
        reservationMapper.cancel(resId);
        // 释放座位状态
        seatMapper.updateStatus(reservation.getSeatId(), 0);
    }

    @Override
    public List<Reservation> getReservationsBySeat(Integer seatId, LocalDate date) {
        // 可扩展实现
        return null;
    }

    @Override
    public Reservation getById(Integer resId) {
        return reservationMapper.findById(resId);
    }
}