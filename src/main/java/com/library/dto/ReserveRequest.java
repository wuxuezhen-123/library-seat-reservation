package com.library.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ReserveRequest {
    private Integer seatId;      // 座位ID
    private LocalDate date;      // 预约日期（前端字段名 date）
    private Integer timeSlotId;  // 时段ID（前端字段名 timeSlotId）
}