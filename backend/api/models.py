from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# Custom User Model
class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('user', 'Regular User'),
        ('viewer', 'Viewer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    def __str__(self):
        return self.username

class Sensor(models.Model):
    SENSOR_TYPES = [
        ("temperature", "Temperature"),
        ("motion", "Motion"),
        ("smoke", "Smoke"),
        ("gas", "Gas"),
        ("door", "Door"),
        ("glass", "Glass"),
        ("window", "Window"),
        ("vibration", "Vibration"),
        ("fire", "Fire"),
        ("sound", "Sound"),
        ("ultrasonic", "Ultrasonic")
    ]
    
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("maintenance", "Under Maintenance")
    ]

    node_id = models.CharField(max_length=100, unique=True)
    client_id = models.CharField(max_length=100)  # Default removed
    location = models.CharField(max_length=255)
    sensor_type = models.CharField(max_length=50, choices=SENSOR_TYPES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="active")
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-last_updated']

    def __str__(self):
        return f"Sensor {self.node_id} - {self.location} ({self.sensor_type})"

class SensorData(models.Model):
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, related_name='data_points')
    data_type = models.CharField(max_length=50)
    value = models.FloatField()
    unit = models.CharField(max_length=10, default="C")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['sensor', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.sensor.node_id} - {self.data_type}: {self.value}{self.unit} @ {self.timestamp}"

class AlertLog(models.Model):
    ALERT_TYPES = [
        ("critical", "Critical"),
        ("warning", "Warning"),
        ("info", "Info")
    ]
    
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, related_name='alerts')
    client_id = models.CharField(max_length=100)  # Default removed
    alert_type = models.CharField(max_length=100, choices=ALERT_TYPES)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Alert Log"
        verbose_name_plural = "Alert Logs"

    def save(self, *args, **kwargs):
        if self.is_resolved and not self.resolved_at:
            self.resolved_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Alert for {self.sensor.node_id}: {self.alert_type} - {self.message[:50]}"

class DeviceHistory(models.Model):
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, related_name='history')
    client_id = models.CharField(max_length=100, default='1')
    action = models.CharField(max_length=10, choices=[('added', 'Added'), ('removed', 'Removed')])
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Device History"
        verbose_name_plural = "Device Histories"

    def __str__(self):
        return f"{self.action} {self.sensor.node_id} at {self.timestamp}"