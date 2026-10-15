from pathlib import Path
import socket,json,subprocess
p=Path('node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-L1-META-2')
d=Path('/tmp/property-select-FIX-L1-META-2')
assert not d.exists()
s=socket.socket(); s.bind(('127.0.0.1',13649)); s.close()
d.mkdir(); (d/'mysql.sock').symlink_to('/tmp/showtime-property-select-env/mysql.sock')
r=subprocess.run(['mysqladmin','--no-defaults','--socket=/tmp/showtime-property-select-env/mysql.sock','-u','root','ping'],capture_output=True,text=True)
(p/'preflight.json').write_text(json.dumps({'directory':str(d),'port':13649,'bind':'PASS','database_exit':r.returncode,'database':r.stdout+r.stderr},indent=2)+'\n')
print(r.stdout+r.stderr)
