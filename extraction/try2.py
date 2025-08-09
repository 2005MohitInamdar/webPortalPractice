import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnableSequence
from tenacity import retry, stop_after_attempt, wait_fixed
from datetime import datetime
from queue import Queue
from threading import Thread
from pdfExtactionScript import extract_text_from_pdf
import json

# --- Load environment variables ---
load_dotenv()
print("Debug: .env file loaded")

openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
if not openrouter_api_key:
    raise ValueError("OPENROUTER_API_KEY not found in .env file.")
print(f"Debug: API Key loaded: {openrouter_api_key[:4]}...")

# --- Initialize LLM ---
model_id = "https://openrouter.ai/api/v1"
try:
    llm = ChatOpenAI(
        model=model_id,
        openai_api_key=openrouter_api_key,
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0.7,
    )
except Exception as e:
    print(f"Debug: Failed with {model_id}: {e}")
    model_id = "deepseek/deepseek-r1"
    llm = ChatOpenAI(
        model=model_id,
        openai_api_key=openrouter_api_key,
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0.7,
    )

# --- LLM Pipeline Logic (like llm_pipeline.py) ---
def run_resume_parser(extracted_text, filtered_data):
    print("Send to llm")
    prompt_template = PromptTemplate(
        input_variables=["user_input", "filtered_data"],
        template="""
<task>
You are a resume parser and evaluator.

Step 1: Extract the following details from the resume text below:
- Full name
- Email address
- Phone number
- Percentage scored in 10th
- Percentage scored in 12th
- Aggregate CGPA (if present)
- Key technical skills (list of technologies like Python, React, etc.)
- Degree (e.g., B.Tech in Computer Science)
- College Name
- Graduation year (if mentioned)

Step 2: Based on the extracted data, check whether the candidate satisfies the following filter criteria:
{filtered_data}

Apply these rules strictly:
- If a field is not present in the resume, assume the candidate does **not** meet that filter.
- Compare CGPA and percentages numerically.
- For `skills`, the candidate must have **all** required skills from the filter (exact matches).
- For `branches`, match the degree branch against allowed branches.
- For `graduation year`, it must exactly match the one in the filter (if specified).
- For `internshipRequirement = true`, the candidate must show internship experience or mention it.

Step 3: If the candidate passes **all** filters, return this JSON:
{{
  "status": "pass",
  "full_name": "...",
  "email": "...",
  "phone": "...",
  "tenth_percentage": ...,
  "twelfth_percentage": ...,
  "cgpa": ...,
  "skills": [...],
  "degree": "...",
  "college": "...",
  "graduation_year": ...
}}

If the candidate does **not** pass the filters, return only:
{{
  "status": "fail",
  "message": "Candidate does not meet one or more filtered criteria."
}}

RESUME:
====================
{user_input}
</task>
"""
    )

    print("Ending the chat with LLM")
    chain: RunnableSequence = prompt_template | llm

    @retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
    def invoke_chain(user_input, filtered_data):
        print("Debug: Invoking LLM chain...")
        return chain.invoke({"user_input": user_input, "filtered_data": filtered_data})
        
    # return invoke_chain(extracted_text, filtered_data)
    return invoke_chain(
        extracted_text,
        json.dumps(filtered_data, indent=2)
    )                             