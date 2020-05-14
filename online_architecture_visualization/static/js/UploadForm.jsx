import React from "react";
import { Button } from 'react-bootstrap';
import Visualizer from "./Visualizer";
import axios from 'axios';
import  { OverviewComponent } from "@syncfusion/ej2-react-diagrams";
import ErrorBox from "./ErrorBox";
import DetailsBox from "./DetailsBox";
import InfoBox from "./InfoBox";
import Loader from 'react-loader-spinner'

var $ = require('jquery');

export default class UploadForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            resp: {},
            dirHierarchy: {},
            selectedFiles: [],
            nodesToDiagram: [],
            errorNodes: [],
            amountOfFiles: [],
            rootFolder: "",
            showOverview: false,
            showChosenFile: false,
            showUploadedFiles: false,
            loading: false,
            nodeDetails: {},

        };
        this.post = this.post.bind(this);
        this.updateResp = this.updateResp.bind(this);
        this.clear = this.clear.bind(this);
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.updateDetails = this.updateDetails.bind(this);
    }

    updateResp(newData) {
        let fileList = [];
        let dirList = [];
        let amountOfFilesList = [];

        this.setState({errorNodes: [], });

        for (var key in newData) {
            //converts received data to fileList of fileNodesDiagram, keys are the json["keys"] to the attr.ds
            if(newData.hasOwnProperty(key) && key != 'amountOfFiles' && key != 'maxUsedFromName' && key != 'maxUsedFromValue'
            && key != "allFromImports") {
                var currentScript = newData[key]; //the individual script from the fileList of scripts in the json resp
                const fileObj = this.makeFileNode(currentScript);
                if(fileObj != null) {
                    fileList.push(fileObj);
                } else {
                    console.log("null error file");
                }
            }
            if(key == 'amountOfFiles') {
                amountOfFilesList.push(newData['amountOfFiles'])
            }
        }
        const dirDict = this.state.dirHierarchy
        Object.keys(dirDict).forEach(
            (key) => {
            dirList.push(this.makeFolderNode(key, dirDict[key]));
        });

        this.setState({
            nodesToDiagram: fileList.concat(dirList),
            resp: newData,
            amountOfFiles: amountOfFilesList.flat(),
            showUploadedFiles: true,
            loading: false,
        });
    }

    makeFileNode(jsonObj) {
       //TODO This part could be optimized, so a new JSON object is not created from the former JSON input.
        if(jsonObj.hasOwnProperty('parseError') && jsonObj['parseError'] == false) { //TODO: true?
            let fileObj = {};
            if(jsonObj["extension"] != 'py') {
                fileObj = {
                    Name: jsonObj.filename,
                    numOfLines: jsonObj.numOfLines,
                    absolutePath: jsonObj.absolutePath,
                    extension: jsonObj.extension,
                    parentFolder: jsonObj.parentDir + "GhostDir",   //used by diagram to draw and connect the correct parentDir
                    Type: "GenericFile",
                    realParentFolder: jsonObj.parentDir,

                }
            } else {
                fileObj = {
                    Name: jsonObj.filename,
                    numOfLines: jsonObj.numOfLines,
                    numOfFuncs: jsonObj.numOfFuncs,
                    numOfIfs: jsonObj.numOfIfs,
                    numOfTernIfs: jsonObj.numOfTernIfs,
                    numOfImports: jsonObj.numOfImports,
                    numOfFromImports: jsonObj.numOfFromImports,
                    numOfStarImports: jsonObj.numOfStarImports,
                    importStars: jsonObj.importStars,
                    importFroms: jsonObj.importFroms,

                    parentFolder: jsonObj.parentDir + "GhostDir",
                    avgLineWidth: jsonObj.avgLineWidth,
                    codeDensity: jsonObj.codeDensity,
                    absolutePath: jsonObj.absolutePath,
                    Type: "File",
                    realParentFolder: jsonObj.parentDir,
                    FuncNames: jsonObj.funcNames,

                }
            }

            return fileObj;
        } else {
            console.log("Entered jsonERROR");
            let errorFileObj = {
                absolutePath: jsonObj.absolutePath,
                Name: jsonObj.filename,
            }
            this.state.errorNodes.push(errorFileObj);
        }
    }

    makeFolderNode(entryKey, entryVal) {
        let folderObj = {
            Name: entryKey,
            parentFolder: entryVal["parentDir"],
            numChildren: entryVal["children"].size,
            Type: "Folder",
            isGhost: entryVal["isGhost"],
        }
        return folderObj;
    }

    clear() {
        this.setState({loading: true});
        $.get(window.location.href + 'delete_upload', () => {
            this.setState({
                toClear: false,
                showOverview: false,
                showChosenFile: false,
                showUploadedFiles: false,
                showDetailsBox: false,
                resp: {},
                selectedFiles: [],
                nodesToDiagram: [],
                amountOfFiles: [],
                errorNodes: [],

                loading: false,
            });
        });
        console.log("-- cleared --");
    }

    async post() {
            let files = this.state.selectedFiles;
            this.setState({loading: true});
            var formData = new FormData();
            files.map((file, index) => {
                formData.append(`file${index}`, file);
            });
            axios({
                method: 'POST',
                url: 'http://localhost:5000/upload_src',
                data: formData,
            }).then(res => { // then print response status
                console.log("response POST: ", res.statusText, res.status);
                if(res.statusText == "OK" && res.status == 200) {
                    this.setState({showOverview: true});
                }
                this.fetch();
            }).catch(error => console.log(error));

            return;
        }

    fetch() {
        axios.get(`http://127.0.0.1:5000/upload_src/parser_results` ) //NB - must be single-`
        .then(res => {
            console.log("response GET, fetched -  ", res.data);
            this.updateResp(res.data);

        }, [])
        .catch(error => {
            console.log(error);
        });
    }

    onChangeHandler(event) {
        //TODO - could do a lot here to check input (e.g. file size etc.)

        let dirHierarchy = {};
        let itemsOfPath = [];
        let listOfFiles = [];

        let rootFolder = event.target.files[0].webkitRelativePath.split("/");
        rootFolder = rootFolder[0];

        for(let j = 0; j < event.target.files.length; j++){     //loop through every file from input
            const filePath = event.target.files[j].webkitRelativePath;
            itemsOfPath = filePath.split("/"); //from path, get list of all folders and the file form path, split on '/'
            if(!filePath.includes(".git"))   listOfFiles.push(event.target.files[j]);

            for(let i = 0; i < itemsOfPath.length; i ++) { //loop through elements of path
                if(i < itemsOfPath.length - 1) { //if it's not the file (last item)
                    if(!dirHierarchy.hasOwnProperty(itemsOfPath[i])) {

                        dirHierarchy[itemsOfPath[i]] = {};

                        dirHierarchy[itemsOfPath[i]]["children"] = new Set(); //don't want duplicates -> use of Sets
                        dirHierarchy[itemsOfPath[i]]["totalChildren"] = 0;
                        dirHierarchy[itemsOfPath[i]]["isGhost"] = false;
                    }

                    if(itemsOfPath[i] == ".git") {  //TODO could potentially add any folder name here
                        console.log(".GIT");
                        if(!dirHierarchy[".git"]["parentDir"]) {
                            i > 0 ? dirHierarchy[".git"]["parentDir"] = itemsOfPath[i-1] : dirHierarchy[".git"]["parentDir"] = "undefined";
                        }
                        break;   //skip this file
                    }

                    if(i == 0) {
                        //assumption that root must have at least a level below with a file. Also same path can't have identical filename for a given filetype
                        dirHierarchy[itemsOfPath[i]]["children"].add(itemsOfPath[i+1]);
                    } else {


                        if(itemsOfPath[i+1] !== null) //dir has child, add it to its "contents"
                            dirHierarchy[itemsOfPath[i]]["children"].add(itemsOfPath[i+1]);
                        if(itemsOfPath[i-1] !== null)
                            dirHierarchy[itemsOfPath[i]]["parentDir"] = itemsOfPath[i-1];
                    }
                } else {    //add to the "ghostDir" of that level. All files are added + parentDir
                    if(!dirHierarchy.hasOwnProperty(itemsOfPath[i-1] + "GhostDir")) {

                        dirHierarchy[itemsOfPath[i-1] + "GhostDir"] = {};  //dirHierarchy{ rootGhostDir: ..}
                        dirHierarchy[itemsOfPath[i-1] + "GhostDir"]["children"] = new Set();
                        dirHierarchy[itemsOfPath[i-1] + "GhostDir"]["parentDir"] = itemsOfPath[i-1];
                        dirHierarchy[itemsOfPath[i-1] + "GhostDir"]["isGhost"] = true;
                    }

                    dirHierarchy[itemsOfPath[i-1] + "GhostDir"]["children"].add(itemsOfPath[i]); //push the file to array of file children
                }
            }

        }

        event.target.value = null; //to reset input-jsx element, so that the onChange triggers when selecting again

        this.setState(() => {

            let selectedFiles = [listOfFiles]; //in react you have to make new list, when update state of list
            selectedFiles = selectedFiles.flat();
            return {
                selectedFiles, //returns new state - that we give same name as the old state it's replacing
            };
        });

        this.setState({ //NB right hs is the local var
            dirHierarchy: dirHierarchy,
            rootFolder: rootFolder,
            showChosenFile: true,
            showUploadedFiles: false,
        });
    }

    updateDetails(data){
        this.setState(() => {
                let nodeDetails = {data};
                if(nodeDetails.data != undefined && nodeDetails.data.hasOwnProperty("FuncNames") && !nodeDetails.data.FuncNames.includes(", ")) {
                    nodeDetails.data.FuncNames = nodeDetails.data.FuncNames.split(" ").join(", ").substring(2);
                }
                let showDetailsBox = true;
                return {
                    nodeDetails,
                    showDetailsBox,
                };
            });
    }

    render() {
            return(
                <div className="upload">
                    <h1>Online Architecture Visualization</h1>
                        <form action="/upload_src" method="POST" encType="multipart/form-data" className="uploadSection">
                                <Button className="btn" variant="primary"><label className="btn" htmlFor="pyFile" >Choose Files</label></Button>
                                <input type="file" name="pyfiles[]" id="pyFile" style={{visibility:"hidden" , width: "4px" }} onChange={this.onChangeHandler} webkitdirectory="" multiple ></input>
                                <Button disabled={this.state.selectedFiles.length == 0} onClick={this.post} className="btn2">Upload</Button>
                                <Button disabled={this.state.nodesToDiagram.length == 0} onClick={this.clear} className="btn2">Clear</Button>
                                <div className="inlineDiv">
                                    {this.state.loading ? <Loader visible={true} type="Puff" color="#2cbed1" height={40} width={40}/> : null}
                                    <p>{this.state.showChosenFile ? <p>📁<b> Root folder:</b> {this.state.rootFolder}</p> : ""}</p>
                                    <p>{this.state.showUploadedFiles && this.state.showChosenFile ? <p>🐍 <b>{this.state.amountOfFiles.toString().replace(',', ' out of ')} files</b> uploaded were python (.py)</p> : ""}</p>
                                </div>
                                <div className="topBoxes">
                                    {this.state.errorNodes.length > 0 ? <ErrorBox errorNodes={this.state.errorNodes} /> : null }
                                    {this.state.amountOfFiles[0] > 150 ? <InfoBox /> : null }
                                </div>
                        </form>
                        <Visualizer parentMethod={this.updateDetails} nodesDispatch={this.state.showUploadedFiles} nodesToDiagram={this.state.nodesToDiagram} numberOfFiles={this.state.amountOfFiles[0]}
                        maxUsedFromImpName={this.state.resp.maxUsedFromName} maxUsedFromImpVal={this.state.resp.maxUsedFromValue} />
                        <div className = "bottomBoxes">
                            {this.state.showOverview ? <OverviewComponent className="overview" id="overview"  sourceID="diagram" /> : null }
                            {this.state.showDetailsBox && this.state.nodeDetails.data !== undefined ? <DetailsBox nodeData={this.state.nodeDetails}></DetailsBox> : null}
                        </div>
                </div>
            );
    }
}