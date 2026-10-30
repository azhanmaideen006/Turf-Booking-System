package com.turfbooking.turfbooking.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.turfbooking.turfbooking.entity.Turf;
import com.turfbooking.turfbooking.repository.TurfRepository;

@Service
public class TurfService {

    private final TurfRepository turfRepository;

    public TurfService(TurfRepository turfRepository) {
        this.turfRepository = turfRepository;
    }

    public List<Turf> getAllTurfs() {
        return turfRepository.findAll();
    }

    public Optional<Turf> getTurfById(Long id) {
        return turfRepository.findById(id);
    }

    public Turf addTurf(Turf turf) {
        return turfRepository.save(turf);
    }

    public Turf updateTurf(Long id, Turf updatedTurf) {

        Turf turf = turfRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Turf not found with ID: " + id));

        turf.setTurfName(updatedTurf.getTurfName());
        turf.setOwnerName(updatedTurf.getOwnerName());
        turf.setOwnerPhone(updatedTurf.getOwnerPhone());
        turf.setLocation(updatedTurf.getLocation());

        // Multiple sports
        turf.setSportTypes(updatedTurf.getSportTypes());

        turf.setPricePerHour(updatedTurf.getPricePerHour());
        turf.setFacilities(updatedTurf.getFacilities());
        turf.setOpeningTime(updatedTurf.getOpeningTime());
        turf.setClosingTime(updatedTurf.getClosingTime());
        turf.setImageUrl(updatedTurf.getImageUrl());
        turf.setStatus(updatedTurf.getStatus());

        return turfRepository.save(turf);
    }

    public void deleteTurf(Long id) {

        if (!turfRepository.existsById(id)) {
            throw new RuntimeException("Turf not found with ID: " + id);
        }

        turfRepository.deleteById(id);
    }
}