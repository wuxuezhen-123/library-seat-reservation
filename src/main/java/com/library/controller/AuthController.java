package com.library.controller;

import com.library.dto.LoginRequest;
import com.library.dto.Result;
import com.library.entity.LibraryKeeper;
import com.library.entity.Student;
import com.library.mapper.LibraryKeeperMapper;
import com.library.mapper.StudentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private StudentMapper studentMapper;
    @Autowired
    private LibraryKeeperMapper keeperMapper;

    // ========== 登录接口 ==========
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest req) {
        String username = req.getUsername();
        String password = req.getPassword();
        String role = req.getRole();

        if ("STUDENT".equals(role)) {
            Student student = studentMapper.findByStuId(username);
            if (student == null) {
                return Result.error(401, "学号不存在");
            }
            if (!password.equals(student.getPassword())) {
                return Result.error(401, "密码错误");
            }
            Map<String, Object> data = new HashMap<>();
            data.put("id", student.getStuId());
            data.put("username", student.getStuId());
            data.put("name", student.getName());
            data.put("role", "STUDENT");
            data.put("token", UUID.randomUUID().toString().replace("-", ""));
            data.put("isBlacklisted", student.getIsBlacklisted() == 1);
            return Result.success("登录成功", data);
        } else if ("ADMIN".equals(role)) {
            LibraryKeeper keeper = keeperMapper.findByKeeperId(username);
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

    // ========== 获取当前用户信息（完整） ==========
    @GetMapping("/info")
    public Result<Map<String, Object>> getUserInfo(@RequestHeader(value = "Authorization", required = false) String token,
                                                   @RequestHeader(value = "X-User-Id", required = false) String userId) {
        // 优先从 X-User-Id 获取，若未传则使用默认测试学号
        String id = (userId != null && !userId.isEmpty()) ? userId : "20240001";

        // 尝试查询学生
        Student student = studentMapper.findByStuId(id);
        if (student != null) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", student.getStuId());
            data.put("username", student.getStuId());
            data.put("name", student.getName());
            data.put("role", "STUDENT");
            data.put("enabled", true);
            data.put("violationCount", student.getViolationCount());
            data.put("isBlacklisted", student.getIsBlacklisted() == 1);
            data.put("banEndDate", student.getBanExpireTime());
            return Result.success(data);
        }

        // 尝试查询管理员
        LibraryKeeper keeper = keeperMapper.findByKeeperId(id);
        if (keeper != null) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", keeper.getKeeperId());
            data.put("username", keeper.getKeeperId());
            data.put("name", keeper.getName());
            data.put("role", "ADMIN");
            data.put("enabled", true);
            data.put("violationCount", 0);
            data.put("isBlacklisted", false);
            data.put("banEndDate", null);
            return Result.success(data);
        }

        return Result.error(404, "用户不存在");
    }
}