package com.library.mapper;

import com.library.entity.Reservation;
import org.apache.ibatis.annotations.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ReservationMapper {

    @Select("SELECT * FROM reservation")
    List<Reservation> findAll();

    @Select("SELECT * FROM reservation WHERE seat_id = #{seatId}")
    List<Reservation> findBySeatId(Integer seatId);

    @Select("SELECT COUNT(*) FROM reservation")
    int countAll();

    @Select("SELECT COUNT(*) FROM reservation WHERE slot_id = #{slotId}")
    int countBySlotId(Integer slotId);

    /**
     * 插入预约记录（预约创建时使用）
     */
    @Insert("INSERT INTO reservation (stu_id, seat_id, slot_id, res_date, res_status) " +
            "VALUES (#{stuId}, #{seatId}, #{slotId}, #{resDate}, #{resStatus})")
    @Options(useGeneratedKeys = true, keyProperty = "resId")
    void insert(Reservation reservation);

    /**
     * 根据预约ID查询
     */
    @Select("SELECT * FROM reservation WHERE res_id = #{resId}")
    Reservation findById(Integer resId);

    /**
     * 查询某个学生的所有预约（按预约创建时间倒序）
     */
    @Select("SELECT * FROM reservation WHERE stu_id = #{stuId} ORDER BY created_at DESC")
    List<Reservation> findByStuId(String stuId);

    /**
     * 查询某个座位在某日某时段的预约（用于唯一性校验）
     */
    @Select("SELECT COUNT(*) FROM reservation WHERE seat_id = #{seatId} AND slot_id = #{slotId} AND res_date = #{resDate}")
    int countBySeatAndSlot(@Param("seatId") Integer seatId, @Param("slotId") Integer slotId, @Param("resDate") LocalDate resDate);

    /**
     * 查询某个学生在某日某时段的预约（用于唯一性校验）
     */
    @Select("SELECT COUNT(*) FROM reservation WHERE stu_id = #{stuId} AND slot_id = #{slotId} AND res_date = #{resDate}")
    int countByStuAndSlot(@Param("stuId") String stuId, @Param("slotId") Integer slotId, @Param("resDate") LocalDate resDate);

    /**
     * 更新预约状态
     * @param resId 预约ID
     * @param status 状态（0-已预约，1-已签到，2-已签退，3-已取消，4-违约终止）
     */
    @Update("UPDATE reservation SET res_status = #{status}, updated_at = NOW() WHERE res_id = #{resId}")
    void updateStatus(@Param("resId") Integer resId, @Param("status") Integer status);

    /**
     * 签到：更新状态为1，记录签到时间
     */
    @Update("UPDATE reservation SET res_status = 1, checkin_time = #{checkinTime}, updated_at = NOW() WHERE res_id = #{resId}")
    void checkin(@Param("resId") Integer resId, @Param("checkinTime") LocalDateTime checkinTime);

    /**
     * 签退：更新状态为2，记录签退时间
     */
    @Update("UPDATE reservation SET res_status = 2, checkout_time = #{checkoutTime}, updated_at = NOW() WHERE res_id = #{resId}")
    void checkout(@Param("resId") Integer resId, @Param("checkoutTime") LocalDateTime checkoutTime);

    /**
     * 查询已过期仍未签到的预约（用于定时任务违约判定）
     * 条件：状态=0（已预约），预约日期+时段结束时间 < 当前时间
     * 注意：需要联查time_slot表获取时段结束时间，这里用简单实现，实际建议用XML或使用SQL函数
     */
    @Select("SELECT r.* FROM reservation r " +
            "JOIN time_slot t ON r.slot_id = t.slot_id " +
            "WHERE r.res_status = 0 " +
            "AND CONCAT(r.res_date, ' ', t.end_time) < NOW()")
    List<Reservation> findExpiredUnchecked();

    /**
     * 查询已签到但未签退且已过时段结束时间的预约（超时未签退）
     * 条件：状态=1（已签到），预约日期+时段结束时间 < 当前时间
     */
    @Select("SELECT r.* FROM reservation r " +
            "JOIN time_slot t ON r.slot_id = t.slot_id " +
            "WHERE r.res_status = 1 " +
            "AND CONCAT(r.res_date, ' ', t.end_time) < NOW()")
    List<Reservation> findExpiredUncheckedOut();

    /**
     * 取消预约（仅限未开始的预约，由应用层控制时间）
     */
    @Update("UPDATE reservation SET res_status = 3, updated_at = NOW() WHERE res_id = #{resId}")
    void cancel(Integer resId);
}