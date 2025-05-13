from django.urls import path
from .views import (
    LoginView, RegisterView, SensorStatusView, SensorView, ModeView,
    AlertLogView, AddSuperuserView, DeleteAccountView, DeviceListView,
    DeviceManageView, DeviceHistoryView, UserProfileView, NotificationListView,
    SensorTypesView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('sensor-status/', SensorStatusView.as_view(), name='sensor_status'),
    path('sensor/', SensorView.as_view(), name='sensor'),
    path('mode/', ModeView.as_view(), name='mode'),
    path('alerts/', AlertLogView.as_view(), name='alerts'),
    path('add-superuser/', AddSuperuserView.as_view(), name='add_superuser'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete_account'),
    path('devices/list/', DeviceListView.as_view(), name='device_list'),  # Renamed to avoid conflict
    path('devices/', DeviceManageView.as_view(), name='device_add'),  # POST for adding devices
    path('devices/<int:pk>/', DeviceManageView.as_view(), name='device_manage'),  # DELETE for removing devices
    path('device-history/', DeviceHistoryView.as_view(), name='device_history'),
    path('user-profile/', UserProfileView.as_view(), name='user_profile'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('sensor-types/', SensorTypesView.as_view(), name='sensor_types'),
]