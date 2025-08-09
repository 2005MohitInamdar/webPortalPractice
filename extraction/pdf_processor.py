import threading
import queue
import time
import json
from pdfExtactionScript import extract_text_from_pdf
from try2 import run_resume_parser
import re
from m_pdf_processor import update_llmOutput

name = {}
email = ''

#Storing filtered data in filtered_data
filtered_data = {}
def get_Filters(filters):
    filtered_data.update(filters)
    
# Thread-safe queue for file paths
pdf_queue = queue.Queue()

def worker():
    
    while True:
        pdf_path = pdf_queue.get()
        try:
            print(f"Processing {pdf_path}")
            text = extract_text_from_pdf(pdf_path)
            
            if not text.strip():
                raise ValueError("Extracted text is empty.")

            print("Sending text to LLM...")
            response = run_resume_parser(text, filtered_data)
            
            # print("LLM Response:")
            # print(response.content)

            try:
                cleaned = re.sub(r"^```json\s*|```$", "", response.content.strip(), flags=re.MULTILINE)
                response_json = json.loads(cleaned)
                if response_json.get("status") == "pass":
                    # name = response_json.get("full_name", "Unknown")
                    # email = response_json.get("email", "Unknown")
                    # print(f"Candidate Passed\nName: {name}\nEmail: {email}")
                    name = response_json
                    update_llmOutput(name)
                    print("PASSED:", name)

                    # Save only name + email to file (optional)
                    with open(f"{pdf_path}_summary.txt", "w", encoding="utf-8") as f:
                        f.write(f"Name: {name}\nEmail: {email}")

                else:
                    print("❌ Candidate did not pass the filters.")
                    print(response_json.get("message", "No message."))

            except json.JSONDecodeError as e:
                print(f"❗ Failed to parse LLM response as JSON: {e}")

                
            # You can now save this to DB or write it to a file etc.
            # print(f"Done with {pdf_path}")
            
        except Exception as e:
            print(f"Error processing {pdf_path}: {e}")
        finally:
            pdf_queue.task_done()

# Start a background thread that listens to the queue
threading.Thread(target=worker, daemon=True).start()

def add_pdf_to_queue(pdf_path):
    pdf_queue.put(pdf_path)
    # print(f"{pdf_path} added to queue")