package com.turfbooking.turfbooking.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.turfbooking.turfbooking.dto.BookingRequest;
import com.turfbooking.turfbooking.entity.Booking;
import com.turfbooking.turfbooking.service.BookingService;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createBooking(
            @RequestBody BookingRequest request) {

        Booking booking = bookingService.createBooking(request);

        Map<String, Object> result = new HashMap<>();

        result.put("id", booking.getId());
        result.put("customerId", booking.getCustomer().getId());
        result.put("turfId", booking.getTurf().getId());
        result.put("bookingDate", booking.getBookingDate());
        result.put("startTime", booking.getStartTime());
        result.put("endTime", booking.getEndTime());
        result.put("durationHours", booking.getDurationHours());
        result.put("totalPrice", booking.getTotalPrice());
        result.put("status", booking.getStatus());

        return result;
    }

    @GetMapping("/availability")
    public List<Map<String, Object>> getAvailability(
            @RequestParam Long turfId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        return bookingService.getBookedSlots(turfId, date)
                .stream()
                .map(booking -> {
                    Map<String, Object> result = new HashMap<>();

                    result.put("startTime", booking.getStartTime());
                    result.put("endTime", booking.getEndTime());
                    result.put("durationHours", booking.getDurationHours());

                    return result;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/my-bookings")
    public List<Map<String, Object>> getMyBookings(
            @RequestParam Long customerId) {

        return bookingService.getMyBookings(customerId)
                .stream()
                .map(booking -> {
                    Map<String, Object> result = new HashMap<>();

                    result.put("id", booking.getId());
                    result.put("customerId", booking.getCustomer().getId());
                    result.put("turfId", booking.getTurf().getId());
                    result.put("turfName", booking.getTurf().getTurfName());
                    result.put("location", booking.getTurf().getLocation());

                    // Multiple sports
                    result.put("sportType", booking.getTurf().getSportTypes());

                    result.put("imageUrl", booking.getTurf().getImageUrl());
                    result.put("date", booking.getBookingDate());
                    result.put("startTime", booking.getStartTime());
                    result.put("endTime", booking.getEndTime());
                    result.put("duration", booking.getDurationHours());
                    result.put("totalAmount", booking.getTotalPrice());
                    result.put("status", booking.getStatus());

                    return result;
                })
                .collect(Collectors.toList());
    }

    @PutMapping("/{bookingId}/cancel")
    public Map<String, Object> cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam Long customerId) {

        Booking booking = bookingService.cancelBooking(
                bookingId, customerId);

        Map<String, Object> result = new HashMap<>();

        result.put("message", "Booking cancelled successfully");
        result.put("id", booking.getId());
        result.put("status", booking.getStatus());

        return result;
    }
}