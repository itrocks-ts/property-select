import hashlib,json,re,subprocess
from pathlib import Path
app=Path('/home/baptiste/itrocks/showtime');owners=app/'node_modules/@itrocks';out=Path(__file__).resolve().parent
report={}
def git(root,*args):return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
for name,expected,version in [('list','033246001183120bbf3a3f0191d061fe960dcf56','0.8.2'),('framework','3566dd9352a6ce25df58e6d365f50481e2787eca','0.9.3')]:
 assert git(owners/name,'rev-parse','HEAD')==expected
 assert not git(owners/name,'status','--porcelain')
 assert json.loads((owners/name/'package.json').read_text())['version']==version
report['clean_product_checkpoints']=True
assert git(app,'rev-parse','HEAD')=='d7ca948292e28c248bdcc0283724e47c2a82bba4'
assert git(app,'status','--short').splitlines()==['AD audit-itrocks-dependencies.json','AD audit-itrocks-dependencies.txt']
for name,blob in [('audit-itrocks-dependencies.json','ff4dc939cce17af3aa7c14d8063034c5cc85b867'),('audit-itrocks-dependencies.txt','de960a87ea9b4f6eb1cece85ab32596baef11fcd')]:
 assert not (app/name).exists();assert blob in git(app,'ls-files','--stage',name)
report['showtime_and_original_index_preserved']=True
changed=git(owners/'list','diff','--name-only','7191d22217a7d087c197134bc09226a34d05fc60..HEAD').splitlines()
assert changed==['package.json','src/list.ts','test/columns.test.mjs']
report['exact_corrective_files']=changed
source=(owners/'list/src/list.ts').read_text();generated=(owners/'list/cjs/list.js').read_text()
assert 'columns !== undefined' in source and 'columns !== undefined' in generated
for name in ['framework','property-select']:
 inventory=json.JSONDecoder().raw_decode((out/('framework-pack.txt' if name=='framework' else 'selector-pack.txt')).read_text())[0][0]
 assert inventory['name']=='@itrocks/'+name
 paths={x['path'] for x in inventory['files']}
 expected={'cjs/property-select.js','property-select-metadata.js','property-select-metadata.d.ts','docs/property-select.md'} if name=='framework' else {'cjs/property-select.js','property-select.js','property-select.d.ts'}
 assert expected<=paths
 assert not any(x.startswith(('src/','test/')) for x in paths)
 manifest=json.loads((owners/name/'package.json').read_text())
 for value in manifest['exports'].values():
  for target in value.values() if isinstance(value,dict) else [value]: assert (owners/name/target).is_file(),target
 report[name]={'public_files':sorted(expected),'packed_files':len(paths),'version':manifest['version']}
selector_manifest=json.loads((owners/'property-select/package.json').read_text())
assert not selector_manifest.get('dependencies')
client=(owners/'framework/property-select-metadata.js').read_text()
assert not re.search(r'node:|require\(|from ',client)
assert 'property-select-metadata.js' in (owners/'framework/app.js').read_text()
for file in (owners/'property-select/src').glob('*.ts'):
 assert not re.search(r'from [\'\"](?:@itrocks/|node:)',file.read_text()),file
metadata_sources=['property-select.ts','property-select-provider.ts','property-select-actions.ts','front/property-select-metadata.ts']
framework_manifest=json.loads((owners/'framework/package.json').read_text())
for name in metadata_sources:
 content=(owners/'framework/src'/name).read_text()
 for imported in re.findall(r'from [\'\"](@itrocks/[^\'\"]+)',content):
  assert '/'.join(imported.split('/')[:2]) in framework_manifest['dependencies'],imported
 assert not re.search(r'dataSource|\.search\(|\.select\(|ReflectProperty\.value',content),name
report['dependency_direction_and_business_read_review']=True
report['metadata_artifacts']={str(file.relative_to(owners/'framework')):hashlib.sha256(file.read_bytes()).hexdigest() for file in [owners/'framework/cjs/property-select.js',owners/'framework/cjs/property-select-provider.js',owners/'framework/cjs/property-select-actions.js',owners/'framework/property-select-metadata.js',owners/'framework/property-select-metadata.d.ts']}
directory=Path('/tmp/property-select-RETEST-L1-META-2')
if (directory/'app.owner.json').exists():
 owner=json.loads((directory/'app.owner.json').read_text())
 log=directory/'app.log'
 (out/'environment.json').write_text(json.dumps({'owner':owner,'log':str(log),'log_sha256':hashlib.sha256(log.read_bytes()).hexdigest(),'initializer':'FIX-L1-META-2/fixture.cjs','initializer_sha256':hashlib.sha256((out.parent/'FIX-L1-META-2/fixture.cjs').read_bytes()).hexdigest()},indent=2)+'\n')
else:
 assert not (directory/'app.pid').exists()
 report['owned_app_stopped']=True
reference=json.loads((out.parent/'FIX-L1-META-2/review.json').read_text())['unchanged_metadata_artifacts']
assert report['metadata_artifacts']==reference
report['metadata_artifacts_unchanged']=True
for name in ['framework','list','property-select']:
 assert not git(owners/name,'ls-files','*lock*')
report['no_tracked_locks']=True
report['status']='PASS'
(out/'review.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
