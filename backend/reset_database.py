from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import User, Group, Message, GroupMembership, UserMessageStatus, Entity  # Importiere alle Modelle

# Verbindungsinformationen
DATABASE_URL = "postgresql://user:password@localhost/chatapp"  # Benutzername, Passwort, Host und Datenbankname anpassen

# Engine und Session einrichten
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Session starten
session = SessionLocal()

# Alle Tabellen leeren
def delete_all_entries():
    try:
        # Reihenfolge ist wichtig, um Foreign Key Constraints zu beachten
        session.query(UserMessageStatus).delete()
        session.query(GroupMembership).delete()
        session.query(Message).delete()
        session.query(Group).delete()
        session.query(User).delete()
        session.query(Entity).delete()

        session.commit()
        print("Alle Einträge wurden erfolgreich gelöscht.")
    except Exception as e:
        session.rollback()
        print(f"Ein Fehler ist aufgetreten: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    delete_all_entries()
