"""DTOs de dominio compartidos entre ingestion-service y api-gateway."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class TelemetryEvent(BaseModel):
    """Un reporte de posicion/velocidad enviado por un vehiculo."""

    event_id: str = Field(..., min_length=1, description="Idempotency key del evento")
    vehicle_id: str = Field(..., min_length=1)
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    speed_kmh: float = Field(..., ge=0)
    timestamp: datetime


class CriticalZone(BaseModel):
    """Geofence circular con severidad, usada para detectar vehiculos detenidos en zonas criticas."""

    id: str
    name: str
    severity: str
    center_lat: float
    center_lon: float
    radius_m: float


class VehicleState(BaseModel):
    """Estado actual derivado de un vehiculo, calculado incrementalmente por el consumer."""

    vehicle_id: str
    lat: float
    lon: float
    speed_kmh: float
    updated_at: datetime
    stopped_since: datetime | None = None
    stopped_duration_seconds: int = 0
    current_zone_ids: list[str] = Field(default_factory=list)
