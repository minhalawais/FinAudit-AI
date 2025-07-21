import fitz  # PyMuPDF
import pandas as pd
from PIL import Image
import pytesseract
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Document, DocumentAIAnalysis, AIModel
import json
import google.generativeai as genai
from typing import Dict, Any, Union
from datetime import datetime

import platform
if platform.system() == 'Linux':
    pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'
else:
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

API_KEY = "AIzaSyC9kRGz-cMVvEIXPpfsySl_eZt3OzgVpgE"  # Replace with your actual API key

# Initialize the generative AI client
genai.configure(api_key=API_KEY)

def parse_content_with_genai(content: str, file_type: str) -> Union[Dict[str, Any], list]:
    """
    Sends content to generative AI with a specific query based on the file type.
    Handles errors and ensures proper formatting of the output.
    Returns either a dictionary or a list depending on the API response.
    """
    try:
        # Define a query/prompt based on the file type
        if file_type == "pdf":
            query = "Extract key insights, sentiment analysis, and document title from the following text. Use 'title' as the key for the document title:"
        elif file_type == "excel" or file_type == "csv":
            query = "Analyze the following tabular data and extract key financial metrics, trends, insights, and document title. Use 'title' as the key for the document title:"
        elif file_type == "image":
            query = "Extract and summarize the text from the following image content, extract the document title, and return all insights from the document. Use 'title' as the key for the document title:"
        else:
            query = "Analyze the following content and provide key insights and document title. Use 'title' as the key for the document title:"
        # Create a model instance
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Generate content with structured output
        response = model.generate_content(
            f"{query}\n\n{content}",
            generation_config=genai.GenerationConfig(
                temperature=0.2,
                response_mime_type="application/json"
            )
        )
        
        # Parse the response
        response_text = response.text
        print('Response Text:', response_text)
        parsed_content = json.loads(response_text)
        print('Parsed Content:', parsed_content)
        
        # Accept both dictionary and list responses
        if not isinstance(parsed_content, (dict, list)):
            raise ValueError("API response is not in the expected format (neither dict nor list).")

        return parsed_content

    except Exception as e:
        print(f"Error processing content with generative AI: {e}")
        return {"error": f"Failed to process content: {str(e)}"}

def generate_ai_analysis(content: Union[Dict[str, Any], list], file_type: str) -> Dict[str, Any]:
    """
    Generates AI analysis using Gemini and returns the analysis in a structured format.
    Directly returns the analysis values without wrapping them in an "analysis" key.
    """
    try:
        query = """
        Analyze the following content and provide a meaningful and generic analysis.
        Return the analysis directly in a structured JSON format without wrapping it in an "analysis" key.
        For example:
        {
            "summary": "This is a summary of the analysis.",
            "key_attributes": {
                "attribute1": "value1",
                "attribute2": "value2"
            },
            "limitations": "These are the limitations.",
            "potential_applications": ["application1", "application2"]
        }
        """
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        response = model.generate_content(
            f"{query}\n\n{content}",
            generation_config=genai.GenerationConfig(
                temperature=0.2,
                response_mime_type="application/json"
            )
        )
        
        response_text = response.text
        print('AI Analysis Response Text:', response_text)
        ai_analysis = json.loads(response_text)
        print('AI Analysis:', ai_analysis)
        
        return ai_analysis

    except Exception as e:
        print(f"Error generating AI analysis: {e}")
        return {"error": f"Failed to generate AI analysis: {str(e)}"}
    
def save_ai_analysis(document_id: int, ai_analysis: Dict[str, Any], file_type: str):
    """
    Saves the AI analysis to the database.
    """
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            ai_model = db.query(AIModel).filter(AIModel.name == "Gemini-2.0-flash").first()
            if not ai_model:
                ai_model = AIModel(
                    name="Gemini-2.0-flash",
                    version="1.0",
                    model_type="Generative AI",
                    trained_at=datetime.utcnow(),
                    performance_metrics={}
                )
                db.add(ai_model)
                db.commit()
            
            ai_analysis_record = DocumentAIAnalysis(
                document_id=document_id,
                ai_model_id=ai_model.id,
                analysis_type=f"{file_type}_ai_analysis",
                results=ai_analysis,
                confidence_score=0.95  # You might want to implement a real confidence score
            )
            db.add(ai_analysis_record)
            db.commit()
    except Exception as e:
        print(f"Error saving AI analysis to database: {e}")
        db.rollback()
    finally:
        db.close()

def process_pdf(file_path: str, document_id: int):
    try:
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        
        parsed_content = parse_content_with_genai(text, 'pdf')
        save_extracted_content(document_id, parsed_content, 'pdf', raw_content=text)
        
        ai_analysis = generate_ai_analysis(parsed_content, 'pdf')
        save_ai_analysis(document_id, ai_analysis, 'pdf')
    except Exception as e:
        print(f"Error processing PDF file: {e}")
        save_extracted_content(document_id, {"error": f"Failed to process PDF: {e}"}, 'pdf')

def process_excel(file_path: str, document_id: int):
    try:
        df = pd.read_excel(file_path)
        content = df.to_json(orient="records")
        raw_content = df.to_string()  # Get raw string representation
        
        parsed_content = parse_content_with_genai(content, 'excel')
        save_extracted_content(document_id, parsed_content, 'excel', raw_content=raw_content)
        
        ai_analysis = generate_ai_analysis(parsed_content, 'excel')
        save_ai_analysis(document_id, ai_analysis, 'excel')
    except Exception as e:
        print(f"Error processing Excel file: {e}")
        save_extracted_content(document_id, {"error": f"Failed to process Excel: {e}"}, 'excel')

def process_csv(file_path: str, document_id: int):
    try:
        df = pd.read_csv(file_path)
        content = df.to_json(orient="records")
        raw_content = df.to_string()  # Get raw string representation
        
        parsed_content = parse_content_with_genai(content, 'csv')
        save_extracted_content(document_id, parsed_content, 'csv', raw_content=raw_content)
        
        ai_analysis = generate_ai_analysis(parsed_content, 'csv')
        save_ai_analysis(document_id, ai_analysis, 'csv')
    except Exception as e:
        print(f"Error processing CSV file: {e}")
        save_extracted_content(document_id, {"error": f"Failed to process CSV: {e}"}, 'csv')

def process_image(file_path: str, document_id: int):
    try:
        text = pytesseract.image_to_string(Image.open(file_path))
        parsed_content = parse_content_with_genai(text, 'image')
        save_extracted_content(document_id, parsed_content, 'image', raw_content=text)
        
        ai_analysis = generate_ai_analysis(parsed_content, 'image')
        save_ai_analysis(document_id, ai_analysis, 'image')
    except Exception as e:
        print(f"Error processing image file: {e}")
        save_extracted_content(document_id, {"error": f"Failed to process image: {e}"}, 'image')

def save_extracted_content(document_id: int, content: Union[Dict[str, Any], list], file_type: str, raw_content: str = None):
    """
    Saves the extracted content and AI analysis to the database.
    """
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            # Save raw content if provided
            if raw_content is not None:
                document.raw_content = raw_content
            
            # Ensure the content is properly formatted as JSON
            if isinstance(content, (dict, list)):
                document.content = json.dumps(content, ensure_ascii=False)

                # Check if the parsed content contains a title and update the document title
                if isinstance(content, dict) and "title" in content and "None" not in content["title"]:
                    document.title = content["title"]
                elif isinstance(content, list) and len(content) > 0 and isinstance(content[0], dict) and "title" in content[0]:
                    document.title = content[0]["title"]
            else:
                document.content = json.dumps({"error": "Invalid content format"}, ensure_ascii=False)
            
            db.commit()
    except Exception as e:
        print(f"Error saving extracted content to database: {e}")
        db.rollback()
    finally:
        db.close()