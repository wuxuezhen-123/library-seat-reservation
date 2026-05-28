package com.library.service;

import com.library.dto.ReserveRequest;
import com.library.entity.Reservation;
import java.time.LocalDate;
import java.util.List;

public interface ReservationService {
    void reserve(ReserveRequest request);          // 预约
    void cancel(Integer resId, String stuId);      // 取消预约
    List<Reservation> getReservationsBySeat(Integer seatId, LocalDate date);
    Reservation getById(Integer resId);
}