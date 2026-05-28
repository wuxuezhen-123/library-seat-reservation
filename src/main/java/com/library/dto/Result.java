package com.library.dto;

import lombok.Data;

/**
 * 统一返回结果类
 * 格式: {"code": 状态码, "msg": 提示信息, "data": 返回数据}
 */
@Data
public class Result<T> {
    private Integer code;
    private String msg;
    private T data;

    // 私有构造，通过静态方法创建
    private Result() {}

    // 成功，无数据
    public static <T> Result<T> success() {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg("success");
        return result;
    }

    // 成功，带数据
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg("success");
        result.setData(data);
        return result;
    }

    // 成功，自定义消息
    public static <T> Result<T> success(String msg, T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg(msg);
        result.setData(data);
        return result;
    }

    // 失败，默认消息
    public static <T> Result<T> error() {
        Result<T> result = new Result<>();
        result.setCode(500);
        result.setMsg("error");
        return result;
    }

    // 失败，自定义消息
    public static <T> Result<T> error(String msg) {
        Result<T> result = new Result<>();
        result.setCode(500);
        result.setMsg(msg);
        return result;
    }

    // 失败，自定义状态码和消息
    public static <T> Result<T> error(Integer code, String msg) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMsg(msg);
        return result;
    }
}