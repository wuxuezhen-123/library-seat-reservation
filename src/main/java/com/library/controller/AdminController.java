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
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

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
    public Result<Void> addSeat(@RequestBody Map<String, Object> req) {
        String seatNumber = (String) req.get("seatNumber");
        Integer areaId = (Integer) req.get("areaId");
        if (seatNumber == null || areaId == null) {
            return Result.error(400, "缺少 seatNumber 或 areaId");
        }
        Seat seat = new Seat();
        seat.setSeatCode(seatNumber);
        seat.setAreaId(areaId);
        seat.setSeatStatus(0);
        seatMapper.insert(seat);
        return Result.success();
    }

    @PutMapping("/seat/update/{seatId}")
    @Transactional
    public Result<Void> updateSeat(@PathVariable Integer seatId, @RequestBody Map<String, Object> req) {
        Seat seat = seatMapper.findById(seatId);
        if (seat == null) return Result.error(404, "座位不存在");
        if (req.containsKey("seatNumber")) {
            seat.setSeatCode((String) req.get("seatNumber"));
        }
        if (req.containsKey("areaId")) {
            seat.setAreaId((Integer) req.get("areaId"));
        }
        seatMapper.update(seat); // 需要 SeatMapper 提供 update 方法
        return Result.success();
    }

    @DeleteMapping("/seat/delete/{seatId}")
    @Transactional
    public Result<Void> deleteSeat(@PathVariable Integer seatId) {
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
    public Result<Void> updateSeatStatus(@PathVariable Integer seatId, @RequestBody Map<String, String> req) {
        String status = req.get("status");
        int seatStatus;
        if ("FREE".equals(status)) seatStatus = 0;
        else if ("RESERVED".equals(status)) seatStatus = 1;
        else if ("OCCUPIED".equals(status)) seatStatus = 2;
        else return Result.error(400, "无效的状态值");
        seatMapper.updateStatus(seatId, seatStatus);
        return Result.success();
    }

    @PutMapping("/seat/batch/status")
    @Transactional
    public Result<Void> batchUpdateSeatStatus(@RequestBody Map<String, Object> req) {
        List<Integer> seatIds = (List<Integer>) req.get("seatIds");
        String status = (String) req.get("status");
        int seatStatus;
        if ("FREE".equals(status)) seatStatus = 0;
        else if ("RESERVED".equals(status)) seatStatus = 1;
        else if ("OCCUPIED".equals(status)) seatStatus = 2;
        else return Result.error(400, "无效的状态值");
        for (Integer seatId : seatIds) {
            seatMapper.updateStatus(seatId, seatStatus);
        }
        return Result.success();
    }

    @DeleteMapping("/seat/batch/delete")
    @Transactional
    public Result<Void> batchDeleteSeats(@RequestBody Map<String, List<Integer>> req) {
        List<Integer> seatIds = req.get("seatIds");
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
    // 注意：前端文档中获取时段列表路径为 /admin/time-slots
    @GetMapping("/time-slots")
    public Result<List<Map<String, Object>>> listTimeSlots() {
        List<TimeSlot> slots = timeSlotMapper.findAll();
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

    @PostMapping("/timeslot/add")
    @Transactional
    public Result<Void> addTimeSlot(@RequestBody Map<String, String> req) {
        String slot = req.get("slot");
        String startTime = req.get("startTime");
        String endTime = req.get("endTime");
        if (slot == null || startTime == null || endTime == null) {
            return Result.error(400, "缺少必要参数");
        }
        TimeSlot timeSlot = new TimeSlot();
        timeSlot.setSlotName(slot);
        timeSlot.setStartTime(LocalTime.parse(startTime));
        timeSlot.setEndTime(LocalTime.parse(endTime));
        timeSlot.setStatus(1);
        timeSlotMapper.insert(timeSlot);
        return Result.success();
    }

    @PutMapping("/timeslot/update/{slotId}")
    @Transactional
    public Result<Void> updateTimeSlot(@PathVariable Integer slotId, @RequestBody Map<String, String> req) {
        TimeSlot slot = timeSlotMapper.findById(slotId);
        if (slot == null) return Result.error(404, "时段不存在");
        if (req.containsKey("slot")) slot.setSlotName(req.get("slot"));
        if (req.containsKey("startTime")) slot.setStartTime(LocalTime.parse(req.get("startTime")));
        if (req.containsKey("endTime")) slot.setEndTime(LocalTime.parse(req.get("endTime")));
        timeSlotMapper.update(slot);
        return Result.success();
    }

    @DeleteMapping("/timeslot/delete/{slotId}")
    @Transactional
    public Result<Void> deleteTimeSlot(@PathVariable Integer slotId) {
        int count = reservationMapper.countBySlotId(slotId);
        if (count > 0) {
            return Result.error(400, "该时段已有预约记录，无法删除");
        }
        timeSlotMapper.deleteById(slotId);
        return Result.success();
    }

    // ==================== 用户管理 ====================
    @GetMapping("/users")
    public Result<List<Map<String, Object>>> listUsers(@RequestParam Map<String, String> params) {
        List<Student> students = studentMapper.findAll();
        List<Map<String, Object>> result = students.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getStuId());
            map.put("username", s.getStuId());
            map.put("name", s.getName());
            map.put("role", "STUDENT");
            map.put("enabled", true);
            map.put("violationCount", s.getViolationCount());
            map.put("isBlacklisted", s.getIsBlacklisted() == 1);
            map.put("banEndDate", s.getBanExpireTime());
            return map;
        }).collect(Collectors.toList());
        // 可选过滤：params 中可能含有 role, keyword, isBlacklisted 等
        return Result.success(result);
    }

    @PostMapping("/user/add")
    @Transactional
    public Result<Void> addUser(@RequestBody Map<String, Object> req) {
        String username = (String) req.get("username");
        String name = (String) req.get("name");
        String role = (String) req.get("role");
        Boolean enabled = (Boolean) req.get("enabled");
        if (username == null || name == null) {
            return Result.error(400, "缺少用户名或姓名");
        }
        // 只处理学生用户，管理员创建需单独处理
        if ("STUDENT".equals(role)) {
            Student student = new Student();
            student.setStuId(username);
            student.setName(name);
            student.setPassword("123456"); // 默认密码，实际应加密
            student.setViolationCount(0);
            student.setIsBlacklisted(0);
            student.setBanExpireTime(null);
            studentMapper.insert(student);
            return Result.success();
        } else {
            return Result.error(400, "暂不支持创建管理员");
        }
    }

    @PutMapping("/user/update/{userId}")
    @Transactional
    public Result<Void> updateUser(@PathVariable String userId, @RequestBody Map<String, Object> req) {
        Student student = studentMapper.findByStuId(userId);
        if (student == null) return Result.error(404, "用户不存在");
        if (req.containsKey("name")) student.setName((String) req.get("name"));
        if (req.containsKey("enabled")) {
            // 启用/禁用可映射到黑名单或其他字段，暂时忽略
        }
        studentMapper.updateInfo(student);
        return Result.success();
    }

    @DeleteMapping("/user/delete/{userId}")
    @Transactional
    public Result<Void> deleteUser(@PathVariable String userId) {
        List<Reservation> reservations = reservationMapper.findByStuId(userId);
        boolean hasActive = reservations.stream().anyMatch(r -> r.getResStatus() == 0 || r.getResStatus() == 1);
        if (hasActive) {
            return Result.error(400, "该用户存在未完成的预约，无法删除");
        }
        studentMapper.deleteByStuId(userId);
        return Result.success();
    }

    // ==================== 签到签退 ====================
    @PutMapping("/check/in/{reservationId}")
    @Transactional
    public Result<Map<String, Object>> checkIn(@PathVariable Integer reservationId) {
        Reservation res = reservationMapper.findById(reservationId);
        if (res == null) return Result.error(404, "预约记录不存在");
        if (res.getResStatus() != 0) return Result.error(400, "当前状态无法签到");
        checkService.checkin(reservationId, res.getStuId(), "admin");
        Map<String, Object> data = new HashMap<>();
        data.put("id", reservationId);
        data.put("status", "CHECKED_IN");
        data.put("checkInTime", LocalDateTime.now().toString());
        return Result.success(data);
    }

    @PutMapping("/check/out/{reservationId}")
    @Transactional
    public Result<Map<String, Object>> checkOut(@PathVariable Integer reservationId) {
        Reservation res = reservationMapper.findById(reservationId);
        if (res == null) return Result.error(404, "预约记录不存在");
        if (res.getResStatus() != 1) return Result.error(400, "未签到或已签退");
        checkService.checkout(reservationId, res.getStuId(), "admin");
        Map<String, Object> data = new HashMap<>();
        data.put("id", reservationId);
        data.put("status", "COMPLETED");
        data.put("checkOutTime", LocalDateTime.now().toString());
        return Result.success(data);
    }

    @GetMapping("/reserve/search")
    public Result<Map<String, Object>> searchReservationByStudentId(@RequestParam String studentId) {
        List<Reservation> reservations = reservationMapper.findByStuId(studentId);
        Reservation current = reservations.stream()
                .filter(r -> r.getResStatus() == 0 || r.getResStatus() == 1)
                .findFirst()
                .orElse(null);
        if (current == null) {
            return Result.error(404, "未找到该学生当前有效预约");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("id", current.getResId());
        String status = current.getResStatus() == 0 ? "RESERVED" : "CHECKED_IN";
        data.put("status", status);
        if (current.getCheckinTime() != null) data.put("checkInTime", current.getCheckinTime().toString());
        if (current.getCheckoutTime() != null) data.put("checkOutTime", current.getCheckoutTime().toString());
        return Result.success(data);
    }

    // ==================== 违约管理 ====================
    @GetMapping("/violate/list")
    public Result<List<Map<String, Object>>> getAllViolations(@RequestParam(required = false) String studentId) {
        List<ViolateRecord> records;
        if (studentId != null && !studentId.isEmpty()) {
            records = violateRecordMapper.findByStuId(studentId);
        } else {
            records = violateRecordMapper.findAll();
        }
        List<Map<String, Object>> result = records.stream().map(v -> {
            Student s = studentMapper.findByStuId(v.getStuId());
            Map<String, Object> map = new HashMap<>();
            map.put("id", v.getViolateId());
            map.put("studentId", v.getStuId());
            map.put("studentName", s != null ? s.getName() : "");
            map.put("violationType", v.getViolateReason());
            map.put("violationTime", v.getViolateTime().toString());
            map.put("description", v.getViolateReason());
            return map;
        }).collect(Collectors.toList());
        return Result.success(result);
    }

    @PostMapping("/violate/add/{userId}")
    @Transactional
    public Result<Void> addViolation(@PathVariable String userId, @RequestBody Map<String, String> req) {
        String violationType = req.get("violationType");
        String description = req.get("description");
        // 查找该学生最新的未完成预约
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
    public Result<Void> removeBlacklist(@PathVariable String userId) {
        studentMapper.clearBlacklist(userId);
        return Result.success();
    }

    // ==================== 预约管理（额外，文档未列但前端可能需要） ====================
    @GetMapping("/reserve/list")
    public Result<List<Reservation>> getAllReservations(@RequestParam Map<String, String> params) {
        List<Reservation> list = reservationMapper.findAll();
        // 可选过滤
        if (params.containsKey("date")) {
            String date = params.get("date");
            list = list.stream().filter(r -> r.getResDate().toString().equals(date)).collect(Collectors.toList());
        }
        if (params.containsKey("status")) {
            int status = Integer.parseInt(params.get("status"));
            list = list.stream().filter(r -> r.getResStatus() == status).collect(Collectors.toList());
        }
        return Result.success(list);
    }
}