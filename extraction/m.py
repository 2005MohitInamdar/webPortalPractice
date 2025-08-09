from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pdf_processor import add_pdf_to_queue, get_Filters
from shared import llmOutput
from send_emailScript import send_email_to_passed
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}}, supports_credentials=True)

UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return jsonify({"message": "Hello from Flask backend!"})

@app.route('/upload', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    save_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(save_path)
    
      # Add file to processing queue
    add_pdf_to_queue(save_path)
    # Later: Call your PDF parser here

    return jsonify({"message": "File uploaded successfully", "filename": file.filename}), 200

@app.route('/api/filters', methods=['POST', 'OPTIONS'])
def filters():
    if request.method == 'OPTIONS':
        # CORS preflight request
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:4200")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response, 200

    # Handle actual POST request
    #filter data JSON
    data = request.get_json()
    get_Filters(data)
    print("Received filters:", data)
    return jsonify({"message": "Filters received"}), 200

@app.route('/api/llm-output', methods=['GET'])
def getLLM_OutputData():
    if llmOutput:
        return jsonify(llmOutput.pop(0))  # ✅ Send and remove the first result
    else:
        return jsonify({})
    
    
emails = []
@app.route('/api/sendEmail', methods=['POST'])
def sendEmail():
    try:
        data = request.get_json()
        print('\n')
        print("Received data: ", data)
        for email in data:
            emails.append(email['email']) 
        print('\n')
        print('printing the emails:')
        for e in emails:
            print(e) 
        
        return jsonify({"message": "Email sent successfully"}), 200
    except Exception as e:
        print("ERROR FOUND IN BACKEND", str(e))
        return jsonify({"error": str(e)}), 500


@app.route('/api/now_sending', methods=['POST'])
def now_sending():
    try:
        booleanValue = request.get_json()
        if(booleanValue == True):
            for em in emails:
                send_email_to_passed(em)
                time.sleep(3)
        
        
        return jsonify({"message": "Email sent successfully"}), 200
    except Exception as e:
        print("ERROR FOUND IN BACKEND", str(e))
        return jsonify({"error": str(e)}), 500
        

    
if __name__ == '__main__':
    app.run(port=5000, debug=True)
    