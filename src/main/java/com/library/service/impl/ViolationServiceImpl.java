package com.library.service.impl;

import com.library.entity.Reservation;
import com.library.entity.Student;
import com.library.entity.ViolateRecord;
import com.library.mapper.ReservationMapper;
import com.library.mapper.SeatMapper;
import com.library.mapper.StudentMapper;
import com.library.mapper.ViolateRecordMapper;
import com.library.service.ViolationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ViolationServiceImpl implements ViolationService {

    @Autowired
    private ReservationMapper reservationMapper;
    @Autowired
    private ViolateRecordMapper violateRecordMapper;
    @Autowired
    private StudentMapper studentMapper;
    @Autowired
    private SeatMapper seatMapper;

    @Override
    @Transactional
    public void checkNoShow() {
        // 超时未签到：状态=0 且 预约日期+时段结束时间 < now
        List<Reservation> list = reservationMapper.findExpiredUnchecked();
        for (Reservation res : list) {
            // 生成违约记录
            ViolateRecord record = new ViolateRecord();
            record.setStuId(res.getStuId());
            record.setResId(res.getResId());
            record.setViolateReason("超时未签到");
            record.setIsEffective(1);
            violateRecordMapper.insert(record);
            // 更新预约状态为违约终止（4）
            reservationMapper.updateStatus(res.getResId(), 4);
            // 更新学生连续违约次数
            Student student = studentMapper.findByStuId(res.getStuId());
            int newCount = student.getViolationCount() + 1;
            studentMapper.updateViolationCount(res.getStuId(), newCount);
            // 如果连续违约次数 >= 2，拉入黑名单7天
            if (newCount >= 2) {
                student.setIsBlacklisted(1);
                student.setBanExpireTime(LocalDateTime.now().plusDays(7));
                studentMapper.updateViolation(student);
            }
            // 释放座位状态为空闲
            seatMapper.updateStatus(res.getSeatId(), 0);
        }
    }

    @Override
    @Transactional
    public void checkOverdueCheckout() {
        // 超时未签退：状态=1 且 预约日期+时段结束时间 < now
        List<Reservation> list = reservationMapper.findExpiredUncheckedOut();
        for (Reservation res : list) {
            ViolateRecord record = new ViolateRecord();
            record.setStuId(res.getStuId());
            record.setResId(res.getResId());
            record.setViolateReason("超时未签退");
            record.setIsEffective(1);
            violateRecordMapper.insert(record);
            reservationMapper.updateStatus(res.getResId(), 4);
            Student student = studentMapper.findByStuId(res.getStuId());
            int newCount = student.getViolationCount() + 1;
            studentMapper.updateViolationCount(res.getStuId(), newCount);
            if (newCount >= 2) {
                student.setIsBlacklisted(1);
                student.setBanExpireTime(LocalDateTime.now().plusDays(7));
                studentMapper.updateViolation(student);
            }
            seatMapper.updateStatus(res.getSeatId(), 0);
        }
    }

    @Override
    @Transactional
    public void autoUnblock() {
        // 查询所有 is_blacklisted=1 且 ban_expire_time <= now 的学生
        // 这里需要 StudentMapper 中增加方法 findExpiredBlacklisted
        // 为了简洁，直接在业务中查询所有黑名单学生再判断时间
        // 实际建议在 Mapper 中写 SQL 条件
        List<Student> blacklisted = studentMapper.findAll(); // 需要过滤，但先简单实现
        for (Student s : blacklisted) {
            if (s.getIsBlacklisted() == 1 && s.getBanExpireTime() != null
                    && s.getBanExpireTime().isBefore(LocalDateTime.now())) {
                studentMapper.clearBlacklist(s.getStuId());
            }
        }
    }

    @Override
    @Transactional
    public void manualMarkViolation(Integer resId, String reason) {
        Reservation res = reservationMapper.findById(resId);
        if (res == null) throw new RuntimeException("预约不存在");
        if (res.getResStatus() == 4) throw new RuntimeException("已违约过");
        ViolateRecord record = new ViolateRecord();
        record.setStuId(res.getStuId());
        record.setResId(resId);
        record.setViolateReason(reason);
        record.setIsEffective(1);
        violateRecordMapper.insert(record);
        reservationMapper.updateStatus(resId, 4);
        Student student = studentMapper.findByStuId(res.getStuId());
        int newCount = student.getViolationCount() + 1;
        studentMapper.updateViolationCount(res.getStuId(), newCount);
        if (newCount >= 2) {
            student.setIsBlacklisted(1);
            student.setBanExpireTime(LocalDateTime.now().plusDays(7));
            studentMapper.updateViolation(student);
        }
        seatMapper.updateStatus(res.getSeatId(), 0);
    }
}