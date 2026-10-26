"""Fixtures compartidas: las pruebas no salen a internet (respuestas reales grabadas en tests/fixtures)."""

from pathlib import Path

FIX = Path(__file__).parent / "fixtures"
