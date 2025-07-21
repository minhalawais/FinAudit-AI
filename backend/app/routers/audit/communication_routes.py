"""
Communication and messaging routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import *
from .models import MessageCreate

communication_router = APIRouter(prefix="/api/audits", tags=["audit-communication"])

@communication_router.get("/{audit_id}/conversations")
async def get_audit_conversations(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversations for an audit"""
    
    conversations = db.query(Conversation).options(
        joinedload(Conversation.participants),
        joinedload(Conversation.messages)
    ).filter(Conversation.audit_id == audit_id).all()
    
    return {
        "conversations": [
            {
                "id": conv.id,
                "audit_id": conv.audit_id,
                "title": conv.title,
                "participants": [
                    {
                        "id": p.id,
                        "name": f"{p.f_name} {p.l_name}",
                        "email": p.email,
                        "role": p.role.value
                    }
                    for p in conv.participants
                ],
                "last_message": {
                    "id": conv.messages[-1].id,
                    "content": conv.messages[-1].content,
                    "sender": {
                        "id": conv.messages[-1].sender.id,
                        "name": f"{conv.messages[-1].sender.f_name} {conv.messages[-1].sender.l_name}"
                    },
                    "sent_at": conv.messages[-1].sent_at.isoformat()
                } if conv.messages else None,
                "unread_count": len([m for m in conv.messages if not m.is_read and m.sender_id != current_user.id]),
                "created_at": conv.created_at.isoformat()
            }
            for conv in conversations
        ]
    }

@communication_router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages for a conversation"""
    
    messages = db.query(Message).options(
        joinedload(Message.sender)
    ).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.sent_at.asc()).all()
    
    # Mark messages as read
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    return {
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "sender": {
                    "id": msg.sender.id,
                    "name": f"{msg.sender.f_name} {msg.sender.l_name}",
                    "role": msg.sender.role.value
                },
                "sent_at": msg.sent_at.isoformat(),
                "message_type": msg.message_type.value
            }
            for msg in messages
        ]
    }

@communication_router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message in a conversation"""
    
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=message_data.content,
        message_type=MessageType(message_data.message_type)
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return {"message": "Message sent successfully", "message_id": message.id}
