package com.aarogyamitra.backend.service;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import org.springframework.stereotype.Service;

@Service
public class FirebaseBroadcastService {

    public void broadcastStockUpdate(Long productId, Integer newStock) {
        try {
            DatabaseReference ref = FirebaseDatabase.getInstance().getReference("realtime/products/" + productId + "/stock");
            ref.setValueAsync(newStock);
        } catch (Exception e) {
            System.err.println("Failed to broadcast stock update: " + e.getMessage());
        }
    }

    public void broadcastOrderStatusUpdate(String userEmail, Long orderId, String newStatus) {
        try {
            String sanitizedEmail = userEmail.replace(".", "_");
            DatabaseReference ref = FirebaseDatabase.getInstance().getReference("realtime/orders/" + sanitizedEmail + "/" + orderId + "/status");
            ref.setValueAsync(newStatus);
        } catch (Exception e) {
            System.err.println("Failed to broadcast order status: " + e.getMessage());
        }
    }
}
