package com.library.mapper;

import com.library.entity.Student;
import org.apache.ibatis.annotations.*;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface StudentMapper {

    /**
     * 根据学号查询学生
     */
    @Select("SELECT * FROM student WHERE stu_id = #{stuId}")
    Student findByStuId(String stuId);

    @Select("SELECT COUNT(*) FROM student")
    int countAll();

    @Select("SELECT COUNT(*) FROM student WHERE is_blacklisted = 1")
    int countBlacklisted();

    /**
     * 插入学生（注册时使用）
     */
    @Insert("INSERT INTO student (stu_id, password, name) VALUES (#{stuId}, #{password}, #{name})")
    void insert(Student student);

    /**
     * 更新学生的违约次数和黑名单信息
     */
    @Update("UPDATE student SET violation_count = #{violationCount}, is_blacklisted = #{isBlacklisted}, ban_expire_time = #{banExpireTime}, updated_at = NOW() WHERE stu_id = #{stuId}")
    void updateViolation(Student student);

    /**
     * 仅更新违约次数（违约判定时使用）
     */
    @Update("UPDATE student SET violation_count = #{violationCount}, updated_at = NOW() WHERE stu_id = #{stuId}")
    void updateViolationCount(@Param("stuId") String stuId, @Param("violationCount") Integer violationCount);

    /**
     * 解除黑名单（清空封禁时间和黑名单状态）
     */
    @Update("UPDATE student SET is_blacklisted = 0, ban_expire_time = NULL, violation_count = 0, updated_at = NOW() WHERE stu_id = #{stuId}")
    void clearBlacklist(String stuId);

    /**
     * 查询所有学生（管理员用）
     */
    @Select("SELECT * FROM student ORDER BY stu_id")
    List<Student> findAll();

    /**
     * 删除学生（管理员用，谨慎操作）
     */
    @Delete("DELETE FROM student WHERE stu_id = #{stuId}")
    void deleteByStuId(String stuId);

    /**
     * 更新学生基础信息（姓名、密码等）
     */
    @Update("UPDATE student SET name = #{name}, password = #{password}, updated_at = NOW() WHERE stu_id = #{stuId}")
    void updateInfo(Student student);
}