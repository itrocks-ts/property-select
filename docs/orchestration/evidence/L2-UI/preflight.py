import json
from pathlib import Path
import socket

root = Path('/tmp/property-select-L2-UI')
assert not (root / 'standalone.pid').exists()
assert not (root / 'standalone.owner.json').exists()
with socket.socket() as probe:
    probe.bind(('127.0.0.1', 13720))
print(json.dumps(dict(available=True, no_prior_ownership=True, port=13720)))
