import logging
logging.basicConfig(level=logging.INFO)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from models import User, GroupMembership, Message, Group, UserMessageStatus
from schemas import UserRegister, UserLogin, TokenResponse
from database import get_db
from auth import get_password_hash, create_access_token, verify_password, get_current_user, oauth2_scheme
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from utils import generate_rsa_key_pair

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    hashed_password = get_password_hash(user.password)
    
    # Generiere Schlüsselpaar
    private_key, public_key = generate_rsa_key_pair()
    
    db_user = User(
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        profile_picture=user.profile_picture,
        public_key=public_key.decode('utf-8'),
        private_key=private_key.decode('utf-8')
    )
    
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "user_id": db_user.id}

@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    
    # Hier solltest du Sicherheitsmaßnahmen treffen, wenn du die Schlüssel zurückgibst
    access_token = create_access_token(data={"sub": db_user.username})
    
    # Achtung: In einer echten Anwendung solltest du den privaten Schlüssel nicht zurückgeben!
    return {
        "access_token": access_token,
        "user_id": db_user.id,
        "public_key": db_user.public_key,
        "private_key": db_user.private_key  # Nur wenn wirklich nötig, ansonsten entfernen
    }


@router.delete("/delete_user/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user = get_current_user(token, db)
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not allowed")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    db.query(GroupMembership).filter(GroupMembership.user_id == user_id).delete()
    db.query(Message).filter((Message.sender_id == user_id) | (Message.receiver_id == user_id)).delete()
    
    db.delete(user)
    db.commit()
    
    return {"message": "User, their group memberships, and their messages deleted successfully"}


@router.get("/user_id/{username}")
def get_user_id(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"user_id": user.id, "public_key": user.public_key}

# Route für die Umwandlung von User ID zu Username
@router.get("/username/{user_id}")
def get_username(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"username": user.username}

@router.get("/{user_id}/all_data")
def get_all_user_data(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not allowed")

    # Abrufen aller Gruppenmitgliedschaften des Benutzers
    memberships = db.query(GroupMembership).all()
    
    # Liste der Gruppen-IDs, in denen der Benutzer Mitglied ist
    group_ids = [membership.group_id for membership in memberships]
    
    # Abrufen aller Nachrichten, in denen der Benutzer beteiligt ist oder die an Gruppen gesendet wurden, in denen der Benutzer Mitglied ist
    messages = db.query(Message).filter(
        or_(
            # Fall 1: Gruppen-Nachrichten
            and_(
                Message.is_group_message == True,
                Message.receiver_id.in_(group_ids)  # Der Benutzer ist Mitglied der Gruppe
            ),
            
            # Fall 2: Einzel-Nachrichten
            and_(
                Message.is_group_message == False,
                # Entweder ist der Benutzer der Sender oder der Empfänger
                or_(
                    Message.sender_id == user_id,
                    Message.receiver_id == user_id
                ),
                # encrypted_for_user_id MUSS gleich user_id sein
                # Message.encrypted_for_user_id == user_id
            )
        )
    ).all()
    
    # Abrufen aller Gruppen, in denen der Benutzer ist
    groups = db.query(Group).filter(Group.id.in_(group_ids)).all()

    # Abrufen aller Nutzer, mit denen Nachrichten ausgetauscht wurden
    user_ids = set(
        [message.sender_id for message in messages] +
        [message.receiver_id for message in messages]
    )
    user_ids.discard(user_id)  # Entferne die eigene ID
    # TODO: Es sollen NICHT alle Users gezogen
    interacting_users = db.query(User).all()

    # Abrufen des Status für jede Nachricht aus der UserMessageStatus-Tabelle
    message_status_map = {
        status.message_id: status.status
        for status in db.query(UserMessageStatus).filter(UserMessageStatus.user_id == user_id).all()
    }

    return {
        "messages": [
            {
                "id": msg.id,
                "sender_id": msg.sender_id,
                "receiver_id": msg.receiver_id,
                "content": msg.content,
                "timestamp": msg.timestamp,
                "status": message_status_map.get(msg.id, "unknown")  # Füge den Status hinzu, falls vorhanden
            }
            for msg in messages
        ],
        "memberships": [
            {
                "group_id": membership.group_id,
                "user_id": membership.user_id,
                "joined_at": membership.joined_at
            }
            for membership in memberships
        ],
        "groups": [
            {
                "id": group.id,
                "name": group.name,
                "privateKey": group.private_key,
                "publicKey": group.public_key
            }
            for group in groups
        ],
        "interacting_users": [
            {
                "id": user.id,
                "isTyping": user.is_typing,
                "typingChatId": user.typing_chat_id,
                "username": user.username,
                "fullname": user.full_name,
                "publicKey": user.public_key
            }
            for user in interacting_users
        ]
    }

# Pydantic Modell anpassen
class TypingStatus(BaseModel):
    is_typing: bool
    typing_chat_id: int  # Neues Feld hinzugefügt

@router.post("/set_typing_status")
def set_typing_status(typing_status: TypingStatus, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_typing = typing_status.is_typing
    user.typing_chat_id = typing_status.typing_chat_id  # Setze den typing_chat_id

    db.commit()

    return {
        "message": f"Typing status set to {typing_status.is_typing} for user {current_user.username}",
        "typing_chat_id": typing_status.typing_chat_id
    }