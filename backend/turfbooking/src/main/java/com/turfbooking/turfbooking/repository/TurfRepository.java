
package com.turfbooking.turfbooking.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.turfbooking.turfbooking.entity.Turf;

import jakarta.persistence.LockModeType;

public interface TurfRepository extends JpaRepository<Turf, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Turf t WHERE t.id = :id")
    Optional<Turf> findByIdForUpdate(@Param("id") Long id);
}
