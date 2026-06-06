package com.sie.identidad.application.exception;

public class BatchImportException extends RuntimeException {
    public BatchImportException(String message) {
        super(message);
    }

    public BatchImportException(String message, Throwable cause) {
        super(message, cause);
    }
}
