package com.library.controller;

import com.library.dto.Result;
import com.library.entity.*;
import com.library.mapper.*;
import com.library.service.CheckService;
import com.library.service.ViolationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 管理员端控制器
 * 实现座位/时段/用户/违约/预约的全量管理及签到签退、统计功能
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

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
    @Autowired
    private AreaMapper areaMapper;
    @Autowired
    private CheckService checkService;
    @Autowired
    private ViolationService violationService;

    // ==================== 辅助方法 ====================
    private String convertSeatStatus(Integer status) {
        if (status == null) return "FREE";
        switch (status) {
            case 0: return "FREE";
            case 1: return "RESERVED";
            case 2: return "OCCUPIED";
            default: return "FREE";
        }
    }

    // ==================== 座位管理 ====================
    @PostMapping("/seat/add")
    @Transactional
    public Result<Void> createSeat(@RequestBody Map<String, Object> seatInfo) {
        Integer areaId = (Integer) seatInfo.get("areaId");
        String seatCode = (String) seatInfo.get("seatCode");
        if (areaId == null || seatCode == null) {
            return Result.error(400, "缺少 areaId 或 seatCode");
        }
        Seat seat = new Seat();
        seat.setAreaId(areaId);
        seat.setSeatCode(seatCode);
        seat.setSeatStatus(0);
        seatMapper.insert(seat);
        return Result.success();
    }

    @GetMapping("/seat/list")
    public Result<List<Map<String, Object>>> getSeatsByArea(@RequestParam("areaId") Integer areaId) {
        List<Seat> seats = seatMapper.findByAreaId(areaId);
        List<Map<String, Object>> result = seats.stream().map(seat -> {
            Area area = areaMapper.findById(seat.getAreaId());
            Map<String, Object> map = new HashMap<>();
            map.put("id", seat.getSeatId());
            map.put("areaId", seat.getAreaId());
            map.put("areaName", area != null ? area.getAreaName() : "");
            map.put("seatCode", seat.getSeatCode());
            map.put("seatNumber", seat.getSeatCode());
            map.put("status", seat.getSeatStatus() == 0 ? "FREE" : (seat.getSeatStatus() == 1 ? "RESERVED" : "OCCUPIED"));
            return map;
        }).collect(Collectors.toList());
        return Result.success(result);
    }

    @PutMapping("/seat/update/{seatId}")
    @Transactional
    public Result<Void> updateSeat(@PathVariable Integer seatId, @RequestBody Map<String, Object> seatInfo) {
        Seat seat = seatMapper.findById(seatId);
        if (seat == null) return Result.error(404, "座位不存在");
        if (seatInfo.containsKey("areaId")) seat.setAreaId((Integer) seatInfo.get("areaId"));
        if (seatInfo.containsKey("seatCode")) seat.setSeatCode((String) seatInfo.get("seatCode"));
        if (seatInfo.containsKey("seatStatus")) {
            Object status = seatInfo.get("seatStatus");
            if (status instanceof String) {
                String s = (String) status;
                if ("FREE".equals(s)) seat.setSeatStatus(0);
                else if ("RESERVED".equals(s)) seat.setSeatStatus(1);
                else if ("OCCUPIED".equals(s)) seat.setSeatStatus(2);
                else seat.setSeatStatus(0);
            } else {
                seat.setSeatStatus((Integer) status);
            }
        }
        // 需要 SeatMapper 提供 update 方法（或者直接用 updateStatus 加其他字段）
        seatMapper.update(seat);
        return Result.success();
    }

    @DeleteMapping("/seat/delete/{seatId}")
    @Transactional
    public Result<Void> deleteSeat(@PathVariable Integer seatId) {
        // 检查是否有未完成的预约关联该座位（状态0或1）
        List<Reservation> reservations = reservationMapper.findBySeatId(seatId);
        boolean hasActive = reservations.stream().anyMatch(r -> r.getResStatus() == 0 || r.getResStatus() == 1);
        if (hasActive) {
            return Result.error(400, "该座位存在未完成的预约，无法删除");
        }
        seatMapper.deleteById(seatId);
        return Result.success();
    }

    @PutMapping("/seat/status/{seatId}")
    @Transactional
    public Result<Void> updateSeatStatus(@PathVariable Integer seatId, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        int seatStatus;
        if ("RESERVED".equals(status)) seatStatus = 1;
        else if ("OCCUPIED".equals(status)) seatStatus = 2;
        else seatStatus = 0;
        seatMapper.updateStatus(seatId, seatStatus);
        return Result.success();
    }

    @PutMapping("/seat/batch/status")
    @Transactional
    public Result<Void> batchUpdateSeatStatus(@RequestBody Map<String, Object> params) {
        List<Integer> seatIds = (List<Integer>) params.get("seatIds");
        String status = (String) params.get("status");
        int seatStatus;
        if ("RESERVED".equals(status)) seatStatus = 1;
        else if ("OCCUPIED".equals(status)) seatStatus = 2;
        else seatStatus = 0;
        for (Integer seatId : seatIds) {
            seatMapper.updateStatus(seatId, seatStatus);
        }
        return Result.success();
    }

    @DeleteMapping("/seat/batch/delete")
    @Transactional
    public Result<Void> batchDeleteSeats(@RequestBody Map<String, List<Integer>> params) {
        List<Integer> seatIds = params.get("seatIds");
        for (Integer seatId : seatIds) {
            List<Reservation> reservations = reservationMapper.findBySeatId(seatId);
            boolean hasActive = reservations.stream().anyMatch(r -> r.getResStatus() == 0 || r.getResStatus() == 1);
            if (hasActive) {
                return Result.error(400, "座位 " + seatId + " 存在未完成的预约，无法删除");
            }
            seatMapper.deleteById(seatId);
        }
        return Result.success();
    }

    // ==================== 时段管理 ====================
    @PostMapping("/timeslot/add")
    @Transactional
    public Result<Void> createTimeSlot(@RequestBody TimeSlot slot) {
        timeSlotMapper.insert(slot);
        return Result.success();
    }

    @PutMapping("/timeslot/update/{slotId}")
    @Transactional
    public Result<Void> updateTimeSlot(@PathVariable Integer slotId, @RequestBody TimeSlot slot) {
        slot.setSlotId(slotId);
        timeSlotMapper.update(slot);
        return Result.success();
    }

    @DeleteMapping("/timeslot/delete/{slotId}")
    @Transactional
    public Result<Void> deleteTimeSlot(@PathVariable Integer slotId) {
        // 检查是否有预约关联该时段
        int count = reservationMapper.countBySlotId(slotId);
        if (count > 0) {
            return Result.error(400, "该时段已有预约记录，无法删除");
        }
        timeSlotMapper.deleteById(slotId);
        return Result.success();
    }

    // ==================== 签到签退 ====================
    @PutMapping("/check/in/{reservationId}")
    @Transactional
    public Result<Void> checkIn(@PathVariable Integer reservationId) {
        Reservation res = reservationMapper.findById(reservationId);
        if (res == null) return Result.error(404, "预约记录不存在");
        if (res.getResStatus() != 0) return Result.error(400, "当前状态无法签到");
        checkService.checkin(reservationId, res.getStuId(), "admin");
        return Result.success();
    }

    @PutMapping("/check/out/{reservationId}")
    @Transactional
    public Result<Void> checkOut(@PathVariable Integer reservationId) {
        Reservation res = reservationMapper.findById(reservationId);
        if (res == null) return Result.error(404, "预约记录不存在");
        if (res.getResStatus() != 1) return Result.error(400, "未签到或已签退");
        checkService.checkout(reservationId, res.getStuId(), "admin");
        return Result.success();
    }

    // ==================== 用户管理 ====================
    @GetMapping("/user/list")
    public Result<List<Map<String, Object>>> getUsers(@RequestParam Map<String, String> params) {
        List<Student> students = studentMapper.findAll();
        String role = params.get("role");
        String keyword = params.get("keyword");
        String isBlacklistedParam = params.get("isBlacklisted");

        List<Map<String, Object>> result = students.stream()
                .filter(s -> role == null || "STUDENT".equals(role))
                .filter(s -> keyword == null || s.getStuId().contains(keyword) || s.getName().contains(keyword))
                .filter(s -> {
                    if (isBlacklistedParam == null) return true;
                    boolean expectBlacklist = "true".equalsIgnoreCase(isBlacklistedParam);
                    boolean actualBlacklist = s.getIsBlacklisted() == 1;
                    return expectBlacklist == actualBlacklist;
                })
                .map(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", s.getStuId());
                    map.put("username", s.getStuId());
                    map.put("name", s.getName());
                    map.put("role", "STUDENT");
                    map.put("enabled", true);
                    map.put("isBlacklisted", s.getIsBlacklisted() == 1);
                    map.put("violationCount", s.getViolationCount());
                    map.put("banEndDate", s.getBanExpireTime());
                    return map;
                })
                .collect(Collectors.toList());
        return Result.success(result);
    }

    @PostMapping("/user/add")
    @Transactional
    public Result<Void> createUser(@RequestBody Map<String, String> userInfo) {
        Student student = new Student();
        student.setStuId(userInfo.get("username"));
        student.setPassword(userInfo.get("password")); // 明文存储
        student.setName(userInfo.get("name"));
        student.setViolationCount(0);
        student.setIsBlacklisted(0);
        student.setBanExpireTime(null);
        studentMapper.insert(student);
        return Result.success();
    }

    @PutMapping("/user/update/{userId}")
    @Transactional
    public Result<Void> updateUser(@PathVariable String userId, @RequestBody Map<String, String> userInfo) {
        Student student = studentMapper.findByStuId(userId);
        if (student == null) return Result.error(404, "用户不存在");
        if (userInfo.containsKey("name")) student.setName(userInfo.get("name"));
        if (userInfo.containsKey("password")) student.setPassword(userInfo.get("password"));
        studentMapper.updateInfo(student);
        return Result.success();
    }

    @DeleteMapping("/user/delete/{userId}")
    @Transactional
    public Result<Void> deleteUser(@PathVariable String userId) {
        // 检查是否有未完成的预约
        List<Reservation> reservations = reservationMapper.findByStuId(userId);
        boolean hasActive = reservations.stream().anyMatch(r -> r.getResStatus() == 0 || r.getResStatus() == 1);
        if (hasActive) {
            return Result.error(400, "该用户存在未完成的预约，无法删除");
        }
        studentMapper.deleteByStuId(userId);
        return Result.success();
    }

    // ==================== 违约管理 ====================
    @GetMapping("/violate/list")
    public Result<List<ViolateRecord>> getAllViolations(@RequestParam Map<String, String> params) {
        String studentId = params.get("studentId");
        if (studentId != null) {
            return Result.success(violateRecordMapper.findByStuId(studentId));
        } else {
            List<ViolateRecord> all = violateRecordMapper.findAll();
            return Result.success(all);
        }
    }

    @PostMapping("/violate/add/{userId}")
    @Transactional
    public Result<Void> addViolation(@PathVariable String userId, @RequestBody Map<String, String> body) {
        String violationType = body.get("violationType");
        String description = body.get("description");
        // 查找该学生最新的未完成预约（状态0或1）
        List<Reservation> reservations = reservationMapper.findByStuId(userId);
        Reservation target = reservations.stream()
                .filter(r -> r.getResStatus() == 0 || r.getResStatus() == 1)
                .findFirst().orElse(null);
        if (target == null) {
            return Result.error(400, "该学生没有可操作的预约记录");
        }
        violationService.manualMarkViolation(target.getResId(), description != null ? description : violationType);
        return Result.success();
    }

    @PutMapping("/black/remove/{userId}")
    @Transactional
    public Result<Void> removeFromBlacklist(@PathVariable String userId) {
        studentMapper.clearBlacklist(userId);
        return Result.success();
    }

    // ==================== 预约管理 ====================
    @GetMapping("/reserve/list")
    public Result<List<Reservation>> getAllReservations(@RequestParam Map<String, String> params) {
        List<Reservation> list = reservationMapper.findAll();
        // 可选的过滤：日期、状态
        String date = params.get("date");
        String status = params.get("status");
        if (date != null) {
            list = list.stream().filter(r -> r.getResDate().toString().equals(date)).collect(Collectors.toList());
        }
        if (status != null) {
            try {
                int statusInt = Integer.parseInt(status);
                list = list.stream().filter(r -> r.getResStatus() == statusInt).collect(Collectors.toList());
            } catch (NumberFormatException ignored) {}
        }
        return Result.success(list);
    }

    @GetMapping("/reserve/search")
    public Result<Reservation> searchReservationByStudentId(@RequestParam String studentId) {
        List<Reservation> reservations = reservationMapper.findByStuId(studentId);
        Reservation current = reservations.stream()
                .filter(r -> r.getResStatus() == 0 || r.getResStatus() == 1)
                .findFirst()
                .orElse(null);
        if (current == null) {
            return Result.error(404, "未找到该学生当前有效预约");
        }
        return Result.success(current);
    }

    // ==================== 统计数据 ====================
    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSeats", seatMapper.countAll());
        stats.put("availableSeats", seatMapper.countByStatus(0));
        stats.put("reservedSeats", seatMapper.countByStatus(1));
        stats.put("occupiedSeats", seatMapper.countByStatus(2));
        stats.put("totalUsers", studentMapper.countAll());
        stats.put("blacklistedUsers", studentMapper.countBlacklisted());
        stats.put("totalViolations", violateRecordMapper.countAll());
        stats.put("totalReservations", reservationMapper.countAll());
        return Result.success(stats);
    }
}