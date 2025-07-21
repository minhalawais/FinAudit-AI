# app/utils/email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import BackgroundTasks
from typing import Dict
import logging
import socket
import os
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.zoho.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_timeout = int(os.getenv("SMTP_TIMEOUT", 10))  # seconds
        self.smtp_user = os.getenv("SMTP_USER", "minhal@finaudit.live")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.admin_email = os.getenv("ADMIN_EMAIL", "minhal@finaudit.live")
        self.from_email = os.getenv("FROM_EMAIL", "minhal@finaudit.live")
        
        logger.info(f"Initialized EmailService with host: {self.smtp_host}:{self.smtp_port}")

    def send_email(self, to: str, subject: str, body: str, is_html: bool = False):
        """Send email using the working SMTP method"""
        msg = MIMEMultipart()
        msg['From'] = self.from_email
        msg['To'] = to
        msg['Subject'] = subject
        msg['Reply-To'] = self.from_email

        if is_html:
            msg.attach(MIMEText(body, 'html'))
        else:
            msg.attach(MIMEText(body, 'plain'))

        try:
            logger.info(f"Attempting to send email to {to}")
            
            # Using the working SMTP connection method
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=self.smtp_timeout) as smtp:
                smtp.ehlo()  # Identify ourselves
                smtp.starttls()  # Upgrade to TLS
                smtp.ehlo()  # Re-identify ourselves over TLS connection
                smtp.login(self.smtp_user, self.smtp_password)
                smtp.sendmail(self.from_email, to, msg.as_string())
            
            logger.info(f"Email successfully sent to {to}")
            return True
            
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error occurred: {str(e)}")
            return False
        except socket.timeout as e:
            logger.error(f"Connection timed out: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return False

    async def send_demo_request_notification(
        self, 
        background_tasks: BackgroundTasks,
        form_data: Dict,
        user_email: str
    ):
        """Send demo request notifications"""
        try:
            # Email to admin
            admin_subject = f"New Demo Request: {form_data.get('company', '')}"
            admin_body = f"""New demo request received:
            
Name: {form_data.get('name', '')}
Email: {form_data.get('email', '')}
Company: {form_data.get('company', '')}
Role: {form_data.get('role', '')}
Message: {form_data.get('message', '')}"""
            
            # Email to user
            user_subject = "Thank you for your demo request"
            user_body = f"""<html><body>
                <h2>Thank you for requesting a demo</h2>
                <p>We've received your request and will contact you shortly.</p>
                <p>Request details:</p>
                <ul>
                    <li>Name: {form_data.get('name', '')}</li>
                    <li>Company: {form_data.get('company', '')}</li>
                </ul>
            </body></html>"""
            
            # Add to background tasks
            background_tasks.add_task(
                self.send_email,
                to=self.admin_email,
                subject=admin_subject,
                body=admin_body
            )
            
            background_tasks.add_task(
                self.send_email,
                to=user_email,
                subject=user_subject,
                body=user_body,
                is_html=True
            )
            
            logger.info("Demo request emails queued for sending")
            
        except Exception as e:
            logger.error(f"Failed to queue demo emails: {str(e)}")
            raise