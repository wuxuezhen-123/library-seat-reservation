package com.library.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ReserveRequest {
    private String stuId;      // 学号
    private Integer seatId;    // 座位ID
    private Integer slotId;    // 时段ID
    private LocalDate resDate; // 预约日期
}