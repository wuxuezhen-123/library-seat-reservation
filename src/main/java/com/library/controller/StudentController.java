package com.library.controller;

import com.library.dto.ReserveRequest;
import com.library.dto.Result;
import com.library.entity.Reservation;
import com.library.entity.Student;
import com.library.entity.ViolateRecord;
import com.library.service.ReservationService;
import com.library.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private StudentService studentService;
    @Autowired
    private ReservationService reservationService;

    // 获取个人信息
    @GetMapping("/info/{stuId}")
    public Result getInfo(@PathVariable String stuId) {
        Student student = studentService.getStudentInfo(stuId);
        return Result.success("查询成功", student);
    }

    // 获取我的预约记录
    @GetMapping("/reservations/{stuId}")
    public Result getMyReservations(@PathVariable String stuId) {
        List<Reservation> list = studentService.getMyReservations(stuId);
        return Result.success("查询成功", list);
    }

    // 获取我的违约记录
    @GetMapping("/violations/{stuId}")
    public Result getMyViolations(@PathVariable String stuId) {
        List<ViolateRecord> list = studentService.getMyViolations(stuId);
        return Result.success("查询成功", list);
    }

    // 预约座位
    @PostMapping("/reserve")
    public Result reserve(@RequestBody ReserveRequest request) {
        reservationService.reserve(request);
        return Result.success("预约成功");
    }

    // 取消预约
    @PutMapping("/cancel/{resId}")
    public Result cancel(@PathVariable Integer resId, @RequestParam String stuId) {
        reservationService.cancel(resId, stuId);
        return Result.success("取消成功");
    }
    @GetMapping("/test")
    public String test() {
        return "✅ 后端启动成功！图书馆预约系统运行正常";
    }
}
