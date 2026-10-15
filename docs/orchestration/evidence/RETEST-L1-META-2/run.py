import hashlib, json, os, subprocess, sys
from pathlib import Path
app=Path('/home/baptiste/itrocks/showtime'); out=Path(__file__).resolve().parent
owners=app/'node_modules/@itrocks'; recipe=owners/'property-select/docs/orchestration/environment/control.mjs'
env=dict(os.environ,PS_ENV_DIRECTORY='/tmp/property-select-RETEST-L1-META-2',PS_APP_PORT='13659',
 PS_METADATA_URL='http://127.0.0.1:13659',PS_FRAMEWORK_INITIALIZER='node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-L1-META-2/fixture.cjs',
 PS_PLAYWRIGHT_MODULE='/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')
groups={
 'core': [('list-build',['npm','--prefix',str(owners/'list'),'run','build']),('list-test',['npm','--prefix',str(owners/'list'),'test']),
 ('list-assertions',['node','--test','--test-isolation=none',*[str(p) for p in sorted((owners/'list/test').glob('*.test.mjs'))]]),
 ('framework-test',['npm','--prefix',str(owners/'framework'),'test']),
 ('metadata',['node','--test','--test-isolation=none',str(owners/'framework/test/property-select-metadata.test.mjs')]),
 ('projection-relative',['node','--test','node_modules/@itrocks/framework/test/property-select.test.mjs']),
 ('projection',['node','--test','--test-isolation=none',str(owners/'framework/test/property-select.test.mjs')]),
 ('selector-test',['npm','--prefix',str(owners/'property-select'),'test']),('application-build',['npm','run','build']),
 ('independent-list',['node',str(out/'list.mjs')])],
 'independent-list':[('independent-list',['node',str(out/'list.mjs')])],
 'review':[('review',['python3',str(out/'review.py')]),('public-cjs',['node',str(out/'public.cjs')])],
 'preflight':[('preflight',['python3',str(out/'preflight.py')])],
 'browser':[('browser',['node',str(out/'browser.mjs')])],
 'pack':[('framework-pack',['npm','--cache','/tmp/property-select-RETEST-L1-META-2-cache','pack','--dry-run','--offline','--ignore-scripts','--json',str(owners/'framework')]),
 ('selector-pack',['npm','--cache','/tmp/property-select-RETEST-L1-META-2-cache','pack','--dry-run','--offline','--ignore-scripts','--json',str(owners/'property-select')])],
 **{g:[(n,['node',str(recipe),op])] for g,n,op in [('start','start','app'),('status','owned-status','status'),('stop','stop','stop-app')]}}
records=[]
for name,argv in groups[sys.argv[1]]:
 result=subprocess.run(argv,cwd=app,env=env,capture_output=True)
 raw=result.stdout+result.stderr; (out/(name+'.txt')).write_bytes(raw)
 records.append(dict(name=name,argv=argv,cwd=str(app),environment={k:v for k,v in env.items() if k.startswith('PS_')},exit_code=result.returncode,output=name+'.txt',sha256=hashlib.sha256(raw).hexdigest()))
 print(name,result.returncode,flush=True)
(out/('commands-'+sys.argv[1]+'.json')).write_text(json.dumps(records,indent=2)+'\n')
sys.exit(int(any(x['exit_code'] for x in records)))
