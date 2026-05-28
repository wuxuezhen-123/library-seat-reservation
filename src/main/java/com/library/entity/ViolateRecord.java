package com.library.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 违约记录表对应实体类
 * 表名：violate_record
 */
@Data
public class ViolateRecord {
    /**
     * 违约记录ID，主键自增
     */
    private Integer violateId;

    /**
     * 学生学号（关联student表）
     */
    private String stuId;

    /**
     * 关联的预约记录ID（关联reservation表，一对一）
     */
    private Integer resId;

    /**
     * 违约原因（如：超时未签到、超时未签退、管理员标记）
     */
    private String violateReason;

    /**
     * 违约发生时间
     */
    private LocalDateTime violateTime;

    /**
     * 是否计入连续违约计数：1-是，0-否
     */
    private Integer isEffective;
}