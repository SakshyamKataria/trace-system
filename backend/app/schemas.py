from pydantic import BaseModel
from datetime import datetime


class LogIngestRequest(BaseModel):
    build_id: str
    project: str
    branch: str
    commit_id: str
    status: str
    timestamp: datetime
    log: str

    @field_validator("status")
    @classmethod
    def normalize_status(cls, v):
        return v.lower()

class BuildResponse(BaseModel):
    build_id: str
    project: str
    branch: str
    commit_id: str
    status: str
    timestamp: datetime
    log_path: str

    class Config:
        from_attributes = True