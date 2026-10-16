import hashlib
import json
import subprocess
from pathlib import Path

application=Path('/home/baptiste/itrocks/showtime')
root=application/'node_modules/@itrocks'
tracking=root/'property-select/docs/orchestration'
evidence=tracking/'evidence/FIX-L3-1'
bases={'reflect':'8e42bd2009a6ba4e708ae20ca519fc44681ebbb7',
	'reflect-path':'7d1534eece60d23339f2ad8355d49c8d5074c08d',
	'framework':'7a302cd606ff007276038ada4d12fc0bd2161d54',
	'property-select':'1ddb156fe92edbb7bbae8a43451bbcc47d4eff9d'}
def git(repo,*args):
	return subprocess.check_output(['git','-C',str(repo),*args],text=True).strip()
def strings(value):
	if isinstance(value,str):yield value
	elif isinstance(value,dict):
		for child in value.values():yield from strings(child)
	elif isinstance(value,list):
		for child in value:yield from strings(child)
review={'status':'PASS','owners':{},'solid':{
	'relation_classification':'reflect targetFacts retains property-type TypeType for converters',
	'path_contract':'reflect-path owns runtime multiplicity and native Date typed-path exclusion',
	'metadata_transport':'framework maps known terminal context to existing MetadataError/400',
	'selector':'runtime source unchanged; no Date exception, fixture filter or swallowed error',
	'substitution':'existing custom/deferred metadata, public ports and inverse/cardinality suites pass'}}
for owner,base in bases.items():
	repo=root/owner
	package=json.loads((repo/'package.json').read_text())
	inventory=json.loads((evidence/(owner+'-files.json')).read_text())[0]
	assert inventory['name']==package['name']
	assert inventory['version']==package['version']
	files={file['path'] for file in inventory['files']}
	exports=sorted(set(strings(package['exports'])))
	for export in exports:
		relative=export.removeprefix('./')
		assert (repo/relative).is_file(),(owner,export)
		assert relative in files,(owner,export,'not packaged')
	assert not any(file.startswith('test/') for file in files)
	git(repo,'diff','--check')
	changed=git(repo,'diff','--name-only',base,'HEAD').splitlines() if owner!='property-select' else []
	snapshot={file:hashlib.sha256((repo/file).read_bytes()).hexdigest() for file in changed}
	if owner!='property-select':assert git(repo,'status','--porcelain')==''
	review['owners'][owner]={'base_sha':base,'sha':git(repo,'rev-parse','HEAD'),
		'version':package['version'],'export_targets':exports,'packaged_files':len(files),'source_snapshot_sha256':snapshot}
assert 'target === Date' in (root/'reflect/cjs/relation-fact.js').read_text()
assert 'target === Date' in (root/'reflect/esm/relation-fact.js').read_text()
assert 'T extends Date ? never' in (root/'reflect-path/cjs/types.d.ts').read_text()
assert "new MetadataError('invalid-path')" in (root/'framework/cjs/property-select-provider.js').read_text()
assert git(root/'framework','diff','d5024b5ac28c826ca01d576c0f0e3c6911279d53','HEAD','--','src','test')==''
assert git(root/'property-select','diff',bases['property-select'],'--','src','test')==''
review['generated_files']='PASS: changed source present in emitted CJS/ESM/declarations; public targets packaged'
review['framework_documentation_followups']='Runtime src/test diff is empty after source commit d5024b5'
assert git(application,'rev-parse','HEAD')=='d7ca948292e28c248bdcc0283724e47c2a82bba4'
assert git(application,'status','--porcelain').splitlines()==[
	'AD audit-itrocks-dependencies.json','AD audit-itrocks-dependencies.txt']
blobs={'audit-itrocks-dependencies.json':'ff4dc939cce17af3aa7c14d8063034c5cc85b867',
	'audit-itrocks-dependencies.txt':'de960a87ea9b4f6eb1cece85ab32596baef11fcd'}
for file,blob in blobs.items():
	assert git(application,'rev-parse',':'+file)==blob
	assert not (application/file).exists()
review['application']={'sha':git(application,'rev-parse','HEAD'),'status':git(application,'status','--porcelain'),
	'staged_blobs':blobs,'working_files_absent':True}
for directory,names in [('/tmp/property-select-FIX-L3-1',['app','standalone']),
	('/tmp/property-select-FIX-L3-1-direct',['app'])]:
	for name in names:
		assert not (Path(directory)/(name+'.pid')).exists()
		assert not (Path(directory)/(name+'.owner.json')).exists()
review['owned_process_records']='PASS: all author app/standalone PID and owner files removed by controller'
for filename in ['reports/FIX-L3-1.md','tasks/FIX-L3-1.md','tasks/RETEST-L3-1.md',
	'environment/checks/FIX-L3-1-browser.mjs','environment/checks/FIX-L3-1-date.mjs']:
	assert all(len(line.replace('\t','  '))<=120 for line in (tracking/filename).read_text().splitlines()),filename
review['documentation_and_code_widths']='PASS for task additions; existing README badges remain unchanged'
(evidence/'review.json').write_text(json.dumps(review,indent='\t')+'\n')
print(json.dumps({'status':'PASS','versions':{owner:value['version'] for owner,value in review['owners'].items()}}))
