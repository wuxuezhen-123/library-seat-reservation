package com.library.mapper;

import com.library.entity.LibraryKeeper;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface LibraryKeeperMapper {

    @Select("SELECT * FROM library_keeper WHERE keeper_id = #{keeperId}")
    LibraryKeeper findByKeeperId(String keeperId);

    @Select("SELECT * FROM library_keeper ORDER BY keeper_id")
    List<LibraryKeeper> findAll();

    @Insert("INSERT INTO library_keeper (keeper_id, password, name) VALUES (#{keeperId}, #{password}, #{name})")
    void insert(LibraryKeeper keeper);

    @Update("UPDATE library_keeper SET password = #{password}, name = #{name} WHERE keeper_id = #{keeperId}")
    void update(LibraryKeeper keeper);

    @Delete("DELETE FROM library_keeper WHERE keeper_id = #{keeperId}")
    void deleteById(String keeperId);
}