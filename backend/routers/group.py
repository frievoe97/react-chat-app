from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models import Group, GroupMembership, User, Message, UserMessageStatus
from schemas import GroupCreate
from database import get_db
from auth import get_current_user, oauth2_scheme
from pydantic import BaseModel
from routers.websocket_manager import manager  # Korrekte Importanweisung
from utils import generate_rsa_key_pair

router = APIRouter()

@router.post("/create_group")
async def create_group(group: GroupCreate, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)

    private_key, public_key = generate_rsa_key_pair()


    db_group = Group(
        name=group.name,
        public_key=public_key.decode('utf-8'),
        private_key=private_key.decode('utf-8')
    )

    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    membership = GroupMembership(user_id=current_user.id, group_id=db_group.id)
    db.add(membership)
    db.commit()

    await manager.broadcast(f"New group {group.name} created by {current_user.username}")

    return {"group_id": db_group.id, "name": db_group.name}

class AddUserToGroupRequest(BaseModel):
    user_id: int
    group_id: int

@router.post("/add_user_to_group")
async def add_user_to_group(
    request: AddUserToGroupRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    current_user = get_current_user(token, db)
    print(current_user)
    
    group = db.query(Group).filter(Group.id == request.group_id).first()
    user = db.query(User).filter(User.id == request.user_id).first()
    
    print(group)
    print(user)
    
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    membership = GroupMembership(user_id=request.user_id, group_id=request.group_id)
    db.add(membership)
    db.commit()

    await manager.broadcast(f"User {request.user_id} added to group {request.group_id}")

    return {"message": f"User {request.user_id} added to group {request.group_id}"}


class GroupLeaveRequest(BaseModel):
    group_id: int

@router.post("/leave_group")
async def leave_group(request: GroupLeaveRequest, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    group_id = request.group_id
    current_user = get_current_user(token, db)
    
    membership = db.query(GroupMembership).filter(
        GroupMembership.user_id == current_user.id,
        GroupMembership.group_id == group_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group membership not found")
    
    # Holen der Nachrichten des Benutzers in der Gruppe
    group_messages = db.query(Message).filter(
        Message.sender_id == current_user.id,
        Message.receiver_id == group_id,
        Message.is_group_message == True
    ).all()

    for message in group_messages:
        # Prüfen, wie viele Einträge in UserMessageStatus existieren
        status_entries = db.query(UserMessageStatus).filter(
            UserMessageStatus.message_id == message.id
        ).all()
        
        if len(status_entries) == 1 and status_entries[0].user_id == current_user.id:
            # Es gibt nur einen Eintrag in UserMessageStatus und der gehört dem aktuellen Benutzer
            db.delete(message)
        
        # Löschen des Eintrags in UserMessageStatus für den aktuellen Benutzer
        db.query(UserMessageStatus).filter(
            UserMessageStatus.message_id == message.id,
            UserMessageStatus.user_id == current_user.id
        ).delete()
    
    # Lösche die Gruppenmitgliedschaft
    db.delete(membership)
    db.commit()

    await manager.broadcast(f"User {current_user.username} left group {group_id}")

    return {"message": f"User {current_user.id} left group {group_id}"}
