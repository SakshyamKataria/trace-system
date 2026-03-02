import redis
import json

# Create connection to Redis server
redis_client = redis.Redis(host="redis", port=6379, db=0)

QUEUE_NAME = "build_logs"

def enqueue_log(data: dict):
    # Convert dictionary to JSON string
    message = json.dumps(data)
    
    # Push message to Redis list (acts as queue)
    redis_client.rpush(QUEUE_NAME, message)