package com.library.controller;

import com.library.dto.LoginRequest;
import com.library.dto.Result;
import com.library.entity.LibraryKeeper;
import com.library.entity.Student;
import com.library.mapper.LibraryKeeperMapper;
import com.library.mapper.StudentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private StudentMapper studentMapper;

    @Autowired
    private LibraryKeeperMapper libraryKeeperMapper;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest loginRequest) {
        String username = loginRequest.getUsername();
        String password = loginRequest.getPassword();
        String role = loginRequest.getRole();

        if ("STUDENT".equals(role)) {
            Student student = studentMapper.findByStuId(username);
            if (student == null) {
                // 改用字符串状态码
                return Result.error(401, "学号不存在");
            }
            if (!password.equals(student.getPassword())) {
                return Result.error(401, "密码错误");
            }
            boolean isBlacklisted = false;
            if (student.getIsBlacklisted() == 1 && student.getBanExpireTime() != null) {
                if (student.getBanExpireTime().isAfter(LocalDateTime.now())) {
                    isBlacklisted = true;
                }
            }
            Map<String, Object> data = new HashMap<>();
            data.put("id", student.getStuId());
            data.put("username", student.getStuId());
            data.put("name", student.getName());
            data.put("role", "STUDENT");
            data.put("token", UUID.randomUUID().toString().replace("-", ""));
            data.put("isBlacklisted", isBlacklisted);
            return Result.success("登录成功", data);
        } else if ("ADMIN".equals(role)) {
            LibraryKeeper keeper = libraryKeeperMapper.findByKeeperId(username);
            if (keeper == null) {
                return Result.error(401, "管理员账号不存在");
            }
            if (!password.equals(keeper.getPassword())) {
                return Result.error(401, "密码错误");
            }
            Map<String, Object> data = new HashMap<>();
            data.put("id", keeper.getKeeperId());
            data.put("username", keeper.getKeeperId());
            data.put("name", keeper.getName());
            data.put("role", "ADMIN");
            data.put("token", UUID.randomUUID().toString().replace("-", ""));
            data.put("isBlacklisted", false);
            return Result.success("登录成功", data);
        } else {
            return Result.error(400, "无效的角色类型");
        }
    }

    @GetMapping("/info")
    public Result<Map<String, Object>> getUserInfo(@RequestHeader(value = "Authorization", required = false) String token,
                                                   @RequestHeader(value = "X-User-Id", required = false) String userId) {
        String stuId = (userId != null && !userId.isEmpty()) ? userId : "20240001";
        Student student = studentMapper.findByStuId(stuId);
        if (student == null) {
            return Result.error(404, "用户不存在");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("id", student.getStuId());
        data.put("username", student.getStuId());
        data.put("name", student.getName());
        data.put("role", "STUDENT");
        return Result.success(data);
    }
}