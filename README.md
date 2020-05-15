## Vyper

Project-proposal. 
Link: https://github.com/mircealungu/student-projects/issues/4

Project.
GitHub: https://github.itu.dk/jfas/FLASK_DEVELOPMENT 

*_______________________________________________________________*

Instructions to run OAV: 
 - a Flask/React web-applcation


Step 1: Make sure you have npm, python and pip installed. 

Step 2: Go to the online_architecture_visualization/static directory and execute "npm install". This will download and install the dependencies listed in package.json. 

    cd online_architecture_visualization/static
    npm install

Step 3: In the static directory, start the npm watcher to build the front-end code with "npm run watch".

Step 4: Create a python virtualenv. See https://flask.palletsprojects.com/en/1.1.x/installation/ for further instructions. Then activate it

    python -m venv venv
    source venv/bin/activate #for mac/unix
    ./... #for win

Step 5: Install flask (“pip install flask”) in the project.

    pip install flask

Step 6: Open `online_architecture_visualization/server/server.py`. Make a directory path that points to the `online_architecture_visualization/user-upload` (in the same manner as “JensDir” or “BaxDir”). This is where the uploaded files to the page are stored. Make sure this path is set at “UPLOAD_USER” (line 12, server.py).

Step 6.5: in the server folder...

    pip install -U flask-cors 
    //pip install -r requirements.txt

Step 7: Start the server. Go to the server directory and do "python server.py" in the terminal. 


Step 8: Follow the local address on your preferred browser. 

NOTE: This project was developed on Windows OS and using Chrome as standard browser to apply application. 
