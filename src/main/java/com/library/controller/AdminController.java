package com.library.controller;

import com.library.dto.Result;
import com.library.entity.*;
import com.library.service.AdminService;
import com.library.service.CheckService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;
    @Autowired
    private CheckService checkService;

    // 签到
    @PutMapping("/checkin")
    public Result checkin(@RequestParam Integer resId, @RequestParam String stuId, @RequestParam String adminId) {
        checkService.checkin(resId, stuId, adminId);
        return Result.success("签到成功");
    }

    // 签退
    @PutMapping("/checkout")
    public Result checkout(@RequestParam Integer resId, @RequestParam String stuId, @RequestParam String adminId) {
        checkService.checkout(resId, stuId, adminId);
        return Result.success("签退成功");
    }

    // 区域管理
    @GetMapping("/areas")
    public Result listAreas() {
        return Result.success("查询成功", adminService.listAllAreas());
    }
    @PostMapping("/area")
    public Result addArea(@RequestBody Area area) {
        adminService.addArea(area);
        return Result.success("添加成功");
    }
    @PutMapping("/area")
    public Result updateArea(@RequestBody Area area) {
        adminService.updateArea(area);
        return Result.success("更新成功");
    }
    @DeleteMapping("/area/{areaId}")
    public Result deleteArea(@PathVariable Integer areaId) {
        adminService.deleteArea(areaId);
        return Result.success("删除成功");
    }

    // 座位管理
    @GetMapping("/seats/{areaId}")
    public Result listSeats(@PathVariable Integer areaId) {
        return Result.success("查询成功", adminService.listSeatsByArea(areaId));
    }
    @PostMapping("/seat")
    public Result addSeat(@RequestBody Seat seat) {
        adminService.addSeat(seat);
        return Result.success("添加成功");
    }
    @PutMapping("/seat/status")
    public Result updateSeatStatus(@RequestParam Integer seatId, @RequestParam Integer status) {
        adminService.updateSeatStatus(seatId, status);
        return Result.success("更新成功");
    }
    @DeleteMapping("/seat/{seatId}")
    public Result deleteSeat(@PathVariable Integer seatId) {
        adminService.deleteSeat(seatId);
        return Result.success("删除成功");
    }

    // 时段管理
    @GetMapping("/timeslots")
    public Result listTimeSlots() {
        return Result.success("查询成功", adminService.listAllTimeSlots());
    }
    @PostMapping("/timeslot")
    public Result addTimeSlot(@RequestBody TimeSlot slot) {
        adminService.addTimeSlot(slot);
        return Result.success("添加成功");
    }
    @PutMapping("/timeslot")
    public Result updateTimeSlot(@RequestBody TimeSlot slot) {
        adminService.updateTimeSlot(slot);
        return Result.success("更新成功");
    }
    @PutMapping("/timeslot/status")
    public Result enableTimeSlot(@RequestParam Integer slotId, @RequestParam Integer status) {
        adminService.enableTimeSlot(slotId, status);
        return Result.success("状态更新成功");
    }

    // 学生管理
    @GetMapping("/students")
    public Result listStudents() {
        return Result.success("查询成功", adminService.listAllStudents());
    }
    @DeleteMapping("/student/{stuId}")
    public Result deleteStudent(@PathVariable String stuId) {
        adminService.deleteStudent(stuId);
        return Result.success("删除成功");
    }
    @PutMapping("/student/reset/{stuId}")
    public Result resetViolation(@PathVariable String stuId) {
        adminService.resetViolation(stuId);
        return Result.success("违约次数已清零，黑名单已解除");
    }
}