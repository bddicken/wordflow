
### Author: Benjamin Dicken
### Description:
### This script is used to pre-process a raw Bible text file, before being used by wordflow.
### It works on a file that is formatted like the asv-full.txt file, which can be found in the same directory as this script.
### It already knows to process this file, so no need to provide command-line arguments.
### In the future, it would be good to get multiple versions of the Bible, and have this be able to process any of them.
### The output format is JSON, and it saves the output to a file called bible.json.

import os
import sys
import json

bible = {}
dir_name = 'asv-chapters'
f = open('asv-full.txt', 'r')
cf = None
last_fw = ''

for line in f:
    line_split = line.split('\t')

    # find the end of the chapter
    book = None
    chap_vers = None
    i = -1
    while i > -len(line_split[0]):
        if (line_split[0][i] == ' '):
            book = line_split[0][:i]
            chap_vers = line_split[0][i+1:]
            break
        i-=1
    
    if(book is None or chap_vers is None):
        print('No parsable data on line')
    else:
        if not book in bible:
            bible[book] = []
        verse_text = [book + '_' + chap_vers, line_split[1]]
        bible[book].append(verse_text)


with open('bible.json', 'w') as fp:
    json.dump(bible, fp, sort_keys=True, indent=4)

