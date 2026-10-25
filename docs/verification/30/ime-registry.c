/* Read-only compositor capability inventory; does not bind an input method. */
#include <stdio.h>
#include <string.h>
#include <wayland-client.h>
static void global(void *data, struct wl_registry *registry, uint32_t name,
                   const char *interface, uint32_t version) {
  (void)data; (void)registry; (void)name;
  if (strstr(interface, "input") || strstr(interface, "seat"))
    printf("%s %u\n", interface, version);
}
static void removed(void *data, struct wl_registry *registry, uint32_t name) {
  (void)data; (void)registry; (void)name;
}
int main(void) {
  struct wl_display *display=wl_display_connect(NULL);
  if (!display) return 1;
  struct wl_registry *registry=wl_display_get_registry(display);
  const struct wl_registry_listener listener={global, removed};
  wl_registry_add_listener(registry,&listener,NULL);
  int result=wl_display_roundtrip(display);
  wl_registry_destroy(registry); wl_display_disconnect(display);
  return result<0 ? 1 : 0;
}
