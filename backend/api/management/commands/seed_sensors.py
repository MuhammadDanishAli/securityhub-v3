from django.core.management.base import BaseCommand
from api.models import Sensor

class Command(BaseCommand):
    help = 'Seeds the database with initial sensor data'

    def handle(self, *args, **options):
        sensors = [
            {'node_id': 'pir', 'location': 'Living Room', 'sensor_type': 'motion'},
            {'node_id': 'vibration', 'location': 'Garage', 'sensor_type': 'vibration'},
            {'node_id': 'dht', 'location': 'Kitchen', 'sensor_type': 'temperature'},
        ]

        for sensor_data in sensors:
            sensor, created = Sensor.objects.get_or_create(
                node_id=sensor_data['node_id'],
                defaults={
                    'location': sensor_data['location'],
                    'sensor_type': sensor_data['sensor_type'],
                    'status': 'active',
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Successfully created sensor: {sensor.node_id}'))
            else:
                self.stdout.write(self.style.WARNING(f'Sensor already exists: {sensor.node_id}'))
