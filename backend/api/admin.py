from django.contrib import admin
from .models import Sensor, SensorData, AlertLog

admin.site.register(Sensor)
admin.site.register(SensorData)
admin.site.register(AlertLog)