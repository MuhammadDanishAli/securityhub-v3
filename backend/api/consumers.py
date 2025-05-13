from channels.generic.websocket import AsyncWebsocketConsumer
import json

class SensorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("sensors", self.channel_name)
        await self.accept()
        await self.send(json.dumps({"message": "Connected to sensor updates"}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("sensors", self.channel_name)

    async def sensor_update(self, event):
        message = event["message"]
        await self.send(json.dumps({"sensor_data": message}))