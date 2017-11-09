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
        verse_text = [chap_vers, line_split[1]]
        bible[book].append(verse_text)


with open('bible.json', 'w') as fp:
    json.dump(bible, fp, sort_keys=True, indent=4)
