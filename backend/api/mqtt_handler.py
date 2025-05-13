import paho.mqtt.client as mqtt
import json
from django.db import transaction
from datetime import datetime
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
import time
import threading
import ssl

# Explicitly import api for models
import api

# Type hints for models
Sensor = 'api.models.Sensor'
SensorData = 'api.models.SensorData'

# Global channel_layer and client, initialized lazily
channel_layer = None
client = None

# Track sensor last seen times
sensor_last_seen = {}
HEARTBEAT_TIMEOUT = 60

class MQTTClientSingleton:
    _instance = None
    _lock = threading.Lock()

    @classmethod
    def get_instance(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls._create_client()
        return cls._instance

    @classmethod
    def _create_client(cls):
        # Generate a unique client ID by appending a timestamp
        base_client_id = settings.MQTT_CONFIG.get('CLIENT_ID', 'django_server')
        unique_client_id = f"{base_client_id}_{int(time.time())}"
        
        client = mqtt.Client(client_id=unique_client_id, clean_session=settings.MQTT_CONFIG.get('CLEAN_SESSION', True))
        client.on_connect = on_connect
        client.on_message = on_message
        client.on_disconnect = on_disconnect
        client.on_log = on_log  # Add logging for debugging
        
        # Set username and password from settings
        if settings.MQTT_CONFIG.get('USERNAME') and settings.MQTT_CONFIG.get('PASSWORD'):
            client.username_pw_set(settings.MQTT_CONFIG['USERNAME'], settings.MQTT_CONFIG['PASSWORD'])
        
        # Enable TLS if configured
        if settings.MQTT_CONFIG.get('USE_TLS', False):
            client.tls_set(ca_certs=None, certfile=None, keyfile=None, cert_reqs=ssl.CERT_NONE, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)
            client.tls_insecure_set(True)  # For testing; set to False in production
        
        client.connected = False
        client.keepalive = settings.MQTT_CONFIG.get('KEEPALIVE', 60)
        client.reconnect_thread = None
        client.should_reconnect = True
        client.max_reconnect_attempts = 10
        client.reconnect_attempts = 0
        return client

    @classmethod
    def publish(cls, topic, payload):
        client = cls.get_instance()
        if not client.connected:
            start_mqtt()
        if not client._thread:
            client.loop_start()
        if isinstance(payload, str):
            result = client.publish(topic, payload, qos=1)  # Use QoS 1 for reliability
        else:
            result = client.publish(topic, str(payload), qos=1)
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"Published message to {topic}")
        else:
            print(f"Failed to publish message to {topic}, return code {result.rc}")
        return result

def on_connect(client, userdata, flags, rc):
    global channel_layer
    if rc == 0:
        print("✅ Connected to MQTT broker")
        client.subscribe("security/sensors/#")
        client.subscribe("security/mode")
        client.subscribe("securityhub/devices/#")
        client.subscribe("securityhub/data")
        client.connected = True
        client.should_reconnect = False
        client.reconnect_attempts = 0
        if channel_layer is None:
            channel_layer = get_channel_layer()
        if client.reconnect_thread and client.reconnect_thread.is_alive():
            client.reconnect_thread.join()
    else:
        print(f"⚠ Connection failed with code {rc}")
        client.connected = False

def on_disconnect(client, userdata, rc):
    print(f"Disconnected from MQTT Broker with code {rc}")
    client.connected = False
    if rc != 0:  # Unexpected disconnect
        client.should_reconnect = True
        if not client.reconnect_thread or not client.reconnect_thread.is_alive():
            client.reconnect_thread = threading.Thread(target=_reconnect_loop, daemon=True)
            client.reconnect_thread.start()

def on_log(client, userdata, level, buf):
    print(f"MQTT Log: {buf}")

def _reconnect_loop():
    global client
    while client.should_reconnect and not client.connected and client.reconnect_attempts < client.max_reconnect_attempts:
        client.reconnect_attempts += 1
        try:
            print(f"Attempting to reconnect to MQTT Broker (Attempt {client.reconnect_attempts}/{client.max_reconnect_attempts})...")
            client.reconnect()
            time.sleep(5)  # Wait before checking connection
            if client.connected:
                break
        except Exception as e:
            print(f"Reconnection failed: {e}")
            time.sleep(5)  # Wait before retrying
    if not client.connected:
        print(f"❌ Failed to reconnect after {client.max_reconnect_attempts} attempts. Stopping reconnection.")

def on_message(client, userdata, message):
    global channel_layer
    if channel_layer is None:
        channel_layer = get_channel_layer()
    
    try:
        payload = json.loads(message.payload.decode())
        topic = message.topic

        if topic.startswith("security/sensors/"):
            # Handle sensor data
            sensor_id = payload.get('node_id', 'unknown')
            location = payload.get('location', 'unknown')
            sensor_type = payload.get('sensor_type', 'unknown')
            data_type = payload.get('data_type', 'unknown')
            value = payload.get('value', 0)
            unit = payload.get('unit', '')

            # Use lazy-loaded models
            Sensor = get_sensor_model()
            SensorData = get_sensor_data_model()

            # Store data in database
            sensor, created = Sensor.objects.get_or_create(
                node_id=sensor_id,
                defaults={'location': location, 'sensor_type': sensor_type}
            )
            SensorData.objects.create(
                sensor=sensor,
                data_type=data_type,
                value=value,
                unit=unit
            )

            # Send WebSocket alert
            async_to_sync(channel_layer.group_send)(
                "sensors",
                {
                    "type": "sensor_update",
                    "sensor_data": {
                        "node_id": sensor_id,
                        "location": location,
                        "sensor_type": sensor_type,
                        "data_type": data_type,
                        "value": value,
                        "unit": unit
                    }
                }
            )
            print(f"Data stored for sensor {sensor_id}")

            # Update last seen timestamp
            sensor_last_seen[sensor_id] = datetime.now().timestamp()
            check_disconnected_sensors()

        elif topic == "security/mode":
            # Handle mode updates
            mode = payload.get('mode', 'unknown')
            if mode in ['Stay', 'Disarm', 'Away']:
                async_to_sync(channel_layer.group_send)(
                    "sensors",
                    {
                        "type": "sensor_update",
                        "sensor_data": {
                            "type": "mode_update",
                            "mode": mode
                        }
                    }
                )
                print(f"Mode update sent: {mode}")

        elif topic.startswith("securityhub/devices/") or topic == "securityhub/data":
            print(f"Received message on topic: {topic} with payload: {message.payload.decode()}")

    except json.JSONDecodeError as e:
        print(f"Error decoding MQTT message: {e}")
    except Exception as e:
        print(f"Error processing MQTT message: {e}")

def check_disconnected_sensors():
    global channel_layer
    if channel_layer is None:
        channel_layer = get_channel_layer()
    current_time = datetime.now().timestamp()
    for sensor_id, last_seen in list(sensor_last_seen.items()):
        if current_time - last_seen > HEARTBEAT_TIMEOUT:
            Sensor = get_sensor_model()
            sensor = Sensor.objects.get(node_id=sensor_id)
            if sensor.status != "inactive":
                sensor.status = "inactive"
                sensor.save()
                async_to_sync(channel_layer.group_send)(
                    "sensors",
                    {
                        "type": "sensor_update",
                        "sensor_data": {"node_id": sensor_id, "status": "disconnected", "timestamp": datetime.now().isoformat()}
                    }
                )
                print(f"⚠ Sensor {sensor_id} marked as disconnected")
            del sensor_last_seen[sensor_id]

def start_mqtt():
    global client
    client = MQTTClientSingleton.get_instance()
    if not client.connected:
        try:
            print(f"Attempting to connect to MQTT broker at {settings.MQTT_CONFIG['HOST']}:{settings.MQTT_CONFIG['PORT']}")
            client.connect(settings.MQTT_CONFIG['HOST'], settings.MQTT_CONFIG['PORT'], client.keepalive)
            client.loop_start()
            print("🚀 MQTT service started.")
        except Exception as e:
            print(f"❌ MQTT Connection Error: {e}")
            client.connected = False
            if not client.reconnect_thread or not client.reconnect_thread.is_alive():
                client.reconnect_thread = threading.Thread(target=_reconnect_loop, daemon=True)
                client.reconnect_thread.start()
    else:
        print("ℹ️ MQTT client already running.")

def stop_mqtt():
    global client
    if client and client.connected:
        client.should_reconnect = False
        if client.reconnect_thread and client.reconnect_thread.is_alive():
            client.reconnect_thread.join()
        client.loop_stop()
        client.disconnect()
        client.connected = False
        print("🛑 MQTT service stopped.")