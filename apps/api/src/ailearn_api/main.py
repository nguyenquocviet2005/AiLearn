from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ailearn_api.config import get_settings
from ailearn_api.routes.diagnostics import router as diagnostics_router
from ailearn_api.routes.health import router as health_router
from ailearn_api.routes.remediation import router as remediation_router
from ailearn_api.routes.students import router as students_router
from ailearn_api.routes.system_status import router as system_status_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="AiLearn API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Accept", "Content-Type"],
    )
    app.include_router(health_router)
    app.include_router(system_status_router)
    app.include_router(diagnostics_router)
    app.include_router(students_router)
    app.include_router(remediation_router)
    return app


app = create_app()
