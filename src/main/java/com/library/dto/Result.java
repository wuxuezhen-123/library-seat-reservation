package com.library.dto;

import lombok.Data;

/**
 * 统一返回结果类
 * 格式: {"code": 200, "msg": "提示信息", "data": 返回数据}
 * code 为 Integer 类型，前端使用 response.code === 200 判断
 */
@Data
public class Result<T> {
    private Integer code;
    private String msg;
    private T data;

    private Result() {}

    // ========== 成功方法 ==========
    public static <T> Result<T> success() {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg("success");
        return result;
    }

    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg("success");
        result.setData(data);
        return result;
    }

    public static <T> Result<T> success(String msg, T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg(msg);
        result.setData(data);
        return result;
    }

    // ========== 失败方法 ==========
    public static <T> Result<T> error() {
        Result<T> result = new Result<>();
        result.setCode(500);
        result.setMsg("error");
        return result;
    }

    public static <T> Result<T> error(String msg) {
        Result<T> result = new Result<>();
        result.setCode(500);
        result.setMsg(msg);
        return result;
    }

    // 新增：支持自定义整数状态码的错误返回
    public static <T> Result<T> error(int code, String msg) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMsg(msg);
        return result;
    }
}