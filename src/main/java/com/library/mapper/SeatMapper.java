package com.library.mapper;

import com.library.entity.Seat;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface SeatMapper {

    @Select("SELECT * FROM seat WHERE seat_id = #{seatId}")
    Seat findById(Integer seatId);

    @Select("SELECT * FROM seat")
    List<Seat> findAll();

    @Select("SELECT COUNT(*) FROM seat")
    int countAll();

    @Select("SELECT COUNT(*) FROM seat WHERE seat_status = #{status}")
    int countByStatus(int status);

    @Update("UPDATE seat SET area_id = #{areaId}, seat_code = #{seatCode}, seat_status = #{seatStatus} WHERE seat_id = #{seatId}")
    void update(Seat seat);

    @Select("SELECT * FROM seat WHERE area_id = #{areaId} ORDER BY seat_code")
    List<Seat> findByAreaId(Integer areaId);

    @Select("SELECT * FROM seat WHERE seat_status = 0 AND area_id = #{areaId} ORDER BY seat_code")
    List<Seat> findAvailableByAreaId(Integer areaId);

    @Insert("INSERT INTO seat (area_id, seat_code, seat_status) VALUES (#{areaId}, #{seatCode}, #{seatStatus})")
    @Options(useGeneratedKeys = true, keyProperty = "seatId")
    void insert(Seat seat);

    @Update("UPDATE seat SET seat_status = #{seatStatus} WHERE seat_id = #{seatId}")
    void updateStatus(@Param("seatId") Integer seatId, @Param("seatStatus") Integer seatStatus);

    @Delete("DELETE FROM seat WHERE seat_id = #{seatId}")
    void deleteById(Integer seatId);

    // 新增方法：统计某个区域下的座位数量
    @Select("SELECT COUNT(*) FROM seat WHERE area_id = #{areaId}")
    int countByAreaId(Integer areaId);
}