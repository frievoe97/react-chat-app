from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json

router = APIRouter()  # Definiere den Router für WebSocket-Verbindungen

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Erwarte JSON-Daten, um den Nachrichtentyp zu erkennen
            try:
                message_data = json.loads(data)
                message_type = message_data.get("type")

                if message_type == "typing":
                    user_id = message_data["userId"]
                    is_typing = message_data["isTyping"]
                    # Broadcasten des Tippstatus
                    await manager.broadcast(json.dumps({
                        "type": "typing",
                        "userId": user_id,
                        "isTyping": is_typing
                    }))

                elif message_type == "message":
                    sender_id = message_data["senderId"]
                    content = message_data["content"]
                    # Broadcasten der gesendeten Nachricht
                    await manager.broadcast(json.dumps({
                        "type": "message",
                        "senderId": sender_id,
                        "content": content
                    }))

                else:
                    # Undefinierter Nachrichtentyp
                    await manager.broadcast(f"Unknown message type: {message_type}")

            except json.JSONDecodeError:
                await manager.broadcast(f"Invalid message format: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
