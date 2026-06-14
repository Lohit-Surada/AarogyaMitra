package com.aarogyamitra.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.client.RestTemplate;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.csrf(AbstractHttpConfigurer::disable)
			.cors(Customizer.withDefaults())
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/chatbot").permitAll()
				.requestMatchers("/api/health", "/api/predict-disease", "/api/symptoms", "/api/pharmacy/**", "/api/payment/**").permitAll()
				.anyRequest().authenticated()
			)
			.httpBasic(Customizer.withDefaults());

		return http.build();
	}

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}
}
