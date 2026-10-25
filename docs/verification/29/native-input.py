"""Owned temporary Linux uinput pointer/keyboard. JSON commands over stdin.
No physical hardware claim. Destroys only its own device and releases its keys.
Ioctl/struct constants follow installed linux/uinput.h and linux/input-event-codes.h.
"""
import fcntl,json,os,struct,subprocess,sys,time
fd=os.open('/dev/uinput',os.O_WRONLY|os.O_NONBLOCK)
keys=[25,19,26,27,29,31,42,28,57,15,46,47,30,33,34,107,108,125,56,100,272]
held=set()
def event(typ,code,value):
 t=time.time();sec=int(t);os.write(fd,struct.pack('llHHi',sec,int((t-sec)*1000000),typ,code,value))
def sync():event(0,0,0)
def key(code,value):event(1,code,value);sync();held.add(code) if value else held.discard(code)
def cursor():return json.loads(subprocess.check_output(['hyprctl','cursorpos','-j'],text=True))
def move(x,y):
 for _ in range(18):
  p=cursor();dx=x-p['x'];dy=y-p['y']
  if abs(dx)<=1 and abs(dy)<=1:return p
  # Closed-loop positioning tolerates the compositor's per-device acceleration.
  def step(n):return int(round(n*.6)) or (1 if n>0 else -1 if n<0 else 0)
  event(2,0,step(dx));event(2,1,step(dy));sync();time.sleep(.008)
 p=cursor()
 if abs(x-p['x'])>2 or abs(y-p['y'])>2:raise RuntimeError('Native pointer did not reach target')
 return p
try:
 for typ in [1,2]:fcntl.ioctl(fd,0x40045564,typ)
 for code in keys:fcntl.ioctl(fd,0x40045565,code)
 for code in [0,1]:fcntl.ioctl(fd,0x40045566,code)
 fcntl.ioctl(fd,0x405c5503,struct.pack('HHHH80sI',3,1,1,1,b'readable-logs-ticket-29-key-verification',0))
 fcntl.ioctl(fd,0x5501);time.sleep(.35)
 print(json.dumps({'ready':True,'device':'readable-logs-ticket-29-key-verification'}),flush=True)
 for line in sys.stdin:
  try:
   cmd=json.loads(line);op=cmd['op']
   if op=='move':result=move(cmd['x'],cmd['y'])
   elif op=='button':key(272,cmd['down']);result={}
   elif op=='key':key(cmd['code'],cmd['down']);result={}
   elif op=='close':break
   else:raise ValueError(op)
   print(json.dumps({'ok':True,'result':result}),flush=True)
  except Exception as error:print(json.dumps({'ok':False,'error':str(error)}),flush=True)
finally:
 for code in list(held):key(code,0)
 try:fcntl.ioctl(fd,0x5502)
 except OSError:pass
 os.close(fd)
