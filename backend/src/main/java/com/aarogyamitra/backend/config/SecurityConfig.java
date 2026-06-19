package com.aarogyamitra.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.client.RestTemplate;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.aarogyamitra.backend.security.FirebaseTokenFilter;

@Configuration
public class SecurityConfig {

	private final FirebaseTokenFilter firebaseTokenFilter;

	public SecurityConfig(FirebaseTokenFilter firebaseTokenFilter) {
		this.firebaseTokenFilter = firebaseTokenFilter;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.csrf(AbstractHttpConfigurer::disable)
			.cors(Customizer.withDefaults())
			.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.headers(headers -> headers
				.frameOptions(fo -> fo.sameOrigin()) // Allow H2 console in frames
			)
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
				// Public: Health, chatbot, ML, payment, H2 console
				.requestMatchers("/api/health", "/api/chatbot/**", "/api/predict-disease", "/api/symptoms", "/api/payment/**", "/h2-console/**").permitAll()
				// Public: Product browsing (read-only) - no login needed
				.requestMatchers(HttpMethod.GET, "/api/pharmacy/products", "/api/pharmacy/products/**", "/api/pharmacy/add-test-product").permitAll()
				// All cart, orders, addresses require auth
				.anyRequest().authenticated()
			)
			.addFilterBefore(firebaseTokenFilter, UsernamePasswordAuthenticationFilter.class)
			.httpBasic(AbstractHttpConfigurer::disable);

		return http.build();
	}

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}
}
