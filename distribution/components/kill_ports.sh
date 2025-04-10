#!/bin/bash

# # Loop through ports 8000 to 8006
# for port in {8000..8006}
# do
#   # Get the PID of the process bound to the port
#   pid=$(lsof -t -i :$port)

#   # If a PID is found, kill the process
#   if [ ! -z "$pid" ]; then
#     echo "Killing process running on port $port with PID $pid"
#     kill -9 $pid
#   else
#     echo "No process found running on port $port"
#   fi
# done

for port in {7110..7116}
do
  # Get the PID of the process bound to the port
  pid=$(lsof -t -i :$port)

  # If a PID is found, kill the process
  if [ ! -z "$pid" ]; then
    echo "Killing process running on port $port with PID $pid"
    kill -9 $pid
  else
    echo "No process found running on port $port"
  fi
done