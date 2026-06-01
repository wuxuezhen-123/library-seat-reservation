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
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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

    // ========== 辅助方法 ==========

    private String getCurrentStuId(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return (userId != null && !userId.isEmpty()) ? userId : "001";
    }

    private String convertSeatStatus(Integer status) {
        if (status == null) return "FREE";
        switch (status) {
            case 0: return "FREE";
            case 1: return "RESERVED";
            case 2: return "OCCUPIED";
            default: return "FREE";
        }
    }

    // ========== 1. 查询区域列表 ==========
    @GetMapping("/area/list")
    public Result<List<Map<String, Object>>> listAreas() {
        List<Area> areas = areaMapper.findAllEnabled();
        List<Map<String, Object>> result = areas.stream().map(area -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", area.getAreaId());
            map.put("name", area.getAreaName());
            return map;
        }).collect(Collectors.toList());
        return Result.success(result);
    }

    // ========== 2. 查询座位列表（支持 areaId 参数） ==========
    @GetMapping("/seat/list")
    public Result<List<Map<String, Object>>> listSeats(@RequestParam(required = false) Integer areaId) {
        List<Seat> seats;
        if (areaId != null) {
            seats = seatMapper.findByAreaId(areaId);
        } else {
            seats = seatMapper.findAll();
        }
        List<Map<String, Object>> result = seats.stream().map(seat -> {
            Area area = areaMapper.findById(seat.getAreaId());
            Map<String, Object> map = new HashMap<>();
            map.put("id", seat.getSeatId());
            map.put("seatNumber", seat.getSeatCode());
            map.put("areaName", area != null ? area.getAreaName() : "");
            map.put("status", convertSeatStatus(seat.getSeatStatus()));
            return map;
        }).collect(Collectors.toList());
        return Result.success(result);
    }

    // ========== 3. 查询单个座位 ==========
    @GetMapping("/seat/list/{seatId}")
    public Result<Map<String, Object>> getSeatById(@PathVariable Integer seatId) {
        Seat seat = seatMapper.findById(seatId);
        if (seat == null) {
            return Result.error(404, "座位不存在");
        }
        Area area = areaMapper.findById(seat.getAreaId());
        Map<String, Object> map = new HashMap<>();
        map.put("id", seat.getSeatId());
        map.put("seatNumber", seat.getSeatCode());
        map.put("areaName", area != null ? area.getAreaName() : "");
        map.put("status", convertSeatStatus(seat.getSeatStatus()));
        return Result.success(map);
    }

    // ========== 4. 查询时段列表 ==========
    @GetMapping("/timeslot/list")
    public Result<List<Map<String, Object>>> listTimeSlots() {
        List<TimeSlot> slots = timeSlotMapper.findAllEnabled();
        List<Map<String, Object>> result = slots.stream().map(slot -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", slot.getSlotId());
            map.put("slot", slot.getSlotName());
            map.put("startTime", slot.getStartTime().toString());
            map.put("endTime", slot.getEndTime().toString());
            return map;
        }).collect(Collectors.toList());
        return Result.success(result);
    }

    // ========== 5. 查询可用座位（按日期和时段） ==========
    @PostMapping("/reserve/available")
    public Result<List<Map<String, Object>>> getAvailableSeats(@RequestBody Map<String, Object> params) {
        String dateStr = (String) params.get("date");
        Integer timeSlotId = (Integer) params.get("timeSlotId");
        if (dateStr == null || timeSlotId == null) {
            return Result.error(400, "缺少日期或时段参数");
        }
        LocalDate date = LocalDate.parse(dateStr);
        // 获取该时段已被预约的座位ID（排除已取消的）
        List<Reservation> reservations = reservationMapper.findAll();
        Set<Integer> reservedSeatIds = reservations.stream()
                .filter(r -> r.getResDate().equals(date) && r.getSlotId().equals(timeSlotId) && r.getResStatus() != 3)
                .map(Reservation::getSeatId)
                .collect(Collectors.toSet());

        List<Seat> allSeats = seatMapper.findAll();
        List<Map<String, Object>> available = new ArrayList<>();
        for (Seat seat : allSeats) {
            if (reservedSeatIds.contains(seat.getSeatId())) {
                continue;
            }
            Area area = areaMapper.findById(seat.getAreaId());
            Map<String, Object> map = new HashMap<>();
            map.put("id", seat.getSeatId());
            map.put("seatNumber", seat.getSeatCode());
            map.put("areaName", area != null ? area.getAreaName() : "");
            map.put("status", convertSeatStatus(seat.getSeatStatus()));
            available.add(map);
        }
        return Result.success(available);
    }

    // ========== 6. 提交预约 ==========
    @PostMapping("/reserve/add")
    @Transactional
    public Result<Void> createReservation(@RequestBody ReserveRequest request,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);

        // 1. 学生校验
        Student student = studentMapper.findByStuId(stuId);
        if (student == null) return Result.error(404, "学生不存在");
        if (student.getIsBlacklisted() == 1 && student.getBanExpireTime() != null
                && student.getBanExpireTime().isAfter(LocalDateTime.now())) {
            return Result.error(403, "您已被列入黑名单，无法预约");
        }

        // 2. 座位校验
        Seat seat = seatMapper.findById(request.getSeatId());
        if (seat == null) return Result.error(404, "座位不存在");
        if (seat.getSeatStatus() != 0) return Result.error(400, "该座位当前不可预约");

        // 3. 时段校验
        TimeSlot slot = timeSlotMapper.findById(request.getTimeSlotId());
        if (slot == null || slot.getStatus() != 1) return Result.error(400, "预约时段无效或已停用");

        // 4. 日期校验
        LocalDate today = LocalDate.now();
        LocalDate resDate = request.getDate();
        if (resDate.isBefore(today) || resDate.isAfter(today.plusDays(1))) {
            return Result.error(400, "只能预约当天或明天的场次");
        }

        // 5. 唯一性校验
        int seatCount = reservationMapper.countBySeatAndSlot(request.getSeatId(), request.getTimeSlotId(), resDate);
        if (seatCount > 0) return Result.error(409, "该座位在该时段已被预约");
        int userCount = reservationMapper.countByStuAndSlot(stuId, request.getTimeSlotId(), resDate);
        if (userCount > 0) return Result.error(409, "您已预约该时段的其他座位");

        // 6. 创建预约
        Reservation reservation = new Reservation();
        reservation.setStuId(stuId);
        reservation.setSeatId(request.getSeatId());
        reservation.setSlotId(request.getTimeSlotId());
        reservation.setResDate(resDate);
        reservation.setResStatus(0);
        reservationMapper.insert(reservation);

        // 7. 更新座位状态
        seatMapper.updateStatus(request.getSeatId(), 1);

        return Result.success();
    }

    // ========== 7. 自动预约 ==========
    @PostMapping("/reserve/add/auto")
    @Transactional
    public Result<Map<String, Object>> autoAssignSeat(@RequestBody Map<String, Object> params,
                                                      @RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);
        String dateStr = (String) params.get("date");
        Integer timeSlotId = (Integer) params.get("timeSlotId");
        if (dateStr == null || timeSlotId == null) {
            return Result.error(400, "缺少日期或时段参数");
        }
        LocalDate date = LocalDate.parse(dateStr);

        Student student = studentMapper.findByStuId(stuId);
        if (student == null) return Result.error(404, "学生不存在");
        if (student.getIsBlacklisted() == 1 && student.getBanExpireTime() != null
                && student.getBanExpireTime().isAfter(LocalDateTime.now())) {
            return Result.error(403, "您已被列入黑名单，无法预约");
        }

        TimeSlot slot = timeSlotMapper.findById(timeSlotId);
        if (slot == null || slot.getStatus() != 1) return Result.error(400, "时段无效或已停用");
        if (date.isBefore(LocalDate.now()) || date.isAfter(LocalDate.now().plusDays(1))) {
            return Result.error(400, "只能预约当天或明天的场次");
        }

        // 检查用户是否已预约该时段
        int userCount = reservationMapper.countByStuAndSlot(stuId, timeSlotId, date);
        if (userCount > 0) return Result.error(409, "您已预约该时段的其他座位");

        // 查找可用座位
        List<Reservation> reservations = reservationMapper.findAll();
        Set<Integer> reservedSeatIds = reservations.stream()
                .filter(r -> r.getResDate().equals(date) && r.getSlotId().equals(timeSlotId) && r.getResStatus() != 3)
                .map(Reservation::getSeatId)
                .collect(Collectors.toSet());

        List<Seat> allSeats = seatMapper.findAll();
        Seat availableSeat = allSeats.stream()
                .filter(s -> !reservedSeatIds.contains(s.getSeatId()) && s.getSeatStatus() == 0)
                .findFirst()
                .orElse(null);
        if (availableSeat == null) {
            return Result.error(400, "当前时段没有可用座位");
        }

        // 创建预约
        Reservation reservation = new Reservation();
        reservation.setStuId(stuId);
        reservation.setSeatId(availableSeat.getSeatId());
        reservation.setSlotId(timeSlotId);
        reservation.setResDate(date);
        reservation.setResStatus(0);
        reservationMapper.insert(reservation);
        seatMapper.updateStatus(availableSeat.getSeatId(), 1);

        Area area = areaMapper.findById(availableSeat.getAreaId());
        Map<String, Object> resultData = new HashMap<>();
        resultData.put("id", reservation.getResId());
        resultData.put("seatId", availableSeat.getSeatId());
        resultData.put("seatNumber", availableSeat.getSeatCode());
        resultData.put("areaName", area != null ? area.getAreaName() : "");
        resultData.put("date", date.toString());
        resultData.put("timeSlot", slot.getSlotName());
        resultData.put("status", "RESERVED");
        resultData.put("createTime", LocalDateTime.now().toString());
        return Result.success(resultData);
    }

    // ========== 8. 查询个人预约列表 ==========
    @GetMapping("/reserve/list")
    public Result<List<Map<String, Object>>> getMyReservations(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);
        Student currentStudent = studentMapper.findByStuId(stuId);
        List<Reservation> reservations = reservationMapper.findByStuId(stuId);
        List<Map<String, Object>> result = reservations.stream().map(res -> {
            Seat seat = seatMapper.findById(res.getSeatId());
            Area area = seat != null ? areaMapper.findById(seat.getAreaId()) : null;
            TimeSlot slot = timeSlotMapper.findById(res.getSlotId());
            Map<String, Object> map = new HashMap<>();
            map.put("id", res.getResId());
            map.put("studentId", res.getStuId());
            map.put("studentName", currentStudent != null ? currentStudent.getName() : "");
            map.put("seatId", res.getSeatId());
            map.put("seatNumber", seat != null ? seat.getSeatCode() : "");
            map.put("areaName", area != null ? area.getAreaName() : "");
            map.put("date", res.getResDate().toString());
            map.put("timeSlot", slot != null ? slot.getSlotName() : "");
            map.put("timeSlotId", res.getSlotId());
            String status;
            switch (res.getResStatus()) {
                case 0: status = "RESERVED"; break;
                case 1: status = "CHECKED_IN"; break;
                case 2: status = "COMPLETED"; break;
                case 3: status = "CANCELLED"; break;
                default: status = "RESERVED";
            }
            map.put("status", status);
            map.put("createTime", res.getCreatedAt() != null ? res.getCreatedAt().toString() : "");
            map.put("checkInTime", res.getCheckinTime() != null ? res.getCheckinTime().toString() : null);
            map.put("checkOutTime", res.getCheckoutTime() != null ? res.getCheckoutTime().toString() : null);
            return map;
        }).collect(Collectors.toList());
        return Result.success(result);
    }

    // ========== 9. 取消预约 ==========
    @PutMapping("/reserve/cancel/{reservationId}")
    @Transactional
    public Result<Void> cancelReservation(@PathVariable Integer reservationId,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);
        Reservation reservation = reservationMapper.findById(reservationId);
        if (reservation == null) return Result.error(404, "预约记录不存在");
        if (!reservation.getStuId().equals(stuId)) return Result.error(403, "无权取消他人的预约");
        if (reservation.getResStatus() != 0) return Result.error(400, "当前状态不可取消");

        TimeSlot slot = timeSlotMapper.findById(reservation.getSlotId());
        if (slot == null) return Result.error(500, "时段信息缺失");
        LocalDateTime endTime = LocalDateTime.of(reservation.getResDate(), slot.getEndTime());
        if (endTime.isBefore(LocalDateTime.now())) return Result.error(400, "场次已开始或已结束，无法取消");

        reservationMapper.updateStatus(reservationId, 3);
        seatMapper.updateStatus(reservation.getSeatId(), 0);
        return Result.success();
    }

    // ========== 10. 查询个人违约记录 ==========
    @GetMapping("/violate/list")
    public Result<List<Map<String, Object>>> getMyViolations(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);
        List<ViolateRecord> records = violateRecordMapper.findByStuId(stuId);
        List<Map<String, Object>> result = records.stream().map(record -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", record.getViolateId());
            map.put("violationType", record.getViolateReason());
            map.put("violationTime", record.getViolateTime().toString());
            map.put("description", record.getViolateReason());
            return map;
        }).collect(Collectors.toList());
        return Result.success(result);
    }

    // ========== 11. 检查黑名单状态 ==========
    @GetMapping("/blacklist/check")
    public Result<Boolean> checkBlacklist(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = getCurrentStuId(userId);
        Student student = studentMapper.findByStuId(stuId);
        if (student == null) return Result.success(false);
        boolean isBlacklisted = student.getIsBlacklisted() == 1 &&
                student.getBanExpireTime() != null &&
                student.getBanExpireTime().isAfter(LocalDateTime.now());
        return Result.success(isBlacklisted);
    }

    // ========== 12. 获取黑名单详情 ==========
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
}