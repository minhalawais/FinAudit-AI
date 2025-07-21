from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, DocumentWorkflow, WorkflowStep, WorkflowExecutionHistory
from app.routers.auth import get_current_user

router = APIRouter()

@router.post("/documents/{document_id}/workflow/action", response_model=Dict[str, Any])
async def perform_workflow_action(
    document_id: int,
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Perform an action on a document workflow
    """
    workflow_id = data.get("workflow_id")
    action = data.get("action")
    notes = data.get("notes", "")
    step_number = data.get("step_number")
    
    if not workflow_id or not action or not step_number:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # Get the document workflow
    document_workflow = db.query(DocumentWorkflow).filter(
        DocumentWorkflow.id == workflow_id,
        DocumentWorkflow.document_id == document_id
    ).first()
    
    if not document_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Verify the current step matches
    if document_workflow.current_step != step_number:
        raise HTTPException(status_code=400, detail="Invalid step number")
    
    # Verify the workflow is in progress
    if document_workflow.status != "in_progress":
        raise HTTPException(status_code=400, detail="Workflow is not in progress")
    
    # Get the workflow step
    workflow_step = db.query(WorkflowStep).filter(
        WorkflowStep.workflow_id == document_workflow.workflow_id,
        WorkflowStep.step_number == step_number
    ).first()
    
    if not workflow_step:
        raise HTTPException(status_code=404, detail="Workflow step not found")

    if workflow_step.role_required and current_user.role.value != workflow_step.role_required:
        raise HTTPException(status_code=403, detail=f"This action requires {workflow_step.role_required} role")
    
    # Create execution history record
    history = WorkflowExecutionHistory(
        document_workflow_id=document_workflow.id,
        step_number=step_number,
        action=f"{action.capitalize()} {workflow_step.action}",
        performed_by=current_user.id,
        performed_at=datetime.utcnow(),
        notes=notes,
        status="completed" if action == "approve" else "rejected"
    )
    db.add(history)
    
    # Update the workflow based on the action
    if action == "approve":
        # Get the total number of steps in the workflow
        total_steps = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_id == document_workflow.workflow_id
        ).count()
        
        # If this is the last step, mark the workflow as completed
        if step_number == total_steps:
            document_workflow.status = "completed"
            document_workflow.completed_at = datetime.utcnow()
        else:
            # Move to the next step
            document_workflow.current_step = step_number + 1
            
            # Get the next step's timeout duration
            next_step = db.query(WorkflowStep).filter(
                WorkflowStep.workflow_id == document_workflow.workflow_id,
                WorkflowStep.step_number == step_number + 1
            ).first()
            
            if next_step and next_step.timeout_duration:
                document_workflow.timeout_at = datetime.utcnow() + timedelta(hours=next_step.timeout_duration)
    else:  # Reject
        document_workflow.status = "rejected"
        document_workflow.rejected_by = current_user.id
        document_workflow.rejected_at = datetime.utcnow()
    
    db.commit()
    db.refresh(document_workflow)
    
    # Return the updated workflow
    return {
        "message": f"Workflow step {action}ed successfully",
        "workflow": {
            "id": document_workflow.id,
            "workflow_id": document_workflow.workflow_id,
            "current_step": document_workflow.current_step,
            "status": document_workflow.status,
            "started_at": document_workflow.started_at.isoformat() if document_workflow.started_at else None,
            "completed_at": document_workflow.completed_at.isoformat() if document_workflow.completed_at else None,
            "timeout_at": document_workflow.timeout_at.isoformat() if document_workflow.timeout_at else None,
            "execution_history": [
                {
                    "id": h.id,
                    "step_number": h.step_number,
                    "action": h.action,
                    "performed_by": h.performed_by,
                    "performed_at": h.performed_at.isoformat() if h.performed_at else None,
                    "notes": h.notes,
                    "status": h.status
                }
                for h in document_workflow.execution_history
            ]
        }
    }
