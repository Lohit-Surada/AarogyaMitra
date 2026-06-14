package com.aarogyamitra.backend.repository;

import com.aarogyamitra.backend.model.SavedAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedAddressRepository extends JpaRepository<SavedAddress, Long> {
    List<SavedAddress> findByUserEmail(String userEmail);
}
