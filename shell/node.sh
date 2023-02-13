#!/bin/bash
sleep 30

sudo apt-get update -y 
sudo apt-get install curl gnupg2 gnupg -y
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt-get install -y nodejs
node -v

sudo apt-get install unzip
unzip /home/ubuntu/webservice1.zip
npm i

sleep 10
sudo mv /home/ubuntu/node.service /etc/systemd/system/node.service

sudo systemctl status node.service

sudo systemctl enable node.service

sudo systemctl start node.service

sudo systemctl status node.service






