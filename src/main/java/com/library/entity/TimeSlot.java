package com.library.entity;

import lombok.Data;
import java.time.LocalTime;

/**
 * 时段表对应实体类
 * 表名：time_slot
 */
@Data
public class TimeSlot {
    /**
     * 时段ID，主键自增
     */
    private Integer slotId;

    /**
     * 时段名称（上午场/下午场/晚间场）
     */
    private String slotName;

    /**
     * 开始时间（如 08:00:00）
     */
    private LocalTime startTime;

    /**
     * 结束时间（如 12:00:00）
     */
    private LocalTime endTime;

    /**
     * 启用状态：0-停用，1-启用
     */
    private Integer status;
}