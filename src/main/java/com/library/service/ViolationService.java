package com.library.service;

public interface ViolationService {
    void checkNoShow();           // 超时未签到判定
    void checkOverdueCheckout();  // 超时未签退判定
    void autoUnblock();           // 自动解封过期黑名单
    void manualMarkViolation(Integer resId, String reason); // 管理员手动标记违约
}