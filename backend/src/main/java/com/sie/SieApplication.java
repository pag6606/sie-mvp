package com.sie;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SieApplication {

    public static void main(String[] args) {
        SpringApplication.run(SieApplication.class, args);
    }
}
