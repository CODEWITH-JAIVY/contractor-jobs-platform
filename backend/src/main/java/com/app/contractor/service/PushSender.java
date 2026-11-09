package com.app.contractor.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.*;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Slf4j
@Component
public class PushSender {
    private final boolean enabled;
    private final String credentialsPath;

    public PushSender(@Value("${app.fcm.enabled}") boolean enabled,
                      @Value("${app.fcm.credentials-path}") String credentialsPath) {
        this.enabled = enabled;
        this.credentialsPath = credentialsPath;
    }

    @PostConstruct
    void init() throws IOException {
        if (!enabled) {
            log.warn("FCM disabled: notifications sirf DB me save honge (app.fcm.enabled=true karo)");
            return;
        }
        if (FirebaseApp.getApps().isEmpty()) {
            try (InputStream in = new FileInputStream(credentialsPath)) {
                FirebaseApp.initializeApp(FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(in)).build());
            }
        }
    }

    /** Max 500 tokens per call. Wapas wo indexes deta hai jinke token ab invalid hain (app uninstall etc). */
    public Set<Integer> send(List<String> tokens, String title, String body, Map<String, String> data) {
        Set<Integer> invalid = new HashSet<>();
        if (tokens.isEmpty()) return invalid;
        if (!enabled) {
            log.info("[FCM disabled] {} devices <- {} | {}", tokens.size(), title, body);
            return invalid;
        }
        try {
            MulticastMessage msg = MulticastMessage.builder()
                    .setNotification(com.google.firebase.messaging.Notification.builder().setTitle(title).setBody(body).build())
                    .putAllData(data)
                    .addAllTokens(tokens)
                    .build();
            List<SendResponse> rs = FirebaseMessaging.getInstance().sendEachForMulticast(msg).getResponses();
            for (int i = 0; i < rs.size(); i++) {
                SendResponse r = rs.get(i);
                if (!r.isSuccessful() && r.getException() != null
                        && r.getException().getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
                    invalid.add(i);
                }
            }
        } catch (FirebaseMessagingException e) {
            log.error("FCM send fail: {}", e.getMessage());
        }
        return invalid;
    }
}
