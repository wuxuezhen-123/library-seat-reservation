package com.library.service;

import com.library.dto.ReserveRequest;
import com.library.entity.Reservation;
import java.time.LocalDate;
import java.util.List;

public interface ReservationService {
    void reserve(ReserveRequest request, String stuId);   // 增加 stuId 参数
    void cancel(Integer resId, String stuId);
    List<Reservation> getReservationsBySeat(Integer seatId, LocalDate date);
    Reservation getById(Integer resId);
}