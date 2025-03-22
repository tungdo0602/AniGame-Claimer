import requests, time, random

tokens = []
try:
    with open("tokens.txt", "r") as f:
        tokens = f.read().strip().split("\n")
        print("Found", len(tokens), "tokens.")
except FileNotFoundError:
    with open("tokens.txt", "w") as f:
        f.write("")

if len(tokens) == 0:
        print("Couldn't find any tokens. Make sure you have entered it in tokens.txt.")
        input("Press enter to exit...")
        exit()
CHANNEL_ID = input("Channel ID: ")

class API():
    def __init__(self, token, channel_id) -> None:
        self.s = requests.Session()
        self.channel_id = str(channel_id)
        self.s.headers = {
            "accept": "*/*",
            "accept-language": "en-US",
            "authorization": token,
            "content-type": "application/json",
            "origin": "https://discord.com",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
        }
    
    def msg(self, content):
        return self.s.post(f"https://discord.com/api/v9/channels/{self.channel_id}/messages", json={
            "content": content,
            "flags": 0,
            "mobile_network_type": "unknown",
            "tts": "false"
        })
        
# Init #
instances = []
for t in tokens:
    instances.append(API(t, CHANNEL_ID))
# --- #

count = 0
while True:
    for c in instances:
        count += 1
        status = c.msg(str(random.randint(1, 100))).status_code
        if status == 200:
            print(f"[{count}] Sent!")
        else:
            print(f"[{count}] Failed! [{status}]")
        if count > 3: count = 0
        time.sleep(1)
