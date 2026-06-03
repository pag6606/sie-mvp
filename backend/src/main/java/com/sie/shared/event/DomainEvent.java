package com.sie.shared.event;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class DomainEvent {
    private UUID eventId;
    private String eventType;
    private UUID aggregateId;
    private String aggregateType;
    private String payload;
    private LocalDateTime occurredAt;
    private UUID colegioId;
}
