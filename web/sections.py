#!/usr/bin/env python
from __future__ import print_function

PATH_SECTIONS = "sections/*/"
PATH_OUTPUT = "js/sections.js"

from glob import glob
import json
from os.path import isfile



def main():

    init_sections = ""
    js_body = ""

    print("Merging sections: ")

    for section_path in glob(PATH_SECTIONS):
        fh_section = open(section_path + 'section.json', 'r')
        section = json.load(fh_section)
        fh_section.close()

        print(' - ' + section["title"] + '...', end="")

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
            fh_functions = open(fn_functions, 'r')
            js_body += fh_functions.read()


        init_sections += '\n// -- Init Section ' + '{:-<100}'.format(section['title']+' ') + '\n'
        init_sections += 'addSection("'+section['title']+'", '+content+', "'+section['id']+'"'+act_part+');\n'
        init_sections += init + '\n\n'

        print("Done!")

    print("Writing output file " + PATH_OUTPUT + "...", end="")
    js_body += "function init_sections() {\n" + init_sections + "\n}\n"
    fh_output = open(PATH_OUTPUT, "w")
    fh_output.write(js_body)
    fh_output.close()
    print("Done!")

if __name__ == '__main__':
    main()
