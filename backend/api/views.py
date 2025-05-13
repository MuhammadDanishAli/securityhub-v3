from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status, generics
from rest_framework.serializers import ModelSerializer
from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Sensor, SensorData, AlertLog, User, DeviceHistory
from .serializers import SensorSerializer, AlertLogSerializer
from .mqtt_handler import MQTTClientSingleton

User = get_user_model()

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("Login request received:", request.data)
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            print("Missing username or password")
            return Response(
                {'error': 'Both username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        if not user:
            print(f"Authentication failed for username: {username}")
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token, created = Token.objects.get_or_create(user=user)
        print(f"Login successful for user: {username}, token: {token.key}")
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'role': user.role,
            'is_superuser': user.is_superuser
        }, status=status.HTTP_200_OK)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        phone = request.data.get('phone')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.create_user(
                username=username,
                password=password,
                email=username,
                role='user',
                phone=phone
            )
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'status': 'success',
                'message': 'User registered successfully',
                'token': token.key,
                'username': user.username
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Failed to register user: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SensorStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client_id = request.query_params.get('client_id', '1')
        sensors = Sensor.objects.filter(client_id=client_id)
        return Response({
            'status': 'success',
            'data': {s.node_id: {'connected': True, 'value': 0} for s in sensors}
        })

    def post(self, request):
        sensor_id = request.data.get('sensor_id')
        enabled = request.data.get('enabled')
        client_id = request.data.get('client_id', '1')
        
        if sensor_id is None or enabled is None:
            return Response(
                {'error': 'Both sensor_id and enabled are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            enabled = bool(enabled)
        except ValueError:
            return Response(
                {'error': 'enabled must be a boolean value'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sensor = get_object_or_404(Sensor, node_id=sensor_id, client_id=client_id)
        sensor.status = 'active' if enabled else 'inactive'
        sensor.save()
        
        return Response({
            'status': 'success',
            'message': f'Sensor {sensor_id} {"enabled" if enabled else "disabled"} for client {client_id}'
        })

class SensorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        sensor_id = request.data.get('sensor_id')
        state = request.data.get('state')
        client_id = request.data.get('client_id', '1')
        
        if sensor_id is None or state is None:
            return Response(
                {'error': 'Both sensor_id and state are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sensor = get_object_or_404(Sensor, node_id=sensor_id, client_id=client_id)
        sensor.status = 'active' if state else 'inactive'
        sensor.save()

        return Response({
            'status': 'success',
            'message': f'Sensor {sensor_id} set to {"active" if state else "inactive"} for client {client_id}'
        })

class ModeView(APIView):
    permission_classes = [IsAuthenticated]
    
    MODES = ['stay', 'away', 'disarm']

    def post(self, request):
        mode = request.data.get('mode', '').lower()
        client_id = request.data.get('client_id', '1')
        
        if not mode:
            return Response(
                {'error': 'Mode is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if mode not in self.MODES:
            return Response(
                {'error': f'Invalid mode. Allowed modes: {", ".join(self.MODES)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'status': 'success',
            'message': f'System mode set to {mode} for client {client_id}'
        })

    def get(self, request):
        client_id = request.query_params.get('client_id', '1')
        return Response({
            'status': 'success',
            'message': f'System mode set to disarm for client {client_id}'
        })

class AlertLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client_id = request.query_params.get('client_id', '1')
        alerts = AlertLog.objects.filter(client_id=client_id, is_resolved=False).order_by('-timestamp')
        return Response({
            'status': 'success',
            'count': alerts.count(),
            'alerts': [{'sensor': a.sensor.node_id, 'message': a.message} for a in alerts]
        })

    def post(self, request):
        alert_id = request.data.get('alert_id')
        action = request.data.get('action')
        client_id = request.data.get('client_id', '1')
        
        if not alert_id or not action:
            return Response(
                {'error': 'Both alert_id and action are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        alert = get_object_or_404(AlertLog, id=alert_id, client_id=client_id)
        
        if action.lower() == 'resolve':
            alert.is_resolved = True
            alert.resolved_at = timezone.now()
            alert.save()
            return Response({'status': 'success', 'message': 'Alert resolved'})
        
        return Response(
            {'error': 'Invalid action. Only "resolve" is supported'},
                status=status.HTTP_400_BAD_REQUEST
        )

class AddSuperuserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only superusers can add new superusers'},
                status=status.HTTP_403_FORBIDDEN
            )

        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Both username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.create_superuser(
                username=username,
                password=password,
                email='',
                role='admin'
            )
            return Response({
                'status': 'success',
                'message': f'Superuser {username} created successfully'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Failed to create superuser: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        password = request.data.get('password')
        user = request.user
        
        if not password:
            return Response(
                {'error': 'Password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(password):
            return Response(
                {'error': 'Incorrect password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user.delete()
        return Response(
            {'status': 'success', 'message': 'Account deleted successfully'},
            status=status.HTTP_200_OK
        )

# Device List View
class DeviceListView(generics.ListAPIView):
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        client_id = self.request.query_params.get('client_id', '1')
        return Sensor.objects.filter(client_id=client_id)

# Device Management View (Add/Remove)
class DeviceManageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        node_id = request.data.get('node_id')
        client_id = request.data.get('client_id', '1')
        location = request.data.get('location')
        sensor_type = request.data.get('sensor_type')
        
        if not all([node_id, client_id, location, sensor_type]):
            return Response(
                {'error': 'node_id, client_id, location, and sensor_type are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if sensor_type not in [choice[0] for choice in Sensor.SENSOR_TYPES]:
            return Response(
                {'error': f'Invalid sensor_type. Allowed types: {", ".join([choice[0] for choice in Sensor.SENSOR_TYPES])}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Sensor.objects.filter(node_id=node_id).exists():
            return Response(
                {'error': 'Sensor with this node_id already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sensor = Sensor.objects.create(
            node_id=node_id,
            client_id=client_id,
            location=location,
            sensor_type=sensor_type,
            status='active'
        )

        # Log the addition in DeviceHistory
        DeviceHistory.objects.create(
            sensor=sensor,
            client_id=client_id,
            action='added',
            timestamp=timezone.now()
        )

        # Publish MQTT message to notify ESP32
        mqtt_payload = f'{{"node_id":"{node_id}","sensor_type":"{sensor_type}","location":"{location}","action":"add"}}'
        topic = f"securityhub/devices/client_{client_id}"
        MQTTClientSingleton.publish(topic, mqtt_payload)

        return Response({
            'status': 'success',
            'message': f'Sensor {node_id} added successfully'
        }, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        client_id = request.query_params.get('client_id', '1')
        sensor = get_object_or_404(Sensor, id=pk, client_id=client_id)
        
        # Log the removal in DeviceHistory
        DeviceHistory.objects.create(
            sensor=sensor,
            client_id=client_id,
            action='removed',
            timestamp=timezone.now()
        )

        # Publish MQTT message to notify ESP32
        mqtt_payload = f'{{"node_id":"{sensor.node_id}","action":"remove"}}'
        topic = f"securityhub/devices/client_{client_id}"
        MQTTClientSingleton.publish(topic, mqtt_payload)

        sensor.delete()
        return Response({
            'status': 'success',
            'message': 'Device removed successfully'
        }, status=status.HTTP_200_OK)

# Device History View
class DeviceHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client_id = request.query_params.get('client_id', '1')
        history = DeviceHistory.objects.filter(client_id=client_id).order_by('-timestamp')
        return Response([
            {
                'sensor_id': h.sensor.node_id,
                'sensor_type': h.sensor.sensor_type,
                'action': h.action,
                'timestamp': h.timestamp.isoformat()
            } for h in history
        ])

# User Profile View
class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone']

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Failed to load user profile: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Notification View
class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client_id = request.query_params.get('client_id', '1')
        alerts = AlertLog.objects.filter(client_id=client_id).order_by('-timestamp')
        serializer = AlertLogSerializer(alerts, many=True)
        return Response(serializer.data)

# New view to get sensor types
class SensorTypesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sensor_types = [choice[0] for choice in Sensor.SENSOR_TYPES]
        return Response({
            'status': 'success',
            'sensor_types': sensor_types
        })