# celery_config.py
from celery import Celery

app = Celery('document_processing')
app.config_from_object('celeryconfig')

# celeryconfig.py
broker_url = 'redis://localhost:6379/0'
result_backend = 'redis://localhost:6379/0'

task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']
timezone = 'UTC'
enable_utc = True