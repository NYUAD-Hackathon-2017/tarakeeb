# this webserver is a dummy server
# for rapidly developing frontend
# without having to wait for backend.

from flask import Flask
import flask
import json

app = Flask(__name__)

with open("data/examplegrammar.json") as f:
    grammarrules = json.load(f)

def equivarray(a, b):
    if len(a) != len(b):
        return False
    for i in range(len(a)):
        if a[i] != b[i]:
            return False
    return True

@app.route('/')
def hello_world():
    return flask.send_from_directory('src', "main.html")

@app.route('/json/<path:path>')
def send_json(path):
    return flask.send_from_directory('data', path)

@app.route('/check', methods=["POST"])
def grammarcheck():
    t = flask.request.data.decode("utf-8")
    data = json.loads(t)
    # with open("grammarlog", "a") as f:
    #     grammarlog
    for grammar in grammarrules:
        if equivarray(grammar, data):
            return "[true]"
    return "[false]"

@app.route('/<path:path>')
def serve_page(path):
    return flask.send_from_directory('src', path)

@app.route('/res/<path:path>')
def serve_resource(path):
    return flask.send_from_directory('res', path)