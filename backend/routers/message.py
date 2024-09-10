from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models import Message, User, Group, GroupMembership, UserMessageStatus
from schemas import MessageCreate
from database import get_db
from auth import get_current_user, oauth2_scheme
from sqlalchemy import or_
from typing import List
from pydantic import BaseModel
# Andere Importe
from routers.websocket_manager import manager  # Korrekte Importanweisung
import json

router = APIRouter()

@router.post("/send_message")
async def send_message(message: MessageCreate, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)

    group = db.query(Group).filter(Group.id == message.receiver_id).first()
    if group:
        # It's a group message
        db_message = Message(
            sender_id=current_user.id,
            receiver_id=group.id,
            content=message.content,
            is_group_message=True
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)  # Refresh to get the generated message id

        # Fetch all members of the group
        group_members = db.query(GroupMembership).filter(GroupMembership.group_id == group.id).all()

        for member in group_members:
            status = "read" if member.user_id == current_user.id else "sent"
            user_message_status = UserMessageStatus(
                message_id=db_message.id,
                user_id=member.user_id,
                status=status
            )
            db.add(user_message_status)

    else:
        # It's a private message
        recipient = db.query(User).filter(User.id == message.receiver_id).first()
        if not recipient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found")
        
        db_message = Message(
            sender_id=current_user.id,
            receiver_id=recipient.id,
            content=message.content,
            is_group_message=False,
            encrypted_for_user_id=message.encrypted_for_user_id
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)  # Refresh to get the generated message id

        # Add UserMessageStatus entries for sender and recipient
        sender_status = UserMessageStatus(
            message_id=db_message.id,
            user_id=current_user.id,
            status="read"
        )
        recipient_status = UserMessageStatus(
            message_id=db_message.id,
            user_id=recipient.id,
            status="sent"
        )
        db.add(sender_status)
        db.add(recipient_status)

    db.commit()  # Commit all changes

    # JSON-Nachricht für den Broadcast
    notification_message = {
        "type": "message",
    }
    await manager.broadcast(json.dumps(notification_message))

    return {"message": "Message sent"}

class ReadMessagesRequest(BaseModel):
    user_id: int
    message_ids: List[int]

@router.put("/read")
async def mark_messages_as_read(
    request: ReadMessagesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Überprüfen, ob der aktuelle Benutzer der Eigentümer der Nachricht ist
    if current_user.id != request.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not allowed")

    # Status für die angegebenen Nachricht-IDs auf "read" setzen
    db.query(UserMessageStatus).filter(
        UserMessageStatus.user_id == request.user_id,
        UserMessageStatus.message_id.in_(request.message_ids)
    ).update({"status": "read"}, synchronize_session=False)

    db.commit()

    await manager.broadcast(f"Messages {request.message_ids} marked as 'read'")

    return {"message": f"Status for messages {request.message_ids} set to 'read'"}

# @router.get("/chats")
# def get_user_chats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
#     messages = db.query(Message).filter(
#         or_(
#             Message.sender_id == current_user.id,
#             Message.receiver_id == current_user.id
#         )
#     ).order_by(Message.timestamp).all()

#     chats = {}
#     for message in messages:
#         partner_id = message.receiver_id if message.sender_id == current_user.id else message.sender_id
#         if partner_id not in chats:
#             chats[partner_id] = []

#         chats[partner_id].append({
#             "message_id": message.id,
#             "sender_id": message.sender_id,
#             "receiver_id": message.receiver_id,
#             "content": message.content,
#             "status": message.status,
#             "timestamp": message.timestamp
#         })

#     return {"chats": chats}
