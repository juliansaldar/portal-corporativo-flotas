"""Datos semilla de zonas criticas de ejemplo (Bogota) para el MVP."""

from __future__ import annotations

from shared.models import CriticalZone

SEED_CRITICAL_ZONES: list[CriticalZone] = [
    CriticalZone(
        id="zona-franca-norte",
        name="Zona Franca Norte",
        severity="high",
        center_lat=4.7110,
        center_lon=-74.0721,
        radius_m=600,
    ),
    CriticalZone(
        id="terminal-carga-sur",
        name="Terminal de Carga Sur",
        severity="critical",
        center_lat=4.5981,
        center_lon=-74.1469,
        radius_m=500,
    ),
    CriticalZone(
        id="centro-ciudad",
        name="Centro Ciudad",
        severity="medium",
        center_lat=4.6097,
        center_lon=-74.0817,
        radius_m=800,
    ),
]
