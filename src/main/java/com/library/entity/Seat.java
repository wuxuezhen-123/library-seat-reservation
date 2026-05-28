package com.library.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 座位表对应实体类
 * 表名：seat
 */
@Data
public class Seat {
    /**
     * 座位ID，主键自增
     */
    private Integer seatId;

    /**
     * 所属区域ID（关联area表）
     */
    private Integer areaId;

    /**
     * 座位编号（同一区域内唯一，如1,2,...,20）
     */
    private String seatCode;

    /**
     * 座位状态：0-空闲，1-已预约，2-已占用
     */
    private Integer seatStatus;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
}