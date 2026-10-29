# Independent audit of captured verdicts; an older false pass must fail.
import gzip,json,sys,pathlib
p=pathlib.Path(sys.argv[1]);s=json.loads(gzip.decompress(p.read_bytes()) if p.suffix=='.gz' else p.read_text());violations=[]
for bound in s['samples']:
 first=bound['cycles'][0]
 for sample in bound['cycles']:
  g={'nodes':sample['dom']['nodes']-first['dom']['nodes'],'listeners':sample['dom']['jsEventListeners']-first['dom']['jsEventListeners'],'documents':sample['dom']['documents']-first['dom']['documents'],'rendererHeap':sample['cleanup']['memory']['heapUsed']-first['cleanup']['memory']['heapUsed']}
  if g['nodes']>128 or g['listeners']>8 or g['documents']>0 or g['rendererHeap']>8*1024*1024:violations.append({'bound':bound['name'],'cycle':sample['cycle'],'growth':g})
expected=not violations
print(json.dumps({'reportedResourcePass':s['resourcePass'],'expectedEverySamplePass':expected,'violations':violations},indent=2))
assert s['resourcePass']==expected,'Host resource verdict ignored a failed measured sample'
