package com.sie.lopdp.infrastructure;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LopdpRateLimiter {

    private final double enrollPerSecond;
    private final double consentPerSecond;

    private long lastEnrollCall = 0;
    private long lastConsentCall = 0;

    public LopdpRateLimiter(
            @Value("${lopdp.rate-limit.enrollment-per-minute:100}") double enrollmentRate,
            @Value("${lopdp.rate-limit.consent-per-minute:30}") double consentRate) {
        this.enrollPerSecond = enrollmentRate / 60.0;
        this.consentPerSecond = consentRate / 60.0;
    }

    public void acquireEnrollment() {
        throttle(lastEnrollCall, enrollPerSecond);
        lastEnrollCall = System.nanoTime();
    }

    public void acquireConsent() {
        throttle(lastConsentCall, consentPerSecond);
        lastConsentCall = System.nanoTime();
    }

    private void throttle(long lastCallNanos, double ratePerSecond) {
        if (lastCallNanos == 0) return;
        long minIntervalNanos = (long) (1_000_000_000L / ratePerSecond);
        long elapsed = System.nanoTime() - lastCallNanos;
        long waitNanos = minIntervalNanos - elapsed;
        if (waitNanos > 0) {
            try {
                Thread.sleep(waitNanos / 1_000_000, (int) (waitNanos % 1_000_000));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
