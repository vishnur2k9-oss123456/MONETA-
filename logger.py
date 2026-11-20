"""Utility logger using standard library logging with JSON friendly format."""
import logging
import sys

formatter = logging.Formatter(
    fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

handler = logging.StreamHandler(stream=sys.stdout)
handler.setFormatter(formatter)

logger = logging.getLogger("si_h26184_backend")
logger.setLevel(logging.INFO)
logger.addHandler(handler)
logger.propagate = False
