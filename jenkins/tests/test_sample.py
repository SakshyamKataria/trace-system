"""
Sample test suite for TRACE Jenkins integration.
- 2 tests PASS
- 1 test FAILS intentionally (to generate a failure log for TRACE)
"""


def test_addition():
    """Basic arithmetic check — should PASS."""
    assert 1 + 1 == 2


def test_string_contains():
    """String membership check — should PASS."""
    assert "trace" in "trace-system"


def test_intentional_failure():
    """Intentional failure so TRACE can ingest a failure log."""
    assert 1 == 2, "intentional failure for TRACE testing"
