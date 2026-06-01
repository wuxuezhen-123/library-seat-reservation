package com.library.mapper;

import com.library.entity.TimeSlot;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface TimeSlotMapper {

    @Select("SELECT * FROM time_slot WHERE slot_id = #{slotId}")
    TimeSlot findById(Integer slotId);

    @Delete("DELETE FROM time_slot WHERE slot_id = #{slotId}")
    void deleteById(Integer slotId);

    @Select("SELECT COUNT(*) FROM reservation WHERE slot_id = #{slotId}")
    int countBySlotId(Integer slotId);

    @Select("SELECT * FROM time_slot WHERE status = 1 ORDER BY slot_id")
    List<TimeSlot> findAllEnabled();

    @Select("SELECT * FROM time_slot ORDER BY slot_id")
    List<TimeSlot> findAll();

    @Insert("INSERT INTO time_slot (slot_name, start_time, end_time, status) VALUES (#{slotName}, #{startTime}, #{endTime}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "slotId")
    void insert(TimeSlot timeSlot);

    @Update("UPDATE time_slot SET slot_name = #{slotName}, start_time = #{startTime}, end_time = #{endTime}, status = #{status} WHERE slot_id = #{slotId}")
    void update(TimeSlot timeSlot);

    @Update("UPDATE time_slot SET status = #{status} WHERE slot_id = #{slotId}")
    void updateStatus(@Param("slotId") Integer slotId, @Param("status") Integer status);
}