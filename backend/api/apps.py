from django.apps import AppConfig
import atexit
import importlib
import sys
import os

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    mqtt_started = False  # Class-level flag to prevent multiple starts

    def ready(self):
        # Only start MQTT if running the server, not the shell or migrations
        if 'runserver' not in sys.argv:
            return

        # Use a file-based lock to ensure MQTT starts only once, even with autoreload
        lock_file = '/tmp/securityhub_mqtt.lock'
        if os.path.exists(lock_file):
            with open(lock_file, 'r') as f:
                pid = f.read().strip()
                if pid == str(os.getpid()):
                    # This process already started MQTT
                    return
                else:
                    # Another process started MQTT; skip starting it again
                    return

        # Write the current PID to the lock file
        with open(lock_file, 'w') as f:
            f.write(str(os.getpid()))

        # Ensure the lock file is removed on exit
        atexit.register(lambda: os.remove(lock_file) if os.path.exists(lock_file) else None)

        if not self.mqtt_started:
            try:
                # Dynamically import mqtt_handler from api
                mqtt_handler = importlib.import_module('api.mqtt_handler')
                start_mqtt = mqtt_handler.start_mqtt
                stop_mqtt = mqtt_handler.stop_mqtt
                print("Starting MQTT service as part of server startup...")
                start_mqtt()
                atexit.register(stop_mqtt)
                self.mqtt_started = True  # Set flag to prevent re-running in this process
            except ImportError as e:
                print(f"Failed to import MQTT handler: {e}")
                print("MQTT service will not start. Ensure mqtt_handler.py exists in the api directory and imports are correct.")
            except Exception as e:
                print(f"Failed to start MQTT service: {e}")