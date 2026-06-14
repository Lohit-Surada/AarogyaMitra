package com.aarogyamitra.backend.repository;

import com.aarogyamitra.backend.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserEmail(String userEmail);
    Optional<CartItem> findByUserEmailAndProductId(String userEmail, Long productId);
    void deleteByUserEmail(String userEmail);
}
