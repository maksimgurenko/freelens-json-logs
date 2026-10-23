import pathlib,subprocess,os,json,hashlib
root=pathlib.Path(__file__).resolve().parents[3]; ev=root/'docs/verification/19'; clean=root/'.scratch/readable-logs/19/clean-0.1.20'
assert not clean.exists();clean.mkdir()
rev=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
archive=subprocess.run(['git','archive','HEAD'],check=True,stdout=subprocess.PIPE).stdout
subprocess.run(['tar','-xf','-','-C',str(clean)],input=archive,check=True)
node=root/'.scratch/readable-logs/toolchain/node_modules/node/bin/node';npm=root/'.scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js'
env=os.environ.copy();env['PATH']=str(node.parent)+':'+env['PATH']
commands=[('toolchain',[str(node),'--version']),('npm-version',[str(node),str(npm),'--version']),('locked-install',[str(node),str(npm),'ci','--ignore-scripts','--no-audit','--no-fund']),('typecheck',[str(node),str(npm),'run','typecheck']),('tests',[str(node),str(npm),'test']),('package',[str(node),str(npm),'run','package']),('package-check',[str(node),str(npm),'run','check:package'])]
records=[]
for label,cmd in commands:
 result=subprocess.run(cmd,cwd=clean,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 (ev/(label+'.txt')).write_text('$ '+' '.join(cmd)+'\n'+result.stdout)
 records.append({'check':label,'command':cmd,'exitCode':result.returncode});assert result.returncode==0,result.stdout
pkg=clean/'dist/freelens-readable-logs-0.1.20.tgz';sha=hashlib.sha256(pkg.read_bytes()).hexdigest()
(ev/'clean-build.json').write_text(json.dumps({'revision':rev,'method':'git archive HEAD into initially absent directory; only tracked production sources','directory':str(clean),'commands':records,'tarballSha256':sha},indent=2)+'\n')
(ev/'tarball-files.txt').write_text(subprocess.check_output(['tar','-tzf',str(pkg)],text=True))
print(rev,sha);print((ev/'tests.txt').read_text()[-500:])
