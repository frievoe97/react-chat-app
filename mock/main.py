import requests

BASE_URL = "http://localhost:8000"

# Helper function to register a user
def register_user(username, full_name, password):
    response = requests.post(f"{BASE_URL}/users/register", json={
        "username": username,
        "full_name": full_name,
        "password": password
    })
    if response.status_code == 200:
        print(f"User {username} registered successfully.")
        return response.json()['access_token']
    else:
        print(f"Failed to register user {username}: {response.json()['detail']}")
        return None

# Helper function to send a message
def send_message(token, receiver_id, content):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/messages/send_message", json={
        "receiver_id": receiver_id,
        "content": content
    }, headers=headers)
    if response.status_code == 200:
        print(f"Message sent: {content}")
    else:
        print(f"Failed to send message: {response.json()['detail']}")

# Helper function to create a group
def create_group(token, group_name):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/groups/create_group", json={
        "name": group_name
    }, headers=headers)
    if response.status_code == 200:
        group_id = response.json()['group_id']
        print(f"Group '{group_name}' created with ID {group_id}.")
        return group_id
    else:
        print(f"Failed to create group: {response.json()['detail']}")
        return None

def add_user_to_group(token, user_id, group_id):
    headers = {"Authorization": f"Bearer {token}"}
    # Die Parameter werden als JSON-Body übergeben
    json_data = {
        "user_id": user_id,
        "group_id": group_id
    }
    
    response = requests.post(f"{BASE_URL}/groups/add_user_to_group", headers=headers, json=json_data)
    
    if response.status_code == 200:
        print(f"User {user_id} added to group {group_id}.")
    else:
        print(f"Failed to add user to group: {response.json().get('detail', 'Unknown error')}")


# Register three users
token_user1 = register_user("alice", "Alice Wonderland", "password123")
token_user2 = register_user("bob", "Bob Builder", "password456")
token_user3 = register_user("charlie", "Charlie Brown", "password789")

# Check if all tokens are successfully retrieved
if token_user1 and token_user2 and token_user3:
    # Get user IDs (assuming user_id is returned upon successful registration)
    user1_id = requests.get(f"{BASE_URL}/users/user_id/alice").json()['user_id']
    user2_id = requests.get(f"{BASE_URL}/users/user_id/bob").json()['user_id']
    user3_id = requests.get(f"{BASE_URL}/users/user_id/charlie").json()['user_id']

    # Long conversation between Alice and Bob
    send_message(token_user1, user2_id, "Hello Bob, how are you doing today?")
    send_message(token_user2, user1_id, "Hi Alice! I'm good, thanks. Just working on some projects. What about you?")
    send_message(token_user1, user2_id, "I'm doing well! Just finished a big task and taking a short break. What project are you working on?")
    send_message(token_user2, user1_id, "It's the new marketing campaign for our latest product. We're trying to come up with some innovative ideas.")
    send_message(token_user1, user2_id, "That sounds exciting! Need any help brainstorming? I love coming up with creative ideas.")
    send_message(token_user2, user1_id, "Actually, that would be great! We're looking for ways to engage younger audiences. Got any thoughts?")
    send_message(token_user1, user2_id, "How about using TikTok challenges? They seem to be very popular these days, especially among the younger crowd.")
    send_message(token_user2, user1_id, "That's a brilliant idea! We could create a fun challenge related to our product and encourage people to participate.")
    send_message(token_user1, user2_id, "Exactly! And we could offer prizes for the best videos. That would definitely get people's attention.")
    send_message(token_user2, user1_id, "I'm definitely going to bring this up in our next meeting. Thanks for the input, Alice! You're always full of great ideas.")
    send_message(token_user1, user2_id, "Anytime, Bob! I'm glad to help. Let me know how it goes.")

    # Long conversation between Bob and Charlie
    send_message(token_user2, user3_id, "Hey Charlie, got a minute? I need to discuss something with you.")
    send_message(token_user3, user2_id, "Sure, Bob! What's up?")
    send_message(token_user2, user3_id, "It's about the project we talked about last week. I'm working on the final part, but I could use some fresh perspective.")
    send_message(token_user3, user2_id, "I remember! The one about the app interface design, right? What specifically are you struggling with?")
    send_message(token_user2, user3_id, "Exactly! I'm trying to make the interface more intuitive, but I'm stuck on the navigation flow. It feels clunky.")
    send_message(token_user3, user2_id, "Hmm, maybe we should simplify the layout. How about reducing the number of menu options on the main screen?")
    send_message(token_user2, user3_id, "That's a good point. We could hide some options under a settings menu or use icons instead of text to make it cleaner.")
    send_message(token_user3, user2_id, "Right! And we could use a swipe gesture for quick navigation between different sections. That would be user-friendly.")
    send_message(token_user2, user3_id, "I like that idea! It would make the app feel more modern and responsive. Thanks, Charlie! You always know how to make things better.")
    send_message(token_user3, user2_id, "No problem, Bob! I'm glad I could help. Let's work on these changes together. It'll be fun.")
    send_message(token_user2, user3_id, "Absolutely! I'll set up a meeting for us to go over the details. Thanks again, Charlie.")

    # Long conversation between Charlie and Alice
    send_message(token_user3, user1_id, "Hey Alice! Got some time to chat?")
    send_message(token_user1, user3_id, "Of course, Charlie! What's on your mind?")
    send_message(token_user3, user1_id, "I was thinking about the book club idea we talked about earlier. Do you have any book suggestions?")
    send_message(token_user1, user3_id, "Oh, yes! I've been reading this great mystery novel lately. It's called 'The Silent Patient.' Have you heard of it?")
    send_message(token_user3, user1_id, "Yes, I've heard about it! It's on my reading list. Do you think it would be a good pick for the club?")
    send_message(token_user1, user3_id, "Definitely! It's got suspense, twists, and a really gripping storyline. Plus, it's not too long, so we can discuss it soon.")
    send_message(token_user3, user1_id, "Sounds perfect! I love books that keep me on the edge of my seat. Let's start with that one.")
    send_message(token_user1, user3_id, "Great! I'll let everyone know. We can set a date for our first discussion. Maybe next week?")
    send_message(token_user3, user1_id, "Next week works for me! I'll make sure to finish the book by then. Can't wait to discuss it with you and Bob.")
    send_message(token_user1, user3_id, "Me too, Charlie! It's going to be so much fun. I love discussing books with friends.")
    send_message(token_user3, user1_id, "Same here! And who knows, we might even find our next favorite author. This book club is going to be awesome.")


    # Create a group
    group_id = create_group(token_user1, "Fun Group")

    if group_id:
        # Add users to the group
        add_user_to_group(token_user2, user2_id, group_id)
        add_user_to_group(token_user3, user3_id, group_id)

        # Group chatting
        send_message(token_user1, group_id, "Welcome to the Fun Group! This will be our space to chill and share ideas.")
        send_message(token_user2, group_id, "Thanks, Alice! This is awesome. We can use this space for our project discussions as well.")
        send_message(token_user3, group_id, "Absolutely! And also share some fun stuff. Speaking of which, did you guys see that new movie trailer?")
        send_message(token_user1, group_id, "Yes, it looks amazing! Can't wait for it to be released.")
        send_message(token_user2, group_id, "Count me in for the first show! By the way, Charlie, do you still have those notes from last week's meeting?")
        send_message(token_user3, group_id, "Sure, I'll upload them here. This group is going to be so useful.")
        send_message(token_user1, group_id, "Great! Let's also share some fun memes to keep things light-hearted.")
        send_message(token_user2, group_id, "Absolutely! This is going to be a fun and productive space.")

        # Further conversations
        send_message(token_user3, group_id, "Hey, what do you all think about starting a book club?")
        send_message(token_user1, group_id, "That sounds like a great idea! I'm in.")
        send_message(token_user2, group_id, "Count me in too! Let's choose a book and set a schedule.")
        send_message(token_user3, group_id, "Awesome! I'll suggest a few books and we can vote on one.")
        send_message(token_user1, group_id, "Perfect! This group is already turning into a hub of activity. Can't wait to see what else we do here!")
        send_message(token_user2, group_id, "Me too! Looking forward to our meetings and discussions.")

        # Extended group conversations
        send_message(token_user1, group_id, "By the way, has anyone tried the new cafe downtown? I've heard great things.")
        send_message(token_user3, group_id, "Yes! I was there last weekend. The coffee is amazing, and the ambiance is perfect for reading.")
        send_message(token_user2, group_id, "Sounds like a perfect spot for our book club meetings. Let's check it out!")
        send_message(token_user1, group_id, "Agreed! Maybe we can go there after our project meeting tomorrow.")
        send_message(token_user3, group_id, "Sure! I'll bring some sample chapters from the books I have in mind.")
        send_message(token_user2, group_id, "Great idea! This is going to be fun.")

        # Casual conversations
        send_message(token_user1, group_id, "I just saw the funniest meme about remote work. I'll share it here.")
        send_message(token_user2, group_id, "Haha, this is hilarious! It totally resonates with me.")
        send_message(token_user3, group_id, "Same here! Working from home has its own set of challenges.")
        send_message(token_user1, group_id, "True! But I wouldn't trade it for anything else. I love the flexibility.")
        send_message(token_user2, group_id, "Agreed! Plus, no commuting means more time for hobbies.")
        send_message(token_user3, group_id, "Speaking of hobbies, I'm thinking about picking up guitar lessons. Anyone interested?")
        send_message(token_user1, group_id, "I would love to learn guitar! Count me in.")
        send_message(token_user2, group_id, "Me too! Maybe we can find a tutor together.")
        send_message(token_user3, group_id, "Awesome! I'll do some research and let you guys know.")

        # Plans for the weekend
        send_message(token_user1, group_id, "So, what's everyone doing this weekend?")
        send_message(token_user2, group_id, "I was thinking about hiking. There's a new trail that just opened up.")
        send_message(token_user3, group_id, "Hiking sounds great! Can I join?")
        send_message(token_user1, group_id, "Count me in too! I could use some fresh air and exercise.")
        send_message(token_user2, group_id, "Perfect! Let's meet at the trailhead at 9 AM on Saturday.")
        send_message(token_user3, group_id, "See you all there! Can't wait for some adventure.")
        send_message(token_user1, group_id, "Me too! This is going to be a great weekend.")

        # Follow-up on the project
        send_message(token_user3, user2_id, "Bob, about the project... I've made some notes on the final part. Want me to send them over?")
        send_message(token_user2, user3_id, "Yes, please! That would be a big help. Also, could you check the timeline? I think we might need to adjust it.")
        send_message(token_user3, user2_id, "Sure, I'll review it and get back to you. Let's aim to finish by next week.")
        send_message(token_user2, user3_id, "Sounds good. With your help, I'm sure we'll meet the deadline.")

        # Weekend activities and more
        send_message(token_user1, group_id, "Anyone up for a movie night this weekend?")
        send_message(token_user3, group_id, "I'm in! There's a new thriller I've been wanting to watch.")
        send_message(token_user2, group_id, "Count me in too! I love thrillers. Let's do it!")
        send_message(token_user1, group_id, "Great! How about Saturday evening after the hike?")
        send_message(token_user3, group_id, "Perfect timing. We can grab some food and then enjoy the movie.")
        send_message(token_user2, group_id, "I'm looking forward to it. This weekend is going to be packed with fun!")
        send_message(token_user1, group_id, "Absolutely! Can't wait to hang out with you all.")
        send_message(token_user3, group_id, "Same here. It's great to have friends who enjoy the same activities.")
        send_message(token_user2, group_id, "Couldn't agree more. This group is the best!")



else:
    print("User registration failed. Cannot proceed with chats and groups.")
