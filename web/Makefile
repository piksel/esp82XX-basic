include ../user.cfg
include ../esp82xx/common.mf

.PHONY : all clean push
all : execute_reflash push

CC = gcc
CFLAGS = $(OPTS)

mfsmaker : mfsmaker.c
pushtodev : pushtodev.c
execute_reflash : execute_reflash.c md5.c

mfsmaker pushtodev execute_reflash :
	$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS) -lusb-1.0

js/sections.js :
	python sections.py

page/app.css.gz :
	cat $(wildcard css/*) | gzip -9 > page/app.css.gz

page/app.js.gz : js/sections.js
	cat $(wildcard js/*) | gzip -9 > page/app.js.gz

page.mpfs : mfsmaker $(wildcard page/*) Makefile page/app.css.gz page/app.js.gz
	$(RM) -r tmp
	$(CP) -r page tmp
	# Inception level over 9000 for poor man's template substitution
	$(info bla$ ${\n} blubb)
	$(foreach p, $(filter PAGE_%,$(.VARIABLES)) $(filter PROJECT_%,$(.VARIABLES)) VERSSTR, \
		sed -i "s/{{$(p)}}/$$(echo -n '$($(p))' | sed -e 's/[\/&"]/\\&/g')/" tmp/index.html && \
	) true
	./mfsmaker tmp page.mpfs

push : pushtodev page.mpfs
	./pushtodev $(IP) $(PAGE_OFFSET) page.mpfs

usbpush : pushtodev page.mpfs
	./pushtodev USB $(PAGE_OFFSET) page.mpfs

clean :
	$(RM) mfsmaker page.mpfs pushtodev execute_reflash tmp/* page/app.js.gz page/app.css.gz js/sections.js
