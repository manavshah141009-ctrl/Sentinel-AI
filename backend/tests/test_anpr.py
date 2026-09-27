from backend.modules.watchlist import normalize_plate
from backend.ai.anpr.plate_finder import correct_indian_plate_syntax


def test_normalize():
    assert normalize_plate("gj-01 ab 1234") == "GJ01AB1234"
    assert normalize_plate("") == ""


def test_valid_plate():
    assert correct_indian_plate_syntax("GJ01AB1234") == "GJ01AB1234"
    assert correct_indian_plate_syntax("ABC") is None


def test_watchlist_normalize():
    from backend.modules.watchlist import normalize_plate as wl_norm
    assert wl_norm("GJ 01-AB-1234") == "GJ01AB1234"
