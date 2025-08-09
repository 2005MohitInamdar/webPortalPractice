import pdfplumber
import math
import logging
from collections import defaultdict

# Suppress specific pdfplumber CropBox warnings
logging.getLogger("pdfplumber").setLevel(logging.ERROR)

def get_directional_distances(word1, word2):
    # Calculate horizontal and vertical distances using bounding box centers
    x1, y1 = (word1['x0'] + word1['x1']) / 2, (word1['top'] + word1['bottom']) / 2
    x2, y2 = (word2['x0'] + word2['x1']) / 2, (word2['top'] + word2['bottom']) / 2
    horizontal_dist = abs(x2 - x1)
    vertical_dist = abs(y2 - y1)
    return horizontal_dist, vertical_dist

def extract_structured_text(page, threshold=15):
    # Extract words with adjusted tolerances to capture more words
    words = page.extract_words(x_tolerance=2, y_tolerance=2, keep_blank_chars=True)
    if not words:
        return []
    
    # Sort words by top (ascending) and x0 (ascending) to start from top-left
    words = sorted(words, key=lambda w: (w['top'], w['x0']))
    
    # Initialize groups and track processed words
    groups = []
    processed = set()
    
    for i, current_word in enumerate(words):
        if i in processed:
            continue
        
        # Start a new group
        current_group = [current_word]
        processed.add(i)
        
        while True:
            closest_word = None
            min_horizontal_dist = float('inf')
            min_vertical_dist = float('inf')
            closest_idx = None
            is_horizontal = True
            
            # Find closest unprocessed word
            for j, other_word in enumerate(words):
                if j in processed:
                    continue
                
                h_dist, v_dist = get_directional_distances(current_word, other_word)
                
                if h_dist < v_dist and h_dist < min_horizontal_dist:
                    min_horizontal_dist = h_dist
                    closest_word = other_word
                    closest_idx = j
                    is_horizontal = True
                elif v_dist < min_vertical_dist:
                    min_vertical_dist = v_dist
                    closest_word = other_word
                    closest_idx = j
                    is_horizontal = False
            
            # Stop if no close word or distance exceeds threshold
            if closest_word is None or min(min_horizontal_dist, min_vertical_dist) > threshold:
                break
                
            processed.add(closest_idx)
            
            if is_horizontal:
                current_group.append(closest_word)
                current_word = closest_word
            else:
                current_group = sorted(current_group, key=lambda w: w['x0'])
                groups.append(current_group)
                current_group = [closest_word]
                current_word = closest_word
        
        # Add final group
        if current_group:
            current_group = sorted(current_group, key=lambda w: w['x0'])
            groups.append(current_group)
    
    return groups

def extract_text_from_pdf(pdf_path):
    print("Starting text extraction")
    full_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                # Try simple text extraction first
                text = page.extract_text(keep_blank_chars=True)
                if text and len(text.strip()) > 0:
                    full_text += f"\n--- Page {i+1} ---\n{text.strip()}\n"
                else:
                    # Fall back to structured extraction
                    groups = extract_structured_text(page)
                    if groups:
                        full_text += f"\n--- Page {i+1} ---\n"
                        for idx, group in enumerate(groups):
                            group_text = " ".join(word['text'] for word in group).strip()
                            if group_text:
                                full_text += f"{group_text}\n"
                    else:
                        full_text += f"\n--- Page {i+1} ---\n[No text found]\n"
        return full_text.strip()
    except FileNotFoundError:
        return "Error: The file was not found. Please provide the correct file path."
    except Exception as e:
        return f"Error: An unexpected issue occurred: {str(e)}"