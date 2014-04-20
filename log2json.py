# Takes IRC log in the format the Konversation creates and
# generates JSON representation that the HTML visualization
# expects.
#
# Invoke as:
#
#     python log2json.py channel.log > irc.json
#
# Rather quick hack, with a few limitations:
#
# - Uses quadratic algorithms all over, won't scale to huge logs,
#   though works OK for one-time conversion of everything I had.
# - Has very basic code to merge different versions of the same
#   username. Will likely require changes for your data.

import sys
import json
import re
import datetime
import bisect
import json
from itertools import *

def makeCreator(klass):
    def maybeCreate(*args):
        try:
            return apply(klass, args)
        except: 
            return None
    return maybeCreate
        
class IrcMessage:

    pattern = re.compile(r"\[([^]]+)\] \[([^]]+)\] <([^>]+)>\t(.*)")    

    def __init__(self, line):

        match = IrcMessage.pattern.match(line)
        if not match:
            raise line

        self.date = datetime.datetime.strptime(match.group(1) + " " + match.group(2), "%A %d %B %Y %H:%M:%S")
        self.author = match.group(3)
        self.text = match.group(4)

    def __str__(self):
        return "[" + self.author + "] " + self.text

def read_irc_log(filename):

    return ifilter(lambda x: x, imap(makeCreator(IrcMessage), open(filename)))

# Attempts to merge different spellings of usernames, e.g. "John" and "John_"
# or "Jim" and "Jim-on-fto". Changes both author field in messages and the
# content of messages to use the canonical spelling.

# Does this by checking whether each username is
# a prefix of another username. More robust approach would be to verify that
# there's a special character after the prefix.
def canonicalize_usernames(log):
    
    canonical_name = {}
    for message in log:
        canonical_name[message.author] = message.author;

    for name1 in canonical_name:
        for name2 in canonical_name:
            if (name1 != name2 and name2.find(name1) == 0):
                canonical_name[name2] = canonical_name[name1]

    for message in log:
        message.author = canonical_name[message.author]
        for name in canonical_name:
            message.text = message.text.replace(name, canonical_name[name])    

        
def main():
    global sentiment
    global max_phrase_size
    
    log = list(read_irc_log(sys.argv[1]))
    canonicalize_usernames(log)

    sorted_by_user = list(sorted(log, lambda a, b: cmp(a.author, b.author)))
    grouped_by_user = groupby(sorted_by_user, lambda m: m.author)

    # We need two passes over data - first to collect usernames,
    # and then to find references in these username inside messages.
    # Duplicate the iterable.


    g1, g2 = tee(grouped_by_user)

    users = [group[0] for group in g1]
    pairs = {}
        
    for user, messages in groupby(sorted_by_user, lambda m: m.author):
            
        count = 0
        recipients = {}
        for message in messages:
            count = count + 1
            for recipient in users:
                if message.text.find(recipient) != -1:
                    recipients[recipient] = recipients.setdefault(recipient, 0) + 1

        for r in recipients:
            key = (user, r)
            pairs[key] = pairs.setdefault(key, 0) + recipients[r]

    result = {
        "nodes": [{"name": u} for u in users],
        "links": [{
            "source": users.index(p[0]),
            "target": users.index(p[1]),
            "count": pairs[p]
            } for p in pairs]
        }

    print json.dumps(result)


if __name__ == '__main__':
    main()
