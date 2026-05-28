package com.library.entity;

import java.time.LocalDateTime;

/**
 * 学生实体类，对应数据库表 student
 */
public class Student {
    private String stuId;            // 学号
    private String password;         // 密码（实际存储加密后的密文）
    private String name;             // 姓名
    private Integer violationCount;  // 当前连续有效违约次数
    private Integer isBlacklisted;   // 是否在黑名单中（0-否，1-是）
    private LocalDateTime banExpireTime; // 黑名单解封时间
    private LocalDateTime createdAt;     // 创建时间
    private LocalDateTime updatedAt;     // 更新时间

    // 无参构造方法
    public Student() {}

    // 全参构造方法（可选，按需使用）
    public Student(String stuId, String password, String name, Integer violationCount,
                   Integer isBlacklisted, LocalDateTime banExpireTime,
                   LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.stuId = stuId;
        this.password = password;
        this.name = name;
        this.violationCount = violationCount;
        this.isBlacklisted = isBlacklisted;
        this.banExpireTime = banExpireTime;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getter 和 Setter 方法
    public String getStuId() {
        return stuId;
    }

    public void setStuId(String stuId) {
        this.stuId = stuId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getViolationCount() {
        return violationCount;
    }

    public void setViolationCount(Integer violationCount) {
        this.violationCount = violationCount;
    }

    public Integer getIsBlacklisted() {
        return isBlacklisted;
    }

    public void setIsBlacklisted(Integer isBlacklisted) {
        this.isBlacklisted = isBlacklisted;
    }

    public LocalDateTime getBanExpireTime() {
        return banExpireTime;
    }

    public void setBanExpireTime(LocalDateTime banExpireTime) {
        this.banExpireTime = banExpireTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "Student{" +
                "stuId='" + stuId + '\'' +
                ", name='" + name + '\'' +
                ", violationCount=" + violationCount +
                ", isBlacklisted=" + isBlacklisted +
                ", banExpireTime=" + banExpireTime +
                '}';
    }
}