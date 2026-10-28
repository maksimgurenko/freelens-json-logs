/* Verification-only minimal real Wayland IME. Uses a temporary Enter keyboard grab, no popup; never
 * records surrounding text. Protocol source/hash/commands are in ime-build.json. */
#include <stdio.h>
#include <string.h>
#include <poll.h>
#include <unistd.h>
#include <wayland-client.h>
#include <xkbcommon/xkbcommon.h>
#include <sys/mman.h>
#include "input-method-client.h"
static struct wl_seat *seat;
static struct zwp_input_method_manager_v2 *manager;
static struct zwp_input_method_v2 *method;
static unsigned serial, preedit_serial;
static int active, unavailable;
static struct zwp_input_method_keyboard_grab_v2 *grab;
static char enter_text[1024];
static struct xkb_context *context;
static struct xkb_keymap *map;
static struct xkb_state *keyboard;
static void keymap(void*p,struct zwp_input_method_keyboard_grab_v2*g,uint32_t f,int32_t fd,uint32_t size){
 (void)p;(void)g;(void)f;char *text=mmap(NULL,size,PROT_READ,MAP_PRIVATE,fd,0);
 if(text!=MAP_FAILED){if(keyboard)xkb_state_unref(keyboard);if(map)xkb_keymap_unref(map);
 map=xkb_keymap_new_from_string(context,text,XKB_KEYMAP_FORMAT_TEXT_V1,0);keyboard=xkb_state_new(map);munmap(text,size);}close(fd);
}
static void key(void*p,struct zwp_input_method_keyboard_grab_v2*g,uint32_t s,uint32_t t,uint32_t k,uint32_t state){
 (void)p;(void)s;(void)t;
 xkb_keysym_t sym=keyboard?xkb_state_key_get_one_sym(keyboard,k+8):0;
 printf("{\"grabKey\":%u,\"keysym\":%u,\"state\":%u}\n",k,sym,state);
 if(sym==XKB_KEY_Return&&state==1){zwp_input_method_v2_set_preedit_string(method,"",0,0);zwp_input_method_v2_commit_string(method,enter_text);zwp_input_method_v2_commit(method,serial);}
 if(sym==XKB_KEY_Return&&state==0){zwp_input_method_keyboard_grab_v2_destroy(g);grab=NULL;}
}
static void modifiers(void*p,struct zwp_input_method_keyboard_grab_v2*g,uint32_t s,uint32_t d,uint32_t l,uint32_t locked,uint32_t group){(void)p;(void)g;(void)s;(void)d;(void)l;(void)locked;(void)group;}
static void repeat(void*p,struct zwp_input_method_keyboard_grab_v2*g,int32_t rate,int32_t delay){(void)p;(void)g;(void)rate;(void)delay;}
static const struct zwp_input_method_keyboard_grab_v2_listener keys={keymap,key,modifiers,repeat};
static void activate(void *p,struct zwp_input_method_v2 *m){(void)p;(void)m;active=1;}
static void deactivate(void *p,struct zwp_input_method_v2 *m){(void)p;(void)m;active=0;}
static void surrounding(void *p,struct zwp_input_method_v2 *m,const char *s,uint32_t c,uint32_t a){(void)p;(void)m;(void)s;(void)c;(void)a;}
static void cause(void *p,struct zwp_input_method_v2 *m,uint32_t c){(void)p;(void)m;(void)c;}
static void content(void *p,struct zwp_input_method_v2 *m,uint32_t h,uint32_t u){(void)p;(void)m;(void)h;(void)u;}
static void done(void *p,struct zwp_input_method_v2 *m){(void)p;(void)m;serial++;}
static void absent(void *p,struct zwp_input_method_v2 *m){(void)p;(void)m;unavailable=1;}
static const struct zwp_input_method_v2_listener listener={activate,deactivate,surrounding,cause,content,done,absent};
static void global(void *p,struct wl_registry *r,uint32_t n,const char *i,uint32_t v){
 (void)p;
 if(!strcmp(i,"wl_seat"))seat=wl_registry_bind(r,n,&wl_seat_interface,v<5?v:5);
 if(!strcmp(i,"zwp_input_method_manager_v2"))manager=wl_registry_bind(r,n,&zwp_input_method_manager_v2_interface,1);
}
static void removed(void *p,struct wl_registry *r,uint32_t n){(void)p;(void)r;(void)n;}
int main(void){
 context=xkb_context_new(0);
 setvbuf(stdout,NULL,_IOLBF,0);
 struct wl_display *d=wl_display_connect(NULL);if(!d)return 1;
 struct wl_registry *r=wl_display_get_registry(d);const struct wl_registry_listener gl={global,removed};
 wl_registry_add_listener(r,&gl,NULL);if(wl_display_roundtrip(d)<0||!seat||!manager)return 2;
 method=zwp_input_method_manager_v2_get_input_method(manager,seat);zwp_input_method_v2_add_listener(method,&listener,NULL);
 wl_display_roundtrip(d);printf("{\"ready\":true,\"active\":%s,\"unavailable\":%s}\n",active?"true":"false",unavailable?"true":"false");
 int quit=0;
 while(!quit){
  while(wl_display_prepare_read(d)!=0)if(wl_display_dispatch_pending(d)<0){quit=1;break;}
  wl_display_flush(d);struct pollfd fds[]={{wl_display_get_fd(d),POLLIN,0},{STDIN_FILENO,POLLIN,0}};
  int result=poll(fds,2,50);
  if(result<0){wl_display_cancel_read(d);break;}
  if(fds[0].revents&POLLIN){if(wl_display_read_events(d)<0)break;}else wl_display_cancel_read(d);
  if(wl_display_dispatch_pending(d)<0)break;
  if(fds[1].revents&(POLLIN|POLLHUP)){
   char line[2048];if(!fgets(line,sizeof line,stdin))break;
   if(line[0]=='Q')break;
   int ok=1;
   char *text=line+1;if(*text==' ')text++;text[strcspn(text,"\n")]=0;
   if(line[0]=='P'&&active){preedit_serial=serial;zwp_input_method_v2_set_preedit_string(method,text,strlen(text),strlen(text));zwp_input_method_v2_commit(method,serial);}
   else if(line[0]=='C'&&active){zwp_input_method_v2_set_preedit_string(method,"",0,0);zwp_input_method_v2_commit_string(method,text);zwp_input_method_v2_commit(method,serial);}
   else if(line[0]=='L'){zwp_input_method_v2_set_preedit_string(method,"",0,0);zwp_input_method_v2_commit_string(method,text);zwp_input_method_v2_commit(method,preedit_serial);printf("{\"lateSerial\":%u,\"currentSerial\":%u}\n",preedit_serial,serial);}
   else if(line[0]=='X'&&active){zwp_input_method_v2_set_preedit_string(method,"",0,0);zwp_input_method_v2_commit(method,serial);}
   else if(line[0]=='E'&&active&&!grab){snprintf(enter_text,sizeof enter_text,"%s",text);grab=zwp_input_method_v2_grab_keyboard(method);zwp_input_method_keyboard_grab_v2_add_listener(grab,&keys,NULL);}
   else if(line[0]!='S')ok=0;
   wl_display_flush(d);
   printf("{\"ok\":%s,\"active\":%s,\"serial\":%u,\"unavailable\":%s}\n",ok?"true":"false",active?"true":"false",serial,unavailable?"true":"false");
  }
 }
 if(active){zwp_input_method_v2_set_preedit_string(method,"",0,0);zwp_input_method_v2_commit(method,serial);}
 if(grab)zwp_input_method_keyboard_grab_v2_destroy(grab);
 zwp_input_method_v2_destroy(method);zwp_input_method_manager_v2_destroy(manager);wl_seat_release(seat);wl_registry_destroy(r);wl_display_flush(d);wl_display_disconnect(d);if(keyboard)xkb_state_unref(keyboard);if(map)xkb_keymap_unref(map);xkb_context_unref(context);return 0;
}
