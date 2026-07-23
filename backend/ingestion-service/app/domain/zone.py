"""Geofences circulares: pertenencia por distancia haversine."""

from __future__ import annotations

import math

from shared.models import CriticalZone

_EARTH_RADIUS_M = 6_371_000.0


def zone_contains(zone: CriticalZone, lat: float, lon: float) -> bool:
    return _haversine_m(zone.center_lat, zone.center_lon, lat, lon) <= zone.radius_m


def matching_zone_ids(zones: list[CriticalZone], lat: float, lon: float) -> list[str]:
    return [zone.id for zone in zones if zone_contains(zone, lat, lon)]


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * _EARTH_RADIUS_M * math.asin(math.sqrt(a))
