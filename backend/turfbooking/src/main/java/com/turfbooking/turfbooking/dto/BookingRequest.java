package com.turfbooking.turfbooking.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record BookingRequest(
        Long customerId,
        Long turfId,
        LocalDate bookingDate,
        LocalTime startTime,
        Integer durationHours
) {}