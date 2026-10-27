/* Test-only wlroots virtual pointer. Connects solely through the private env.
 * Coordinates refer to its one output. No evdev/uinput or global input path. */
#include <wayland-client.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <time.h>
#include <unistd.h>
#include "virtual-pointer-client.h"
static struct zwlr_virtual_pointer_manager_v1 *manager;
static void global(void *data, struct wl_registry *registry, uint32_t name,
                   const char *interface, uint32_t version) {
  (void)data;
  if (!strcmp(interface,"zwlr_virtual_pointer_manager_v1"))
    manager=wl_registry_bind(registry,name,&zwlr_virtual_pointer_manager_v1_interface,version<2?version:2);
}
static void removed(void *data, struct wl_registry *registry, uint32_t name) {
  (void)data;(void)registry;(void)name;
}
int main(int argc,char **argv) {
  if(argc<4)return 2;
  struct wl_display *display=wl_display_connect(NULL);if(!display)return 3;
  struct wl_registry *registry=wl_display_get_registry(display);
  const struct wl_registry_listener listener={global,removed};
  wl_registry_add_listener(registry,&listener,NULL);
  if(wl_display_roundtrip(display)<0||!manager)return 4;
  struct zwlr_virtual_pointer_v1 *pointer=zwlr_virtual_pointer_manager_v1_create_virtual_pointer(manager,NULL);
  struct timespec now;clock_gettime(CLOCK_MONOTONIC,&now);
  uint32_t ms=(uint32_t)(now.tv_sec*1000+now.tv_nsec/1000000);
  zwlr_virtual_pointer_v1_motion_absolute(pointer,ms,atoi(argv[2]),atoi(argv[3]),1280,720);
  zwlr_virtual_pointer_v1_frame(pointer);
  wl_display_roundtrip(display);
  usleep(100000);
  if(!strcmp(argv[1],"click")) {
    zwlr_virtual_pointer_v1_button(pointer,ms,272,1);
    zwlr_virtual_pointer_v1_frame(pointer);wl_display_roundtrip(display);
    zwlr_virtual_pointer_v1_button(pointer,ms+1,272,0);
  } else if(!strcmp(argv[1],"drag")&&argc==6) {
    zwlr_virtual_pointer_v1_button(pointer,ms,272,1);
    zwlr_virtual_pointer_v1_frame(pointer);wl_display_roundtrip(display);
    for(int step=1;step<=12;step++) {
      int x=atoi(argv[2])+(atoi(argv[4])-atoi(argv[2]))*step/12;
      int y=atoi(argv[3])+(atoi(argv[5])-atoi(argv[3]))*step/12;
      zwlr_virtual_pointer_v1_motion_absolute(pointer,ms+step,x,y,1280,720);
      zwlr_virtual_pointer_v1_frame(pointer);wl_display_roundtrip(display);
    }
    zwlr_virtual_pointer_v1_button(pointer,ms+13,272,0);
  } else if(!strcmp(argv[1],"scroll")&&argc==5) {
    zwlr_virtual_pointer_v1_axis_source(pointer,WL_POINTER_AXIS_SOURCE_WHEEL);
    zwlr_virtual_pointer_v1_axis_discrete(pointer,ms,WL_POINTER_AXIS_VERTICAL_SCROLL,
      wl_fixed_from_int(atoi(argv[4])*15),atoi(argv[4]));
  } else if(strcmp(argv[1],"move"))return 5;
  zwlr_virtual_pointer_v1_frame(pointer);wl_display_roundtrip(display);
  usleep(100000);
  zwlr_virtual_pointer_v1_destroy(pointer);
  zwlr_virtual_pointer_manager_v1_destroy(manager);
  wl_registry_destroy(registry);wl_display_flush(display);wl_display_disconnect(display);
  return 0;
}
