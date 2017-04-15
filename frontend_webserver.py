# this webserver is a dummy server
# for rapidly developing frontend
# without having to wait for backend.

from flask import Flask
import flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/json/<path:path>')
def send_json(path):
    return flask.send_from_directory('data', path)

@app.route('/check', methods=["POST"])
def grammarcheck():
    data = request.get_json()
    with open("grammarlog", "a") as f:
        f.write(repr(data) + "\n")
    return "[true]"

@app.route('/<path:path>')
def serve_page(path):
    return flask.send_from_directory('src', path)