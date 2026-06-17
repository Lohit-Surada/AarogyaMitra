package com.aarogyamitra.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            // Check if already initialized
            if (FirebaseApp.getApps().isEmpty()) {
                String keyPath = System.getenv("FIREBASE_CREDENTIALS_PATH");
                if (keyPath == null || keyPath.isEmpty()) {
                    keyPath = "serviceAccountKey.json"; // Fallback to local file
                }
                
                try (FileInputStream serviceAccount = new FileInputStream(keyPath)) {
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .setDatabaseUrl("https://aarogyamitra-76326-default-rtdb.firebaseio.com")
                            .build();

                    FirebaseApp.initializeApp(options);
                    System.out.println("Firebase App initialized successfully.");
                }
            }
        } catch (IOException e) {
            System.err.println("Failed to initialize Firebase App: " + e.getMessage());
            // In production, we might want to throw a runtime exception if this is critical
        }
    }
}
