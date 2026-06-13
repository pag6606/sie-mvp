package com.sie.lopdp;

public class LopdpUnavailableException extends RuntimeException {
    public LopdpUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }

    public LopdpUnavailableException(String message) {
        super(message);
    }
}
