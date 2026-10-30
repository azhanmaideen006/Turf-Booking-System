
package com.turfbooking.turfbooking.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.turfbooking.turfbooking.entity.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("""
        SELECT COUNT(b)
        FROM Booking b
        WHERE b.turf.id = :turfId
          AND b.bookingDate = :bookingDate
          AND b.status = 'CONFIRMED'
          AND b.startTime < :endTime
          AND b.endTime > :startTime
        """)
    long countOverlappingBookings(
            @Param("turfId") Long turfId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    List<Booking> findByTurf_IdAndBookingDateAndStatus(
            Long turfId,
            LocalDate bookingDate,
            String status
    );

    List<Booking> findByCustomer_IdOrderByBookingDateDescStartTimeDesc(
            Long customerId
    );
}
