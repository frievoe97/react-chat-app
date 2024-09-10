# Chat Application

<img src="https://github.com/user-attachments/assets/9e4a15b0-7810-4c49-aaf6-2d93bce2a104" width="300"/>
<img src="https://github.com/user-attachments/assets/da63569c-c002-41dc-9fee-97cdd3e2d3c3" width="300"/>
<img src="https://github.com/user-attachments/assets/11425b06-03d0-4ae9-b46c-7d48578138fd" width="300"/>


This is a simple chat application built using FastAPI for the backend, React for the frontend, and PostgreSQL for the database. The application allows users to register, log in, chat with other users, and participate in group chats. The app also indicates when someone is typing. 

There are several features planned for the future, but I wanted to upload this first version before it sits on my hard drive for too long.

## Features
- User registration and login
- 1:1 messaging and group chats
- See when someone is typing
- WebSocket notifications

## Future features
- End-to-end encryption for messages
- Online status and "last seen" visibility
- Read receipts
- Media sharing in chats
- Real-time message sending via WebSocket (currently, only notifications for new API requests are sent)

## Project Structure

The project is split into three main directories:

- **backend**: Contains the FastAPI application.
- **frontend**: Contains the React frontend application.
- **mock**: Contains a Python script to insert mock data into the database.

## Quickstart

### Requirements

- Docker
- Docker Compose

### Installation

1. Clone the repository to your local machine.

2. Navigate to the root directory of the project.

3. Run the following command to start the entire application:

```
docker-compose up
```

This will start the backend, frontend, and PostgreSQL database.

If the database is not already created, it will automatically initialize a new one.

### Resetting the Database

If you want to reset the database, you can use the `reset_database.py` script located in the `backend` directory:

1. Navigate to the backend directory:

```
cd backend
```

2. Run the script using a virtual environment with the required dependencies:

```
python reset_database.py
```

### Inserting Mock Data

To insert mock data into the database, you can use the script located in the `mock` directory. 

1. Navigate to the `mock` directory:

```
cd mock
```

2. Set up a virtual environment and install the dependencies listed in `requirements.txt`:

```
pip install -r requirements.txt
```

3. Run the mock data script:

```
python main.py
```

## Backend API Documentation

The FastAPI backend exposes several routes for user management, messaging, and group management.

### User Routes

- **POST `/users/register`**: Registers a new user. 
  - Request body: 
    - `username`: Username of the new user
    - `full_name`: Full name of the user
    - `password`: User's password
    - `profile_picture`: URL to the user's profile picture (optional)

- **POST `/users/login`**: Logs in a user and returns an access token.
  - Request body:
    - `username`: Username of the user
    - `password`: Password of the user
  
- **DELETE `/users/delete_user/{user_id}`**: Deletes a user, their messages, and their group memberships.
  - Parameters:
    - `user_id`: The ID of the user to delete

- **GET `/users/user_id/{username}`**: Fetches the user ID and public key of a user by their username.
  
- **GET `/users/username/{user_id}`**: Fetches the username of a user by their ID.

- **POST `/users/set_typing_status`**: Updates the typing status of a user.
  - Request body:
    - `is_typing`: Boolean indicating if the user is typing.
    - `typing_chat_id`: ID of the chat where the user is typing.

### Message Routes

- **POST `/messages/send_message`**: Sends a message to another user or group.
  - Request body:
    - `sender_id`: ID of the sender
    - `receiver_id`: ID of the recipient (user or group)
    - `content`: The content of the message
  
- **PUT `/messages/read`**: Marks one or more messages as "read".
  - Request body:
    - `user_id`: ID of the user reading the messages
    - `message_ids`: List of message IDs to mark as read

### Group Routes

- **POST `/groups/create_group`**: Creates a new group.
  - Request body:
    - `name`: Name of the group
  
- **POST `/groups/add_user_to_group`**: Adds a user to a group.
  - Request body:
    - `user_id`: ID of the user to add
    - `group_id`: ID of the group

- **POST `/groups/leave_group`**: Allows a user to leave a group.
  - Request body:
    - `group_id`: ID of the group the user is leaving

### WebSocket Routes

- **WebSocket `/ws`**: This route manages WebSocket connections to handle real-time events, such as:
  - Typing notifications
  - Broadcasting messages to all connected users

The WebSocket accepts JSON data to determine the type of message being sent (e.g., typing status or new message).

## Frontend

The frontend is a React application that interacts with the backend through both WebSocket and normal API requests. The user can register, log in, chat with other users, and participate in group chats.

## Contributions

There are several features planned for the future, so contributions are welcome! Some areas that need attention:

- Encrypting messages
- Implementing online status and read receipts
- Sending messages over WebSocket
- Media sharing functionality

Feel free to fork this repository and submit pull requests.

## Disclaimer

This is an early version of the application. Many features are still missing, and there might be bugs. The purpose of this release is to get a basic version of the app running and uploaded before it gets forgotten on my hard drive.
