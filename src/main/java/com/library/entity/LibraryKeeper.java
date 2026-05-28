package com.library.entity;

import lombok.Data;
import java.time.LocalDateTime;
//管理员表
@Data
public class LibraryKeeper {
    private String keeperId;   // 工号
    private String password;   // 密码
    private String name;       // 姓名
    private LocalDateTime createdAt;  //创建时间
}