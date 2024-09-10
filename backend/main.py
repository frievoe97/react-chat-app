from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import user, message, group, websocket_manager
from database import engine, Base  # Füge das hinzu

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Datenbank-Tabellen erstellen
Base.metadata.create_all(bind=engine)

# Router einbinden
app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(message.router, prefix="/messages", tags=["messages"])
app.include_router(group.router, prefix="/groups", tags=["groups"])
app.include_router(websocket_manager.router, tags=["websockets"])
