# Real-time Object Detection with Python Backend

This project demonstrates real-time object detection using a React frontend and Python backend.

## Project Structure

- `frontend/`: Next.js frontend application
- `backend/`: Python FastAPI backend for object detection

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   \`\`\`
   cd backend
   \`\`\`

2. Create a virtual environment (optional but recommended):
   \`\`\`
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`

3. Install the required dependencies:
   \`\`\`
   pip install -r requirements.txt
   \`\`\`

4. Start the FastAPI server:
   \`\`\`
   python main.py
   \`\`\`
   The server will run at http://localhost:8000

### Frontend Setup

1. Install the required dependencies:
   \`\`\`
   npm install --legacy-peer-deps
   \`\`\`

2. Start the development server:
   \`\`\`
   npm run dev
   \`\`\`
   The frontend will run at http://localhost:3000

## How It Works

1. The frontend captures frames from your webcam
2. Each frame is sent to the Python backend for object detection
3. The backend uses YOLOv5 to detect people and smartphones
4. Detection results are sent back to the frontend
5. The frontend renders the detection results on a canvas overlay

## Notes

- The Python backend uses YOLOv5 for object detection
- Only people and smartphones are detected (as in the original version)
- All processing happens on the server, reducing client-side resource usage
