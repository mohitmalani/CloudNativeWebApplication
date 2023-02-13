# Mohit Malani NUID:001568891 webservice

**Assignment #01 & #02**

Web Application Development
Create a web application using a technology stack that meets Cloud-Native Web Application Requirements. Start implementing APIs for the web application. Features of the web application will be split among various applications. For this assignment, we will focus on the backend API (no UI) service. Additional features of the web application will be implemented in future assignments. We will also build the infrastructure on the cloud to host the application. This assignment will focus on the user management aspect of the application. You will implement RESTful APIs based on user stories you will find below.

**API Documentation**

Assignment #01 - https://app.swaggerhub.com/apis-docs/spring2022-csye6225/app/a01 (Links to an external site.) 

Assignment #02 - https://app.swaggerhub.com/apis-docs/spring2022-csye6225/app/a02 (Links to an external site.) 


- Create an organization (CSYE-6225-ORGAN)
- Create repository in the organization (webservice)
- Enable forking under settings > member privileges
- Fork the git repo to ur local branch 
- Clone it to your local machine
- Add an upstream which will be your org_repo  ('git remote add upstream <org repo url>')
- Add new branch  ('git checkout -b dev')
- Add code changes
- Go to org repo and compare across forks
- Create a pull req (pull from your fork dev to org main)
- Merge changes to the main branch of the upstream
- Next we need to pull those changes to your local (switch to main branch )
- pull these changes (git pull upstream main)
- After pulling push the changes to the remote main branch ("git push origin main") 


 Tech Stack:
 * Node.js
 * Express.js
 * prostgres (pg)
 * Github Actions 
 * Jest
 * prostgres (pg) 

changes for new assignent:
- Added datsbase.js to connect to DB
- Added respective new endpoints
- Created table healthz in postgres


TestCase:
test cases written using jest and supertest. 
 Two test cases; it matches the json response body and json response status code.

 test case also written as part to github actions (use curl to hit the healthz api)


Review procedure:

1. Clone the repository from the organisations main branch
2. Run the code by using the command npm start
3. Hit http://localhost:3000/healthz on postman 
4. Run command " curl -v http://localhost:3000/healthz " on terminal
5. show page status on postman.

 Added end Point:-
 Hit http://localhost:3000/v1/account on postman 


As part of **Assignment #04** we have created custom AMI using Hashicorp Packer which will start our application as a service whenever a new EC2 instance is launched and then the above REST API endpoints will be available on that EC2 instance. 

FOR ASSIGNMENT 4

Appropriate ports are opened for the SecurityGroup
ec2 instance created with packer's image id(in aws images) and key-name (to be generated for respective dev and demo accounts)
check the node and postgres shell script for other order of installations
the packer file can be created from json or directly start with .hcl
.hcl contains a key "aws_acct_list" whose value is id of the demo account to share the image to the demo account
.hcl contains a key "zip_file" whose value is "" (empty) i.e to be taken from the github action variables
for running of the node server on startup , a node.service file is created  and systemctl started in node.sh

runner checkout code and configures aws credentials (note the variable {github.run_number} which take latest ami code)


packer build -var-file=<path_to_file> <your_packer_hcl> 
//packer build -var-file='/Users/mohitmalani/Documents/GitHub/Cloud_6225/vars.json' ami.pkr.hcl 

with the generated ami..

aws cloudformation create-stack --stack-name <stack_name> --template-body <path_to_file> --parameters <path_to_file>
//aws cloudformation create-stack --profile=prod --stack-name Demo --template-body file://csye6225-infra.yml --parameters file://config.json

aws cloudformation delete-stack --stack-name <stack_name>
// aws cloudformation delete-stack --profile=prod --stack-name Demo 

Test

Testing workflow


Workflow Test