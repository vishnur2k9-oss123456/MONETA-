"""WebSocket based real‑time alert broadcaster.
Clients connect to ``/alerts/ws`` and receive JSON messages when the server pushes alerts.
"""

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from typing import List

from app import security, services
from app.models import User
from app.database import get_db

router = APIRouter()

# In‑memory connection manager (simple, not persisted)
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@router.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket, token: str = Depends(security.oauth2_scheme)):
    # Simple token validation – ensure the user exists
    user = await security.get_current_user(token)
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; no inbound messages expected
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Helper that other services can call to push an alert
async def push_alert(alert_type: str, payload: dict):
    await manager.broadcast({'type': alert_type, 'payload': payload})
