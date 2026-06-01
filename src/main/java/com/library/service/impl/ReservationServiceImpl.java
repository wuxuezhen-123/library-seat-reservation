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
    public void reserve(ReserveRequest request, String stuId) {
        // 1. 校验学生是否存在及黑名单状态
        Student student = studentMapper.findByStuId(stuId);
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
        if (seat.getSeatStatus() != 0) {
            throw new RuntimeException("该座位当前不可预约");
        }

        // 3. 校验时段是否启用 (注意：前端字段为 timeSlotId)
        TimeSlot slot = timeSlotMapper.findById(request.getTimeSlotId());
        if (slot == null || slot.getStatus() != 1) {
            throw new RuntimeException("预约时段无效或已停用");
        }

        // 4. 校验预约日期（仅限当天或未来一天）
        LocalDate today = LocalDate.now();
        LocalDate resDate = request.getDate();   // 原 getResDate() 改为 getDate()
        if (resDate.isBefore(today) || resDate.isAfter(today.plusDays(1))) {
            throw new RuntimeException("只能预约当天或明天的场次");
        }

        // 5. 唯一性校验：同一座位同一时段
        int seatCount = reservationMapper.countBySeatAndSlot(request.getSeatId(), request.getTimeSlotId(), resDate);
        if (seatCount > 0) {
            throw new RuntimeException("该座位在该时段已被预约");
        }

        // 6. 唯一性校验：同一用户同一时段
        int stuCount = reservationMapper.countByStuAndSlot(stuId, request.getTimeSlotId(), resDate);
        if (stuCount > 0) {
            throw new RuntimeException("您已预约该时段的其他座位");
        }

        // 7. 创建预约记录
        Reservation reservation = new Reservation();
        reservation.setStuId(stuId);
        reservation.setSeatId(request.getSeatId());
        reservation.setSlotId(request.getTimeSlotId());
        reservation.setResDate(resDate);
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
        TimeSlot slot = timeSlotMapper.findById(reservation.getSlotId());
        if (slot == null) {
            throw new RuntimeException("时段信息缺失");
        }
        LocalDateTime endDateTime = LocalDateTime.of(reservation.getResDate(), slot.getEndTime());
        if (endDateTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("场次已开始或已结束，无法取消");
        }
        reservationMapper.cancel(resId);
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