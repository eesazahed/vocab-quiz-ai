from flask import Flask, render_template, request, redirect, url_for
from cs50 import SQL
import os


app = Flask(__name__)


with app.app_context():
    @app.errorhandler(404)
    def handle_404(e):
        return render_template('custom404.html')

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/commit')
    def commit():
        output = os.popen('git log -1 --pretty=format:"%h|%s|%cr"').read()
        commit_hash, description, time = output.strip().split('|')
        return ({
            'hash': commit_hash,
            'description': description,
            'time': time
        })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
