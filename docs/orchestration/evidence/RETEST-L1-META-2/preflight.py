import json,socket,subprocess
from pathlib import Path
out=Path(__file__).resolve().parent; directory=Path('/tmp/property-select-RETEST-L1-META-2')
assert not (directory/'app.pid').exists() and not (directory/'app.owner.json').exists()
with socket.socket() as s: s.bind(('127.0.0.1',13659))
result=subprocess.run(['mysqladmin','--no-defaults','--socket=/tmp/showtime-property-select-env/mysql.sock','-u','root','ping'],capture_output=True,text=True)
assert result.returncode==0,result.stderr
directory.mkdir(exist_ok=True)
sock=directory/'mysql.sock'
if not sock.exists(): sock.symlink_to('/tmp/showtime-property-select-env/mysql.sock')
print(json.dumps({'port':13659,'available':True,'no_prior_ownership':True,'mysql':result.stdout.strip(),'environment':str(directory)},indent=2))
