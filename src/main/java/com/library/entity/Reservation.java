package com.library.entity;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

//预约记录表

@Data
public class Reservation {
    private Integer resId;  //预约记录ID
    private String stuId;  //学生学号
    private Integer seatId;  //座位ID
    private Integer slotId;  //时段ID
    private LocalDate resDate;  //预约日期
    private Integer resStatus;  //预约状态：0-已预约，1-已签到，2-已签退，3-已取消，4-违约终止
    private LocalDateTime checkinTime;  //实际签到时间
    private LocalDateTime checkoutTime;  //实际签退时间
    private LocalDateTime createdAt;  //预约创建时间
    private LocalDateTime updatedAt;  //最后更新时间
}