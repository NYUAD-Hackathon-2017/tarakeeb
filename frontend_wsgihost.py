from gevent.wsgi import WSGIServer
from frontend_webserver import app

http_server = WSGIServer(('', 5000), app)
http_server.serve_forever()