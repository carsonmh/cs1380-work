#!/bin/bash

# Convert input to a stream of non-stopword terms
# Usage: ./process.sh < input > output

# Convert each line to one word per line, **remove non-letter characters**, make lowercase, convert to ASCII; then remove stopwords (inside d/stopwords.txt)
# Commands that will be useful: tr, iconv, grep

grep -o '[[:alpha:]]\+' |

iconv -f ASCII |

tr '[:upper:]' '[:lower:]' |

while IFS= read -r line; do
    if grep -Fxq "$line" "d/stopwords.txt"; then
        continue
    else
        echo "$line"
    fi

done