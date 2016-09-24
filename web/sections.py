#!/usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import print_function

PATH_SECTIONS = "sections/"
PATH_OUTPUT_JS = "js/sections.js"
PATH_OUTPUT_CSS = "css/sections.css"

from glob import glob
import json, sys, os
from os.path import isfile



def merge():

    init_sections = ""
    js_body = ""
    css_body = ""

    print("Merging sections: ")

    for section_path in glob(PATH_SECTIONS+'*/'):
        fh_section = open(section_path + 'section.json', 'r')
        section = json.load(fh_section)
        fh_section.close()

        print(' - ' + section["title"] + '... ', end="")

        content = '""'
        fn_content = section_path + 'content.html'
        if isfile(fn_content):
            fh_content = open(fn_content, 'r')
            content = json.dumps(fh_content.read())

        init = ""
        fn_init = section_path + 'init.js'
        if isfile(fn_init):
            fh_init = open(fn_init, 'r')
            init = fh_init.read()

        activated = ""
        fn_activated = section_path + 'activated.js'
        if isfile(fn_activated):
            fh_activated = open(fn_activated, 'r')
            activated = fh_activated.read()

        js_body += '\n\n// -- Section ' + '{:-<120}'.format(section['title']+' ') + '\n\n'

        act_part = ""
        if activated != "":
            act_function = '_actv_'+section['id']
            act_part = ', ' + act_function
            js_body += 'function '+act_function+'(){\n' + activated + '}\n'

        fn_functions = section_path + 'functions.js'
        if isfile(fn_functions):
            with open(fn_functions, 'r') as fh_functions:
                js_body += fh_functions.read()


        init_sections += '\n// -- Init Section ' + '{:-<100}'.format(section['title']+' ') + '\n'
        init_sections += 'addSection("'+section['title']+'", '+content+', "'+section['id']+'"'+act_part+');\n'
        init_sections += init + '\n\n'

        fn_style = section_path + 'style.css'
        if isfile(fn_style):
            with open(fn_style, 'r') as fh_style:
                css_body += '\n/* -- Section ' + '{:-<100}'.format(section['title']+' ') + ' */\n'
                css_body += fh_style.read()

        print("Done!")

    print("Writing output file " + PATH_OUTPUT_JS + "... ", end="")
    js_body += "function init_sections() {\n" + init_sections + "\n}\n"
    with open(PATH_OUTPUT_JS, "w") as fh_output_js:
        fh_output_js.write(js_body)
    print("Done!")

    print("Writing output file " + PATH_OUTPUT_CSS + "... ", end="")
    with open(PATH_OUTPUT_CSS, "w") as fh_output_css:
        fh_output_css.write(css_body)
    print("Done!")

def new(section_id):
    print('Creating new section "' + section_id + '"... ', end='')
    dir_section = PATH_SECTIONS + "900-"+section_id.lower() + "/"
    os.mkdir(dir_section)
    with open(dir_section + "content.html", 'w') as fh:
        fh.write('<h3>'+section_id+'</h3>')
    with open(dir_section + "section.json", 'w') as fh:
        json.dump({'id':section_id,'title':section_id}, fh)
    with open(dir_section + "style.css", 'w') as fh:
        fh.write('#'+section_id+'{\n\n}')
    with open(dir_section + "activated.js", 'w') as fh:
        fh.write("")
    with open(dir_section + "init.js", 'w') as fh:
        fh.write("")
    with open(dir_section + "functions.js", 'w') as fh:
        fh.write("")
        print('Done!\nNew section created in "'+dir_section+'".')


def show_help():
    print('Usage:\n' + sys.argv[0] + ' [merge | new ID]')

def main():
    if len(sys.argv) < 2:
        show_help()
        return
    if sys.argv[1] == 'merge':
        merge()
        return
    if sys.argv[1] == 'new':
        if len(sys.argv) < 3:
            print('Argument ID missing!')
        else:
            new(sys.argv[2])
        return

if __name__ == '__main__':
    main()
