package com.library.mapper;

import com.library.entity.Area;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface AreaMapper {

    @Select("SELECT * FROM study_area WHERE area_id = #{areaId}")
    Area findById(Integer areaId);

    @Select("SELECT * FROM study_area WHERE status = 1 ORDER BY area_id")
    List<Area> findAllEnabled();

    @Select("SELECT * FROM study_area ORDER BY area_id")
    List<Area> findAll();

    @Insert("INSERT INTO study_area (area_name, status) VALUES (#{areaName}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "areaId")
    void insert(Area area);

    @Update("UPDATE study_area SET area_name = #{areaName}, status = #{status} WHERE area_id = #{areaId}")
    void update(Area area);

    @Delete("DELETE FROM study_area WHERE area_id = #{areaId}")
    void deleteById(Integer areaId);
}