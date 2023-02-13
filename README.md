# Mohit Malani NUID:001568891 webservice


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

 test case also written as part to github actions (use curl to hit the helthz api)


Review procedure:

1. Clone the repository from the organisations main branch
2. Run the code by using the command npm start
3. Hit http://localhost:3000/healthz on postman 
4. Run command " curl -v http://localhost:3000/healthz " on terminal
5. show page status on postman.

 Added end Point:-
 Hit http://localhost:3000/v1/account on postman 


Testing Workflow

