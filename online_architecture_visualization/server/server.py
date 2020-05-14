import os, urllib.request, shutil

from astParser import AstParser #to debug in vsc
#from online_architecture_visualization.server.astParser import AstParser
from flask import Flask, flash, render_template, request, send_from_directory, redirect, jsonify, make_response, url_for, json
from werkzeug.utils import secure_filename
from flask_cors import CORS, cross_origin

JensDir = "C:/Users/jensf/OneDrive/Skrivebord/flask/FLASK_DEVELOPMENT/online_architecture_visualization/user-upload"
BaxDir  = "C:/Users/alext/Documents/FLASK_DEVELOPMENT/online_architecture_visualization/user-upload"

UPLOAD_FOLDER = JensDir

app = Flask(__name__, static_folder='../static/dist', template_folder='../static')
CORS(app)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["ALLOWED_SRC_EXTENSIONS"] = ["PY"]
app.config["ALLOWED_GENERIC_EXTENSIONS"] = ["JS","JSX", "FS", "CSS", "HTML", "JAVA", "CS", "SH", "SQL", "MD", "CFG", "GITIGNORE" ]
app.config["ALLOWED_TEXT_EXTENSIONS"] = ["PDF", "TXT", "DOCX", "MD",  ] #text files and the like
# app.config["ALLOWED_NONTEXT_EXTENSIONS"] = ["PNG", "IMG", "JPG"]
app.config['SECRET_KEY'] = 'the very secret key' #flash specific

jsonFinal = {} #whatll be the final json response

def getJSONResp():
	return jsonify(jsonFinal)

def allowed_file(filename, isPython):
	if not "." in filename:
		return False
	extension = filename.rsplit(".", 1)[1]

	if isPython == "python":
		if extension.upper() in app.config["ALLOWED_SRC_EXTENSIONS"]:
			return True
		else: return False
	else:
		if extension.upper() in (app.config["ALLOWED_GENERIC_EXTENSIONS"] or app.config["ALLOWED_TEXT_EXTENSIONS"]):
			return True
		else: return False



def makeJSONObj(parser, jsonObj):
	if parser is not None: #if there was no error parsing the file, give default val if necessary
		importStarList = list(parser.importStars)
		importFromList = str(parser.importsFrom)

		# print("importFroms (str):", str(parser.importsFrom))
		# print("importFroms:", importFromList)

		# if importStarList: importStarList = importStarList[len(importStarList)-1].replace(',','') #TODO: remove ',' of last index

		jsonObj['funcNames'] = parser.funcNames if parser.funcNames else ""
		jsonObj['numOfLines'] = parser.getNumOfLines() if parser.getNumOfLines() else 0
		jsonObj['codeDensity'] = parser.getDensity() if parser.getDensity() else 0
		jsonObj['imports'] = parser.imports if parser.imports else []
		jsonObj['numOfImports'] = len(parser.imports)  if len(parser.imports) > 0  else 0
		jsonObj['numOfFromImports'] = parser.getNumFromImports() if parser.getNumFromImports() > 0 else 0
		jsonObj['numOfStarImports'] = len(importStarList) if importStarList else 0
		jsonObj['importFroms'] = importFromList if importFromList else []
		jsonObj['importStars'] = importStarList if len(parser.importStars) > 0 else []

		jsonObj['numOfIfs'] = parser.ifCount if parser.ifCount else 0
		jsonObj['numOfTernIfs'] = parser.ternIfCount if parser.ternIfCount else 0
		jsonObj['numOfFuncs'] = parser.getNumOfFuncs() if parser.getNumOfFuncs() else 0

		jsonObj['parseError'] = False

	else:
		jsonObj['funcNames'] = ""
		jsonObj['numOfLines'] = 0
		jsonObj['codeDensity'] = 0
		jsonObj['imports'] =  []
		jsonObj['numOfIfs'] = 0
		jsonObj['numOfTernIfs'] = 0
		jsonObj['numOfFuncs'] = 0
		jsonObj['numOfImports'] = 0
		jsonObj['numOfFromImports'] = 0
		jsonObj['numOfStarImports'] = 0
		jsonObj['importStars'] = []
		jsonObj['importFroms'] = []

		jsonObj['parseError'] = True

	return jsonObj


# Every script has a scriptKey to identify it
def addTojsonFinal(scriptKey, jsonObj):
	global jsonFinal
	if(scriptKey in jsonFinal and "filename" in jsonFinal[scriptKey]): #check if key has already been made in jsonObj
		oldJsonObj = jsonFinal[scriptKey]
		oldJsonObj.update(jsonObj) #merge json obj made earlier in Upload_src, with the newer one
		jsonFinal[scriptKey] = oldJsonObj
	else:
		jsonFinal[scriptKey] = jsonObj


def parentDir(absFilePath) : #BUG: scriptname is the same on all jsonObj's + name is the secure version with _
	lastSlashIndex = absFilePath.rfind('/')
	i = lastSlashIndex - 1
	nextLastSlash = 0
	while i >= 0 :
		if (absFilePath[i] == '/'):
			nextLastSlash = i+1
			break
		else:
			i = i -1
	return absFilePath[nextLastSlash:lastSlashIndex]

def isolateFilename(absFilePath):
	lastSlashIndex = absFilePath.rfind('/')
	return absFilePath[lastSlashIndex + 1:len(absFilePath)]

def filecounter(items):
	pyfiles = 0
	totalFiles = 0
	for fileNameKey, srcFile in items:
		if srcFile and allowed_file(srcFile.filename, "python"):
			pyfiles += 1
		else:
			totalFiles += 1
	totalFiles = totalFiles + pyfiles
	pyfilesOverTotalFiles = (pyfiles, totalFiles)
	return pyfilesOverTotalFiles

def averageSrcLineWidth(filename):
	lines = genericGetLines(filename)
	if lines == 0: return 0
	#sum of all lengths of all lines (excluding \n)'s / by number lines
	avgLnW = sum([len(line.strip('\n')) for line in lines]) / len(lines) #also takes empty lines into account

	return round(avgLnW, 2)

def genericGetLines(filename):
	try:
		path = os.path.join("online_architecture_visualization/user-upload", filename) #open file saved in user-upload folder
		f = open(path, "r", encoding="utf8")
		lines = f.readlines()
	except UnicodeDecodeError:
		print("Unicode Error - open, ignore error")
		f = open(path, "r", errors='ignore')
		lines = f.readlines()
	except:
		print("☢️ Error - Counting lines in: ", filename)
		return 0

	if(not lines or len(lines) == 0):
		return 0
	else:
		return lines

@app.route('/')
def index():
	return render_template('index.html')


#TODO refactor for-loops to methods
@app.route("/upload_src", methods=["GET", "POST"])
def upload_src():
	if request.method == 'POST':
			amountOfFiles = filecounter(request.files.items())
			if not request.files: #if list of files received isn't empty
				print("I DID NOT ENTER PYFILES")
				flash('No file part')
				return redirect(request.url)

			files = request.files
			jsonObj = {}
			deleteAllUploads()

			for fileNameKey, srcFile in request.files.items():
				if srcFile and (allowed_file(srcFile.filename, "python") or allowed_file(srcFile.filename, "other")):
					jsonObj["parentDir"] = parentDir(srcFile.filename) if parentDir(srcFile.filename) else ""
					jsonObj['absolutePath'] = srcFile.filename if srcFile.filename else "no path"
					jsonObj["filename"] = isolateFilename(srcFile.filename) if isolateFilename(srcFile.filename) else "no filename"
					jsonObj["extension"] = srcFile.filename.rsplit(".", 1)[1]
					safe_filename = secure_filename(srcFile.filename)

					if allowed_file(srcFile.filename, "other"):
						jsonObj['parseError'] = False

					srcFile.save(os.path.join(app.config['UPLOAD_FOLDER'], safe_filename))

					addTojsonFinal(safe_filename, jsonObj)
					jsonObj = {}
			getFiles = os.listdir(UPLOAD_FOLDER)

			jsonObj = {}
			parser = AstParser()
			for fileName in getFiles:
				if(fileName != ".gitignore"):
					if allowed_file(fileName, "python"):
						jsonObj["avgLineWidth"] = averageSrcLineWidth(fileName) #TODO avg line width could be done for all kinds of src-files
						tree = parser.treeFromFile(fileName)
						if(tree is None):
							print("⚠️   PARSER ERROR - SKIP FILE: ", fileName) #make default json object
							jsonDefault = makeJSONObj(None, jsonObj)	#add default empty attributes for rest of the json obj
							addTojsonFinal(fileName, jsonDefault)
							parser = AstParser()
							continue

						parser.parseTree(tree)
						jsonObj = makeJSONObj(parser, jsonObj)

						parser.resetStates()
					else:	#if not .py file
						jsonObj = {}
						jsonObj["numOfLines"] = len(genericGetLines(fileName))

					addTojsonFinal(fileName, jsonObj)

			flash('File(s) successfully uploaded')
			jsonFinal['amountOfFiles'] = amountOfFiles

	return render_template('/index.html')

@app.route("/upload_src/parser_results", methods=["GET"])
def parser_results():
	return getJSONResp()

@app.route("/delete_upload/", methods=["GET"])
def deleteAllUploads():
	global jsonFinal
	jsonFinal = {}
	folder = app.config['UPLOAD_FOLDER']
	for filename in os.listdir(folder):
		file_path = os.path.join(folder, filename)
		if(filename != ".gitignore"):
			try:
				if os.path.isfile(file_path) or os.path.islink(file_path):
					os.unlink(file_path)
				elif os.path.isdir(file_path):
					shutil.rmtree(file_path)
			except Exception as e:
				print('Failed to delete %s. Reason: %s' % (file_path, e))

	return redirect(url_for('index')) #redirect to the function name NOT the endpoint!

if __name__ == '__main__':
	app.run(debug=True, use_reloader=False)