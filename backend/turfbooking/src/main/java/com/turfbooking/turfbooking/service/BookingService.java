
package com.turfbooking.turfbooking.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.turfbooking.turfbooking.dto.BookingRequest;
import com.turfbooking.turfbooking.entity.Booking;
import com.turfbooking.turfbooking.entity.Customer;
import com.turfbooking.turfbooking.entity.Turf;
import com.turfbooking.turfbooking.repository.BookingRepository;
import com.turfbooking.turfbooking.repository.CustomerRepository;
import com.turfbooking.turfbooking.repository.TurfRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final TurfRepository turfRepository;

    public BookingService(
            BookingRepository bookingRepository,
            CustomerRepository customerRepository,
            TurfRepository turfRepository) {

        this.bookingRepository = bookingRepository;
        this.customerRepository = customerRepository;
        this.turfRepository = turfRepository;
    }

    @Transactional
    public Booking createBooking(BookingRequest request) {

        if (request.customerId() == null
                || request.turfId() == null
                || request.bookingDate() == null
                || request.startTime() == null
                || request.durationHours() == null
                || request.durationHours() < 1
                || request.durationHours() > 3) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid booking details");
        }

        if (request.bookingDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Booking date cannot be in the past");
        }

        Turf turf = turfRepository
                .findByIdForUpdate(request.turfId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Turf not found"));

        Customer customer = customerRepository
                .findById(request.customerId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer not found"));

        LocalTime start = request.startTime();
        LocalTime end = start.plusHours(request.durationHours());

        if (turf.getOpeningTime() == null
                || turf.getClosingTime() == null
                || start.isBefore(turf.getOpeningTime())
                || end.isAfter(turf.getClosingTime())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Booking must be within turf opening hours");
        }

        long overlaps = bookingRepository.countOverlappingBookings(
                turf.getId(),
                request.bookingDate(),
                start,
                end);

        if (overlaps > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This time slot is already booked. Please select another slot.");
        }

        BigDecimal totalPrice = turf.getPricePerHour()
                .multiply(BigDecimal.valueOf(request.durationHours()));

        Booking booking = new Booking();
        booking.setCustomer(customer);
        booking.setTurf(turf);
        booking.setBookingDate(request.bookingDate());
        booking.setStartTime(start);
        booking.setEndTime(end);
        booking.setDurationHours(request.durationHours());
        booking.setTotalPrice(totalPrice);
        booking.setStatus("CONFIRMED");

        return bookingRepository.save(booking);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookedSlots(Long turfId, LocalDate date) {

        if (turfId == null || date == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Turf ID and booking date are required");
        }

        if (!turfRepository.existsById(turfId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Turf not found");
        }

        return bookingRepository
                .findByTurf_IdAndBookingDateAndStatus(
                        turfId,
                        date,
                        "CONFIRMED");
    }

    @Transactional(readOnly = true)
    public List<Booking> getMyBookings(Long customerId) {

        if (customerId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Customer ID is required");
        }

        if (!customerRepository.existsById(customerId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Customer not found");
        }

        return bookingRepository
                .findByCustomer_IdOrderByBookingDateDescStartTimeDesc(
                        customerId);
    }

    @Transactional
    public Booking cancelBooking(Long bookingId, Long customerId) {

        if (bookingId == null || customerId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Booking ID and Customer ID are required");
        }

        Booking booking = bookingRepository
                .findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Booking not found"));

        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot cancel another customer's booking");
        }

        if (!"CONFIRMED".equals(booking.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This booking is already cancelled or cannot be cancelled");
        }

        booking.setStatus("CANCELLED");

        return bookingRepository.save(booking);
    }
}
