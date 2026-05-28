package com.library.entity;

import lombok.Data;

/**
 * 区域表对应实体类
 * 表名：area
 */
@Data
public class Area {
    /**
     * 区域ID，主键自增
     */
    private Integer areaId;

    /**
     * 区域名称（A区/B区/C区）
     */
    private String areaName;

    /**
     * 启用状态：0-停用，1-启用
     */
    private Integer status;
}