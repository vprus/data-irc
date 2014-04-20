
IRC visualization using D3
==========================

Visualizes IRC interactions using D3 - see the 
[demo](http://vprus.github.io/data-irc).

All the visualizations count directed messages, one one user mentions another
in the message text. There are two histograms and two graph layouts.
The histograms are of message counts per user and message counts per pair of
users. The graphs are using D3 force layout to make connected users appear
spatially close. The global layout uses total number of messages, relative
to global maximum, while the local layout only checks whether the other person
is the top counterpart and ignores everything else.

The input data is in irc.json, and is artificial, but the distrubution closely
resembles actual data. It is possible to produce this json repsentation from
logs saved by Konversation IRC client with the provided [script](log2irc.py).

Depending on your data, you might want to adjust chart sizes, axes, or data 
conversion code. 
