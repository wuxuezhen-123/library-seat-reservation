package com.library.controller;

import com.library.dto.Result;
import com.library.mapper.ReservationMapper;
import com.library.mapper.SeatMapper;
import com.library.mapper.StudentMapper;
import com.library.mapper.ViolateRecordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StatisticsController {

    @Autowired
    private SeatMapper seatMapper;
    @Autowired
    private StudentMapper studentMapper;
    @Autowired
    private ViolateRecordMapper violateRecordMapper;
    @Autowired
    private ReservationMapper reservationMapper;

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