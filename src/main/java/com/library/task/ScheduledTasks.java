package com.library.task;

import com.library.service.ViolationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
public class ScheduledTasks {

    @Autowired
    private ViolationService violationService;

    // 每小时执行一次：检查超时未签到/签退的预约，生成违约记录
    @Scheduled(cron = "0 0 * * * ?")
    public void checkViolation() {
        violationService.checkNoShow();           // 超时未签到
        violationService.checkOverdueCheckout();  // 超时未签退
    }

    // 每天凌晨1点执行：自动解封已到期的黑名单用户
    @Scheduled(cron = "0 0 1 * * ?")
    public void autoUnblock() {
        violationService.autoUnblock();
    }
}