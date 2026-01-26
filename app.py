import os
import requests
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_KEY")
BASE_URL = "https://ai.hackclub.com/proxy/v1/chat/completions"

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/vocab", methods=["POST"])
def vocab():
    data = request.get_json()
    notes = data.get("notes")

    if not notes:
        return jsonify({"error": "No notes provided"}), 400

    payload = {
        "model": "qwen/qwen3-32b",
        "messages": [
            {
                "role": "user",
                "content": (
                    "Extract the most important vocabulary terms and concise definitions. "
                    "Return JSON only as an array of objects with keys 'term' and 'definition'.\n\n"
                    + notes
                )
            }
        ],
        "stream": False
    }

    res = requests.post(
        BASE_URL,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json=payload
    )

    return jsonify(res.json())


if __name__ == "__main__":
    app.run(debug=True)
