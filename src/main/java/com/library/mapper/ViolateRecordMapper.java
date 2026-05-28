package com.library.mapper;

import com.library.entity.ViolateRecord;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface ViolateRecordMapper {

    @Select("SELECT * FROM violate_record WHERE violate_id = #{violateId}")
    ViolateRecord findById(Integer violateId);

    @Select("SELECT * FROM violate_record WHERE stu_id = #{stuId} ORDER BY violate_time DESC")
    List<ViolateRecord> findByStuId(String stuId);

    @Select("SELECT * FROM violate_record WHERE res_id = #{resId}")
    ViolateRecord findByResId(Integer resId);

    @Insert("INSERT INTO violate_record (stu_id, res_id, violate_reason, is_effective) VALUES (#{stuId}, #{resId}, #{violateReason}, #{isEffective})")
    @Options(useGeneratedKeys = true, keyProperty = "violateId")
    void insert(ViolateRecord record);

    @Update("UPDATE violate_record SET is_effective = #{isEffective} WHERE violate_id = #{violateId}")
    void updateEffective(@Param("violateId") Integer violateId, @Param("isEffective") Integer isEffective);

    @Select("SELECT COUNT(*) FROM violate_record WHERE stu_id = #{stuId} AND is_effective = 1 AND violate_time > #{since}")
    int countEffectiveSince(@Param("stuId") String stuId, @Param("since") java.time.LocalDateTime since);
}