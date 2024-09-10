from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy import or_
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models import Base, User, Message, Group, GroupMembership

from models import Base, User
from sqlalchemy.exc import IntegrityError

# Beispielhafte Datenbank URL und Secret Key für JWT
DATABASE_URL = "postgresql://user:password@db:5432/chatapp"
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"

# Initialisieren der FastAPI App
app = FastAPI()

# CORS-Konfiguration
origins = [
    "http://localhost:3000",  # Erlaubt Anfragen von diesem Origin
    "http://localhost",        # Erlaubt Anfragen von diesem Origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Setzt die erlaubten Origins
    allow_credentials=True,
    allow_methods=["*"],  # Erlaubt alle HTTP-Methoden (GET, POST, etc.)
    allow_headers=["*"],  # Erlaubt alle Header
)

# Datenbank Setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2PasswordBearer Instanz
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Pydantic Modelle
class UserRegister(BaseModel):
    username: str
    full_name: str
    password: str
    profile_picture: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    user_id: int
    token_type: str = "bearer"

# Hilfsfunktionen
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise JWTError()
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# Routen

# 1. User Registration
@app.post("/register", response_model=TokenResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, full_name=user.full_name, hashed_password=hashed_password, profile_picture=user.profile_picture)
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "user_id": db_user.id}

# 2. User Login
@app.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "user_id": db_user.id}

# 3. Delete User
@app.delete("/delete_user/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user = get_current_user(token, db)
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not allowed")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Lösche alle GroupMembership-Einträge des Benutzers
    db.query(GroupMembership).filter(GroupMembership.user_id == user_id).delete()

    # Lösche alle Nachrichten des Benutzers
    db.query(Message).filter((Message.sender_id == user_id) | (Message.receiver_id == user_id)).delete()
    
    # Lösche den Benutzer
    db.delete(user)
    db.commit()
    
    return {"message": "User, their group memberships, and their messages deleted successfully"}



@app.get("/messages")
def get_user_messages(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Alle Nachrichten finden, bei denen der Benutzer Absender oder Empfänger ist
    messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    ).all()
    
    # Nachrichten in ein einfacheres Format umwandeln
    messages_list = [
        {
            "message_id": message.id,
            "sender_id": message.sender_id,
            "receiver_id": message.receiver_id,
            "content": message.content,
            "status": message.status,
            "timestamp": message.timestamp
        } for message in messages
    ]

    return {"messages": messages_list}

@app.get("/chats")
def get_user_chats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Alle Nachrichten finden, bei denen der Benutzer Absender oder Empfänger ist
    messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    ).order_by(Message.timestamp).all()  # Sortiere die Nachrichten nach timestamp

    # Nachrichten nach receiver_id gruppieren, inklusive Nachrichten von und an den Benutzer
    chats = {}
    for message in messages:
        # Verwende die ID des Konversationspartners (kann der Sender oder Empfänger sein)
        partner_id = message.receiver_id if message.sender_id == current_user.id else message.sender_id
        
        if partner_id not in chats:
            chats[partner_id] = []

        chats[partner_id].append({
            "message_id": message.id,
            "sender_id": message.sender_id,
            "receiver_id": message.receiver_id,
            "content": message.content,
            "status": message.status,
            "timestamp": message.timestamp
        })

    return {"chats": chats}




class GroupCreate(BaseModel):
    name: str



# Create a group
@app.post("/create_group")
def create_group(group: GroupCreate, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    db_group = Group(name=group.name)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Automatically add the creator to the group
    membership = GroupMembership(user_id=current_user.id, group_id=db_group.id)
    db.add(membership)
    db.commit()

    return {"group_id": db_group.id, "name": db_group.name}


# Add a user to a group
@app.post("/add_user_to_group")
def add_user_to_group(user_id: int, group_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    
    group = db.query(Group).filter(Group.id == group_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Add user to the group
    membership = GroupMembership(user_id=user_id, group_id=group_id)
    db.add(membership)
    db.commit()
    return {"message": f"User {user_id} added to group {group_id}"}

# Leave a group and delete user's messages in the group
@app.post("/leave_group")
def leave_group(group_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    
    membership = db.query(GroupMembership).filter(
        GroupMembership.user_id == current_user.id,
        GroupMembership.group_id == group_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group membership not found")
    
    # Delete user's messages in the group
    db.query(Message).filter(
        Message.sender_id == current_user.id,
        Message.receiver_id == group_id,
        Message.is_group_message == True
    ).delete()
    
    db.delete(membership)
    db.commit()
    return {"message": f"User {current_user.id} left group {group_id}"}

class MessageCreate(BaseModel):
    receiver_id: int
    content: str

@app.post("/send_message")
async def send_message(message: MessageCreate, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)

    # Check if receiver_id belongs to a group
    group = db.query(Group).filter(Group.id == message.receiver_id).first()
    if group:
        # It's a group message
        db_message = Message(
            sender_id=current_user.id,
            receiver_id=group.id,
            content=message.content,
            status="sent",
            is_group_message=True
        )
    else:
        # Check if receiver_id belongs to a user
        recipient = db.query(User).filter(User.id == message.receiver_id).first()
        if not recipient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found")
        
        # It's a private message
        db_message = Message(
            sender_id=current_user.id,
            receiver_id=recipient.id,
            content=message.content,
            status="sent",
            is_group_message=False
        )

    db.add(db_message)
    db.commit()

    # Broadcast the message to all connected WebSocket clients
    await manager.broadcast(f"New message from {current_user.username}: {message.content}")

    return {"message": "Message sent"}


@app.get("/user_id")
def get_user_id(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"user_id": user.id}

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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Hier könntest du zusätzliche Logik hinzufügen, z.B. Nachricht an alle anderen senden
            await manager.broadcast(f"Message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)