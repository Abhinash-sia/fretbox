import os

class Settings:
    MIN_HISTORY_DAYS: int = int(os.getenv("MIN_HISTORY_DAYS", "30"))
    DEFAULT_HISTORY_DAYS: int = int(os.getenv("DEFAULT_HISTORY_DAYS", "180"))
    DEFAULT_HORIZON_DAYS: int = int(os.getenv("DEFAULT_HORIZON_DAYS", "7"))
    MAX_HORIZON_DAYS: int = int(os.getenv("MAX_HORIZON_DAYS", "30"))
    RANDOM_STATE: int = int(os.getenv("RANDOM_STATE", "42"))

settings = Settings()
