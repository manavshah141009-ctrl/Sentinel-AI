"""Pytest configuration for SENTINEL.AI tests."""

import os
import sys

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Set test environment variables
os.environ["DATABASE_URL"] = "sqlite:///./test_sentinel.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/15"  # Use different DB for tests
os.environ["SECRET_KEY"] = "test-secret-key-for-unit-tests-only"
