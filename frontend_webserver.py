# this webserver is a dummy server
# for rapidly developing frontend
# without having to wait for backend.

import flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/json/<path:path>')
def send_json(path):
    return send_from_directory('json', path)