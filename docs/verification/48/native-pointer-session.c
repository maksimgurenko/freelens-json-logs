/* Verification-only persistent wlroots virtual pointer. The caller proves the
 * private socket and supplies its actual output size. No kernel input device. */
#include <wayland-client.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <time.h>
#include <unistd.h>
#include "virtual-pointer-client.h"
static struct zwlr_virtual_pointer_manager_v1 *manager;
static struct wl_seat *seat;
static struct wl_output *output;
static void global(void *d,struct wl_registry *r,uint32_t n,const char *i,uint32_t v){
 (void)d;
 if(!strcmp(i,"zwlr_virtual_pointer_manager_v1"))manager=wl_registry_bind(r,n,&zwlr_virtual_pointer_manager_v1_interface,v<2?v:2);
 if(!strcmp(i,"wl_seat"))seat=wl_registry_bind(r,n,&wl_seat_interface,1);
 if(!strcmp(i,"wl_output")&&!output)output=wl_registry_bind(r,n,&wl_output_interface,1);
}
static void removed(void*d,struct wl_registry*r,uint32_t n){(void)d;(void)r;(void)n;}
static uint32_t now(void){struct timespec t;clock_gettime(CLOCK_MONOTONIC,&t);return (uint32_t)(t.tv_sec*1000+t.tv_nsec/1000000);}
int main(int argc,char **argv){
 if(argc!=3)return 2;
 int width=atoi(argv[1]),height=atoi(argv[2]);if(width<=0||height<=0)return 2;
 struct wl_display*d=wl_display_connect(NULL);if(!d)return 3;
 struct wl_registry*r=wl_display_get_registry(d);const struct wl_registry_listener l={global,removed};wl_registry_add_listener(r,&l,NULL);
 if(wl_display_roundtrip(d)<0||!manager||!seat||!output)return 4;
 struct zwlr_virtual_pointer_v1*p=zwlr_virtual_pointer_manager_v1_create_virtual_pointer_with_output(manager,seat,output);
 wl_display_roundtrip(d);setvbuf(stdout,NULL,_IOLBF,0);puts("ready");
 char line[200],op[20];int x,y,ex,ey;
 while(fgets(line,sizeof line,stdin)){
  if(line[0]=='Q')break;
  int n=sscanf(line,"%19s %d %d %d %d",op,&x,&y,&ex,&ey);if(n<3)return 5;
  zwlr_virtual_pointer_v1_motion_absolute(p,now(),x,y,width,height);zwlr_virtual_pointer_v1_frame(p);wl_display_roundtrip(d);usleep(80000);
  if(!strcmp(op,"click")||!strcmp(op,"drag")){
   zwlr_virtual_pointer_v1_button(p,now(),272,1);zwlr_virtual_pointer_v1_frame(p);wl_display_roundtrip(d);usleep(60000);
   if(!strcmp(op,"drag")&&n==5)for(int s=1;s<=24;s++){
    zwlr_virtual_pointer_v1_motion_absolute(p,now(),x+(ex-x)*s/24,y+(ey-y)*s/24,width,height);zwlr_virtual_pointer_v1_frame(p);wl_display_roundtrip(d);usleep(12000);
   }
   zwlr_virtual_pointer_v1_button(p,now(),272,0);
  }else if(!strcmp(op,"scroll")&&n==4){
   zwlr_virtual_pointer_v1_axis_source(p,WL_POINTER_AXIS_SOURCE_WHEEL);
   zwlr_virtual_pointer_v1_axis_discrete(p,now(),WL_POINTER_AXIS_VERTICAL_SCROLL,wl_fixed_from_int(ex*15),ex);
  }else if(strcmp(op,"move"))return 5;
  zwlr_virtual_pointer_v1_frame(p);wl_display_roundtrip(d);puts("done");
 }
 zwlr_virtual_pointer_v1_destroy(p);zwlr_virtual_pointer_manager_v1_destroy(manager);wl_output_destroy(output);wl_seat_destroy(seat);wl_registry_destroy(r);wl_display_flush(d);wl_display_disconnect(d);return 0;
}
