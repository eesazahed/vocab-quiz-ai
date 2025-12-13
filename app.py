import os
import json
import uuid
import sqlite3
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
import requests

load_dotenv()

app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024

API_KEY = os.getenv("HACKAI_API_KEY")
BASE_URL = "https://ai.hackclub.com/proxy/v1/chat/completions"

DB_FILE = "quizzes.db"


def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        """CREATE TABLE IF NOT EXISTS quizzes (
               id TEXT PRIMARY KEY,
               quiz_json TEXT
           )"""
    )
    conn.commit()
    conn.close()


init_db()


def hackai(payload):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    res = requests.post(BASE_URL, headers=headers, json=payload)
    res.raise_for_status()
    return res.json()


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html", preloaded_quiz=None)


@app.route("/vocab", methods=["POST"])
def vocab():
    data = request.get_json()
    notes_text = data.get("notes_text")
    if not notes_text:
        return jsonify({"error": "Please enter some notes."}), 400

    if len(notes_text) > 50000:
        return jsonify({"error": "Notes text is too long. Maximum allowed is 50,000 characters."}), 400

    payload = {
        "model": "qwen/qwen3-32b",
        "messages": [
            {
                "role": "user",
                "content": (
                    "If there is a clear vocab list, extract it. Otherwise, if vocab terms are not clearly outlined,"
                    "extract the most important vocabulary terms and concise definitions "
                    "from the following text. Return a JSON array of objects "
                    "with keys 'term' and 'definition'. "
                    "Do not add extra commentary or text outside JSON. "
                    "Be consistent and deterministic.\n\n"
                    "Return JSON only as an array: [{\"term\": \"\", \"definition\": \"\"}].\n\n"
                    + notes_text
                ),
            }
        ],
        "stream": False,
    }

    result = hackai(payload)
    vocab_json = result["choices"][0]["message"]["content"]

    try:
        parsed = json.loads(vocab_json)
    except:
        parsed = {"raw_output": vocab_json}

    return jsonify({"vocab": parsed})


# @app.route("/save_quiz", methods=["POST"])
# def save_quiz():
    data = request.get_json()
    quiz = data.get("quiz")
    if not quiz:
        return jsonify({"error": "No quiz data"}), 400

    quiz_id = str(uuid.uuid4())
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO quizzes (id, quiz_json) VALUES (?, ?)",
              (quiz_id, json.dumps(quiz)))
    conn.commit()
    conn.close()

    return jsonify({"quiz_id": quiz_id})


@app.route("/quiz/<quiz_id>", methods=["GET"])
def load_quiz(quiz_id):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT quiz_json FROM quizzes WHERE id = ?", (quiz_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        return "Quiz not found", 404

    quiz_json = row[0]
    return render_template("index.html", preloaded_quiz=quiz_json)


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({"error": "Request too large"}), 413


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
