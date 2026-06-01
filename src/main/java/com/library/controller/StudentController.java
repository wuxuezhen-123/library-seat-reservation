package com.library.controller;

import com.library.dto.ReserveRequest;
import com.library.dto.Result;
import com.library.entity.*;
import com.library.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 学生端控制器
 * 提供区域/座位/时段浏览、预约、取消、记录查询、违约查询、黑名单状态等功能
 */
@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private AreaMapper areaMapper;
    @Autowired
    private SeatMapper seatMapper;
    @Autowired
    private TimeSlotMapper timeSlotMapper;
    @Autowired
    private ReservationMapper reservationMapper;
    @Autowired
    private ViolateRecordMapper violateRecordMapper;
    @Autowired
    private StudentMapper studentMapper;

    // ==================== 辅助方法 ====================

    /**
     * 获取当前登录学生的学号
     * 优先从请求头 X-User-Id 获取；若未传递则使用默认测试学号 20240001
     */
    private String getCurrentStuId(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return (userId != null && !userId.isEmpty()) ? userId : "20240001";
    }

    /**
     * 将数据库座位状态转换为前端需要的字符串
     * 0 -> FREE, 1 -> RESERVED, 2 -> OCCUPIED
     */
    private String convertSeatStatus(Integer status) {
        if (status == null) return "FREE";
        switch (status) {
            case 0: return "FREE";
            case 1: return "RESERVED";
            case 2: return "OCCUPIED";
            default: return "FREE";
        }
    }

    // ==================== 1. 获取区域列表 ====================
    @GetMapping("/area/list")
    public Result<List<Area>> getAreas() {
        List<Area> areas = areaMapper.findAllEnabled();
        return Result.success(areas);
    }

    // ==================== 2. 获取座位列表（可按区域筛选） ====================
    @GetMapping("/seat/list")
    public Result<List<Map<String, Object>>> getSeats(@RequestParam(required = false) String zone) {
        List<Seat> seats;
        if (zone != null && !zone.isEmpty()) {
            // 根据区域名称查找区域ID
            Area area = areaMapper.findByName(zone + "区");
            if (area == null) {
                return Result.success(new ArrayList<>());
            }
            seats = seatMapper.findByAreaId(area.getAreaId());
        } else {
            seats = seatMapper.findAll(); // 需要 SeatMapper 提供 findAll 方法
        }

        List<Map<String, Object>> result = seats.stream().map(seat -> {
            Area area = areaMapper.findById(seat.getAreaId());
            Map<String, Object> map = new HashMap<>();
            map.put("id", seat.getSeatId());
            map.put("areaId", seat.getAreaId());
            map.put("areaName", area != null ? area.getAreaName() : "");
            String seatCode = seat.getSeatCode();
            map.put("row", seatCode.substring(0, 1));          // 行号：A/B/C...
            map.put("column", Integer.parseInt(seatCode));     // 列号：数字
            map.put("seatNumber", seatCode);
            map.put("status", convertSeatStatus(seat.getSeatStatus()));
            return map;
        }).collect(Collectors.toList());
        return Result.success(result);
    }

    // ==================== 3. 获取时段列表 ====================
    @GetMapping("/timeslot/list")
    public Result<List<TimeSlot>> getTimeSlots() {
        List<TimeSlot> slots = timeSlotMapper.findAllEnabled();
        return Result.success(slots);
    }

    // ==================== 4. 创建预约（提交预约） ====================
    @PostMapping("/reserve/add")
    @Transactional
    public Result<Void> createReservation(@RequestBody ReserveRequest request,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);

        // 1. 校验学生是否存在及黑名单状态
        Student student = studentMapper.findByStuId(stuId);
        if (student == null) {
            return Result.error(404, "学生不存在");
        }
        // 检查是否在封禁期内
        if (student.getIsBlacklisted() == 1 && student.getBanExpireTime() != null
                && student.getBanExpireTime().isAfter(LocalDateTime.now())) {
            return Result.error(403, "您已被列入黑名单，无法预约");
        }

        // 2. 校验座位是否存在
        Seat seat = seatMapper.findById(request.getSeatId());
        if (seat == null) {
            return Result.error(404, "座位不存在");
        }
        if (seat.getSeatStatus() != 0) {
            return Result.error(400, "该座位当前不可预约");
        }

        // 3. 校验时段是否存在且启用
        TimeSlot slot = timeSlotMapper.findById(request.getSlotId());
        if (slot == null || slot.getStatus() != 1) {
            return Result.error(400, "预约时段无效或已停用");
        }

        // 4. 预约日期只能为今天或明天
        LocalDate today = LocalDate.now();
        LocalDate resDate = request.getResDate();
        if (resDate.isBefore(today) || resDate.isAfter(today.plusDays(1))) {
            return Result.error(400, "只能预约当天或明天的场次");
        }

        // 5. 唯一性校验：同一座位同一时段
        int seatCount = reservationMapper.countBySeatAndSlot(request.getSeatId(), request.getSlotId(), resDate);
        if (seatCount > 0) {
            return Result.error(409, "该座位在该时段已被预约");
        }

        // 6. 唯一性校验：同一用户同一时段
        int userCount = reservationMapper.countByStuAndSlot(stuId, request.getSlotId(), resDate);
        if (userCount > 0) {
            return Result.error(409, "您已预约该时段的其他座位");
        }

        // 7. 创建预约记录
        Reservation reservation = new Reservation();
        reservation.setStuId(stuId);
        reservation.setSeatId(request.getSeatId());
        reservation.setSlotId(request.getSlotId());
        reservation.setResDate(resDate);
        reservation.setResStatus(0); // 已预约
        reservationMapper.insert(reservation);

        // 8. 更新座位状态为已预约(1)
        seatMapper.updateStatus(request.getSeatId(), 1);

        return Result.success();
    }

    // ==================== 5. 获取当前用户预约列表 ====================
    @GetMapping("/reserve/list")
    public Result<List<Reservation>> getMyReservations(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);
        List<Reservation> list = reservationMapper.findByStuId(stuId);
        // 按创建时间倒序排列
        list.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return Result.success(list);
    }

    // ==================== 6. 取消预约 ====================
    @PutMapping("/reserve/cancel/{reservationId}")
    @Transactional
    public Result<Void> cancelReservation(@PathVariable Integer reservationId,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);
        Reservation reservation = reservationMapper.findById(reservationId);
        if (reservation == null) {
            return Result.error(404, "预约记录不存在");
        }
        if (!reservation.getStuId().equals(stuId)) {
            return Result.error(403, "无权取消他人的预约");
        }
        if (reservation.getResStatus() != 0) {
            return Result.error(400, "当前状态不可取消");
        }

        // 检查是否已开始：预约日期+时段结束时间 > 当前时间才可取消
        TimeSlot slot = timeSlotMapper.findById(reservation.getSlotId());
        if (slot == null) {
            return Result.error(500, "时段信息缺失");
        }
        LocalDateTime endTime = LocalDateTime.of(reservation.getResDate(), slot.getEndTime());
        if (endTime.isBefore(LocalDateTime.now())) {
            return Result.error(400, "场次已开始或已结束，无法取消");
        }

        // 更新预约状态为已取消(3)
        reservationMapper.updateStatus(reservationId, 3);
        // 释放座位状态为空闲(0)
        seatMapper.updateStatus(reservation.getSeatId(), 0);

        return Result.success();
    }

    // ==================== 7. 获取个人违约记录 ====================
    @GetMapping("/violate/list")
    public Result<List<ViolateRecord>> getMyViolations(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);
        List<ViolateRecord> records = violateRecordMapper.findByStuId(stuId);
        return Result.success(records);
    }

    // ==================== 8. 检查黑名单状态 ====================
    @GetMapping("/blacklist/check")
    public Result<Boolean> checkBlacklist(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);
        Student student = studentMapper.findByStuId(stuId);
        if (student == null) {
            return Result.success(false);
        }
        boolean isBlacklisted = student.getIsBlacklisted() == 1 &&
                student.getBanExpireTime() != null &&
                student.getBanExpireTime().isAfter(LocalDateTime.now());
        return Result.success(isBlacklisted);
    }

    // ==================== 9. 黑名单详情（是否黑名单、违约次数、剩余天数） ====================
    @GetMapping("/blacklist/detail")
    public Result<Map<String, Object>> blacklistDetail(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);
        Student student = studentMapper.findByStuId(stuId);
        Map<String, Object> data = new HashMap<>();
        if (student == null) {
            data.put("isBlacklisted", false);
            data.put("violationCount", 0);
            data.put("remainingDays", 0);
            return Result.success(data);
        }
        boolean isBlacklisted = student.getIsBlacklisted() == 1 &&
                student.getBanExpireTime() != null &&
                student.getBanExpireTime().isAfter(LocalDateTime.now());
        data.put("isBlacklisted", isBlacklisted);
        data.put("violationCount", student.getViolationCount());

        long remainingDays = 0;
        if (isBlacklisted && student.getBanExpireTime() != null) {
            remainingDays = java.time.Duration.between(LocalDateTime.now(), student.getBanExpireTime()).toDays();
            if (remainingDays < 0) remainingDays = 0;
        }
        data.put("remainingDays", remainingDays);
        return Result.success(data);
    }

    // ==================== 10. 获取可用座位（按日期和时段） ====================
    @PostMapping("/reserve/available")
    public Result<List<Map<String, Object>>> getAvailableSeats(@RequestBody Map<String, Object> params,
                                                               @RequestHeader(value = "X-User-Id", required = false) String userId) {
        // 参数：date (String), timeSlot (Integer)
        String dateStr = (String) params.get("date");
        Integer timeSlotId = (Integer) params.get("timeSlot");
        if (dateStr == null || timeSlotId == null) {
            return Result.error(400, "缺少日期或时段参数");
        }
        LocalDate date = LocalDate.parse(dateStr);
        // 查询所有座位，过滤出未被该时段预约的座位
        List<Seat> allSeats = seatMapper.findAll();
        // 获取该时段已被预约的座位ID
        List<Reservation> reserved = reservationMapper.findAll().stream()
                .filter(r -> r.getResDate().equals(date) && r.getSlotId().equals(timeSlotId) && r.getResStatus() != 3)
                .collect(Collectors.toList());
        Set<Integer> reservedSeatIds = reserved.stream().map(Reservation::getSeatId).collect(Collectors.toSet());

        List<Map<String, Object>> available = new ArrayList<>();
        for (Seat seat : allSeats) {
            if (reservedSeatIds.contains(seat.getSeatId())) {
                continue;
            }
            Area area = areaMapper.findById(seat.getAreaId());
            Map<String, Object> seatInfo = new HashMap<>();
            seatInfo.put("id", seat.getSeatId());
            seatInfo.put("areaId", seat.getAreaId());
            seatInfo.put("areaName", area != null ? area.getAreaName() : "");
            seatInfo.put("row", seat.getSeatCode().substring(0, 1));
            seatInfo.put("column", Integer.parseInt(seat.getSeatCode()));
            seatInfo.put("seatNumber", seat.getSeatCode());
            seatInfo.put("status", convertSeatStatus(seat.getSeatStatus()));
            available.add(seatInfo);
        }
        return Result.success(available);
    }

    // ==================== 11. 自动分配座位（智能选座） ====================
    @PostMapping("/reserve/add/auto")
    @Transactional
    public Result<Map<String, Object>> autoAssignSeat(@RequestBody Map<String, Object> params,
                                                      @RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);
        String dateStr = (String) params.get("date");
        Integer timeSlotId = (Integer) params.get("timeSlot");
        if (dateStr == null || timeSlotId == null) {
            return Result.error(400, "缺少日期或时段参数");
        }
        LocalDate date = LocalDate.parse(dateStr);

        // 1. 校验用户黑名单
        Student student = studentMapper.findByStuId(stuId);
        if (student == null) return Result.error(404, "学生不存在");
        if (student.getIsBlacklisted() == 1 && student.getBanExpireTime() != null
                && student.getBanExpireTime().isAfter(LocalDateTime.now())) {
            return Result.error(403, "您已被列入黑名单，无法预约");
        }

        // 2. 校验时段
        TimeSlot slot = timeSlotMapper.findById(timeSlotId);
        if (slot == null || slot.getStatus() != 1) {
            return Result.error(400, "时段无效或已停用");
        }

        // 3. 日期校验
        LocalDate today = LocalDate.now();
        if (date.isBefore(today) || date.isAfter(today.plusDays(1))) {
            return Result.error(400, "只能预约当天或明天的场次");
        }

        // 4. 检查用户是否已预约该时段
        int userCount = reservationMapper.countByStuAndSlot(stuId, timeSlotId, date);
        if (userCount > 0) {
            return Result.error(409, "您已预约该时段的其他座位");
        }

        // 5. 查找可用座位（未被该时段预约的座位）
        List<Seat> allSeats = seatMapper.findAll();
        List<Reservation> reserved = reservationMapper.findAll().stream()
                .filter(r -> r.getResDate().equals(date) && r.getSlotId().equals(timeSlotId) && r.getResStatus() != 3)
                .collect(Collectors.toList());
        Set<Integer> reservedSeatIds = reserved.stream().map(Reservation::getSeatId).collect(Collectors.toSet());

        Seat availableSeat = allSeats.stream()
                .filter(s -> !reservedSeatIds.contains(s.getSeatId()) && s.getSeatStatus() == 0)
                .findFirst()
                .orElse(null);
        if (availableSeat == null) {
            return Result.error(400, "当前时段没有可用座位");
        }

        // 6. 创建预约
        Reservation reservation = new Reservation();
        reservation.setStuId(stuId);
        reservation.setSeatId(availableSeat.getSeatId());
        reservation.setSlotId(timeSlotId);
        reservation.setResDate(date);
        reservation.setResStatus(0);
        reservationMapper.insert(reservation);

        // 7. 更新座位状态
        seatMapper.updateStatus(availableSeat.getSeatId(), 1);

        // 8. 返回自动分配的座位信息
        Area area = areaMapper.findById(availableSeat.getAreaId());
        Map<String, Object> resultData = new HashMap<>();
        resultData.put("reservationId", reservation.getResId());
        resultData.put("seatId", availableSeat.getSeatId());
        resultData.put("seatNumber", availableSeat.getSeatCode());
        resultData.put("areaName", area != null ? area.getAreaName() : "");
        resultData.put("row", availableSeat.getSeatCode().substring(0, 1));
        resultData.put("column", Integer.parseInt(availableSeat.getSeatCode()));
        return Result.success("自动分配成功", resultData);
    }
}