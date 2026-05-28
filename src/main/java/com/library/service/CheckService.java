package com.library.service;

public interface CheckService {
    void checkin(Integer resId, String stuId, String adminId);
    void checkout(Integer resId, String stuId, String adminId);
}