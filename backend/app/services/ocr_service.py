"""
OCR service for extracting text from documents
"""

import os
import logging
from pathlib import Path
from typing import Optional

import pytesseract
import fitz  # PyMuPDF
from PIL import Image
from docx import Document as DocxDocument

from app.core.config import settings
from app.models.document import FileType

logger = logging.getLogger(__name__)


class OCRService:
    """OCR service class for text extraction"""

    def __init__(self):
        """Initialize OCR service"""
        # Set Tesseract path if on Windows (if not in PATH)
        # Uncomment and update the path below if Tesseract is not in your system PATH
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        # Alternative: Auto-detect Tesseract on Windows
        import platform
        tesseract_found = False
        
        if platform.system() == 'Windows':
            # Try common installation paths
            common_paths = [
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            ]
            for path in common_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    logger.info(f"Tesseract found at: {path}")
                    tesseract_found = True
                    break
        
        # Check if Tesseract is accessible
        try:
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract version: {version}")
        except Exception as e:
            logger.error(f"Tesseract not accessible: {str(e)}")
            if not tesseract_found:
                logger.warning("Tesseract not found in common paths and not in system PATH. OCR may fail.")
        
        # PyMuPDF is used for PDF processing (no external dependencies needed)
        logger.info("Using PyMuPDF for PDF processing")

    def extract_text_sync(
        self, file_path: Path, file_type: FileType, language: str = "eng"
    ) -> str:
        """
        Extract text from document based on file type (synchronous version for thread pool)

        Args:
            file_path: Path to the document file
            file_type: Type of the file (PDF, IMAGE, DOCX)
            language: Tesseract language code (default: eng)

        Returns:
            Extracted text from document
        """
        if file_type == FileType.PDF:
            return self._extract_from_pdf_sync(file_path, language)
        elif file_type == FileType.IMAGE:
            return self._extract_from_image_sync(file_path, language)
        elif file_type == FileType.DOCX:
            return self._extract_from_docx_sync(file_path)
        else:
            raise ValueError(f"Unsupported file type for OCR: {file_type}")

    async def extract_text(
        self, file_path: Path, file_type: FileType, language: str = "eng"
    ) -> str:
        """
        Extract text from document based on file type (async wrapper)

        Args:
            file_path: Path to the document file
            file_type: Type of the file (PDF, IMAGE, DOCX)
            language: Tesseract language code (default: eng)

        Returns:
            Extracted text from document
        """
        import asyncio
        return await asyncio.to_thread(
            self.extract_text_sync,
            file_path=file_path,
            file_type=file_type,
            language=language
        )

    def _extract_from_pdf_sync(self, file_path: Path, language: str) -> str:
        """Extract text from PDF file (synchronous) using PyMuPDF"""
        try:
            logger.info(f"Extracting text from PDF: {file_path}")
            
            # Open PDF with PyMuPDF
            doc = fitz.open(str(file_path))
            total_pages = len(doc)
            logger.info(f"PDF opened, total pages: {total_pages}")
            
            if total_pages == 0:
                doc.close()
                return "No pages found in PDF"
            
            extracted_texts = []
            
            # First, try to extract text directly (for text-based PDFs)
            for page_num in range(total_pages):
                try:
                    page = doc[page_num]
                    text = page.get_text()
                    
                    if text.strip():
                        # Text found directly, use it
                        extracted_texts.append(text.strip())
                        logger.info(f"Page {page_num + 1}/{total_pages}: Extracted {len(text)} characters (direct text)")
                    else:
                        # No text found, this might be a scanned PDF, use OCR
                        logger.info(f"Page {page_num + 1}/{total_pages}: No direct text, using OCR")
                        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        ocr_text = pytesseract.image_to_string(img, lang=language)
                        extracted_texts.append(ocr_text.strip() if ocr_text.strip() else f"[No text found on page {page_num + 1}]")
                        logger.info(f"Page {page_num + 1}/{total_pages}: OCR completed")
                        
                except Exception as page_error:
                    error_msg = f"Error processing page {page_num + 1}: {str(page_error)}"
                    logger.error(error_msg)
                    extracted_texts.append(f"[{error_msg}]")
            
            doc.close()
            
            result = "\n\n".join(extracted_texts)
            return result if result.strip() else "No text could be extracted from PDF"
            
        except Exception as e:
            error_msg = f"Error extracting text from PDF: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise ValueError(error_msg)

    def _extract_from_image_sync(self, file_path: Path, language: str) -> str:
        """Extract text from image file (synchronous)"""
        try:
            logger.info(f"Extracting text from image: {file_path}")
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image, lang=language)
            result = text.strip()
            logger.info(f"Extracted {len(result)} characters from image")
            return result if result else "No text could be extracted from image"
        except Exception as e:
            error_msg = f"Error extracting text from image: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise ValueError(error_msg)

    def _extract_from_docx_sync(self, file_path: Path) -> str:
        """Extract text from DOCX file (synchronous)"""
        try:
            logger.info(f"Extracting text from DOCX: {file_path}")
            doc = DocxDocument(str(file_path))
            paragraphs = [paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()]
            result = "\n\n".join(paragraphs)
            logger.info(f"Extracted {len(result)} characters from DOCX")
            return result if result.strip() else "No text found in DOCX document"
        except Exception as e:
            error_msg = f"Error extracting text from DOCX: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise ValueError(error_msg)

    # Keep async versions for backward compatibility
    async def _extract_from_pdf(self, file_path: Path, language: str) -> str:
        """Extract text from PDF file (async wrapper)"""
        import asyncio
        return await asyncio.to_thread(self._extract_from_pdf_sync, file_path, language)

    async def _extract_from_image(self, file_path: Path, language: str) -> str:
        """Extract text from image file (async wrapper)"""
        import asyncio
        return await asyncio.to_thread(self._extract_from_image_sync, file_path, language)

    async def _extract_from_docx(self, file_path: Path) -> str:
        """Extract text from DOCX file (async wrapper)"""
        import asyncio
        return await asyncio.to_thread(self._extract_from_docx_sync, file_path)


ocr_service = OCRService()

