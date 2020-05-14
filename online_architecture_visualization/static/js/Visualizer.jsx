import * as React from "react";
import { DiagramComponent, NodeConstraints, DiagramConstraints, Inject, ConnectorConstraints,DataBinding, HierarchicalTree, BpmnDiagrams, DiagramTools, ThumbsConstraints} from "@syncfusion/ej2-react-diagrams";
import { DataManager } from '@syncfusion/ej2-data';
import { DropDownButtonComponent } from '@syncfusion/ej2-react-splitbuttons';
import { NumericTextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { VisualizerBase } from './VisualizerBase';
import ColorScale, { getGreenToRed } from './ColorScale';
import { Button } from 'react-bootstrap';

export default class Visualizer extends VisualizerBase {

constructor(props) {
    super(props);
    //parent dir to check up against - if string is set, then an element with that matching parentDir get shrunk to minWidth
    this.shrinkChildOfParent =  "";
    this.state = {
        modes: {"Number Of Ifs": "maxIfs", "Number Of Functions": "maxFuncs", "Number Of Imports": "maxImports"},
        selectedMode: "Number Of Ifs",    //mode 0: Number of ifs view, mode 1: code NumOfFuncs view
        displayedMetric: null,
        maxFuncMetric: null,
        maxIfMetric: null,
        maxImportMetric: null,
    };
    this.items = [
        {   text: 'Number Of Ifs', },
        {   text: 'Number Of Functions', },
        {   text: 'Number Of Imports', },
    ];
    this.maxIfMetric = 1;
    this.maxFuncMetric = 1;
    this.maxImportMetric = 1;
    this.inputValue = null;
    this.setShrinkParent = this.setShrinkParent.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.confirmMaxMetric = this.confirmMaxMetric.bind(this);
    this.validateInput = this.validateInput.bind(this);
}

//tooltip content
getContent(input) {
    let tooltipContent = document.createElement('div');
    tooltipContent.innerHTML = '<div style="background-color: white; color: black; border-width:1px;border-style:'
    + 'solid;border-color: white; border-radius: 3px;white-space: nowrap;"> <span style="margin-right: 5px; font-size:11px">'
    + input
    + '</span> </div>';

    return tooltipContent;
}

checkUndefined(input){
    if(typeof input !== 'undefined'){
        return input;
    } else {
        return "";
    }
}

setShrinkParent(newVal) {
    this.shrinkChildOfParent = newVal;
}

checkNameWidth(name) {
    return name.length > 12 ? name.slice(0, 12) + ".." : name;
}

onSelect(args) {
    if (args.item.text == 'Number Of Ifs') {
        this.setState({
            selectedMode: "Number Of Ifs",
            displayedMetric: this.state.maxIfMetric
        });
    } else if(args.item.text == 'Number Of Functions') {
        this.setState({
            selectedMode: "Number Of Functions",
            displayedMetric: this.state.maxFuncMetric
        });
    } else if(args.item.text == 'Number Of Imports') {
        this.setState({
            selectedMode: "Number Of Imports",
            displayedMetric: this.state.maxImportMetric
        });
    }
}

validateInput(event){
    if(Number.isInteger(event.target.value) && parseInt(event.target.value) > 0) {
        this.inputValue = event.target.value
    }
}
confirmMaxMetric() {
    if(this.state.selectedMode == "Number Of Ifs"){
        this.setState({
            maxIfMetric: this.inputValue,
            displayedMetric : this.inputValue,
            });
         }
    else if (this.state.selectedMode == "Number Of Functions"){
        this.setState({
            maxFuncMetric: this.inputValue,
            displayedMetric : this.inputValue,
        })}
    else if (this.state.selectedMode == "Number Of Imports"){
        this.setState({
            maxImportMetric: this.inputValue,
            displayedMetric: this.inputValue
        })
    }
}

render() {
    return (
    <div>
        {this.props.nodesDispatch ?
        <div className="middleSection">
            <div className="dropDownSection">
                <DropDownButtonComponent id="element" className="filter" items={this.items} select={this.onSelect} > Change diagram view </DropDownButtonComponent>
                <div className="selected" >
                    <p><b>Selected:</b> {this.state.selectedMode}</p>
        {this.state.selectedMode == "Number Of Imports" ? <p>Most imported from-module: <b><i>{this.props.maxUsedFromImpName}</i></b> - {this.props.maxUsedFromImpVal} times</p> : null}
                </div>
            </div>
            <div className="filterBox">
                <ColorScale viewMaxVal={this.state.displayedMetric} />
                <div className="inputDiv">
                    <h6>Adjust max value</h6>
                    <NumericTextBoxComponent value={this.state.displayedMetric} onChange={this.validateInput}/>
                </div>
                <Button className="confirmButton" onClick={this.confirmMaxMetric} >Confirm</Button>
            </div>
           </div>
        : null}
        <div>
            <DiagramComponent id="diagram" width={"100%"} height={"75%"} tool={DiagramTools.SingleSelect | DiagramTools.ZoomPan}
            //Configures data source
            dataSourceSettings={{
                id: 'Name',
                parentId: 'parentFolder',
                dataManager: new DataManager(this.props.nodesToDiagram),
                //binds the external data with node
                doBinding: (nodeModel, data) => {
                    nodeModel.annotations = [{
                            content: data['Name'],
                            margin: {
                                top: 10,
                                left: 10,
                                right: 10,
                                bottom: 0
                            },
                            style: {
                                color: 'black'
                            }
                        }];
                    nodeModel.style = {
                        fill: '#ffeec7',
                        strokeColor: '#f5d897',
                        strokeWidth: 1
                    };
                }
            }}
            //Configrues OrgTree layout
            layout={{
                type: 'OrganizationalChart',
                horizontalSpacing: 15,
                verticalSpacing: 50,
                margin: {
                    top: 10,
                    left: 10,
                    right: 10,
                    bottom: 0
                },
            }}
            constraints={DiagramConstraints.Default | DiagramConstraints.Tooltip}
            getNodeDefaults={(node) => {
                //All types
                node.annotations = [ //Style nodes here
                    { content: this.checkNameWidth(node.data.Name), style: { color: "white" },
                }];

                node.constraints = NodeConstraints.Default | NodeConstraints.Tooltip ;
               //Disables these constraints:
                node.constraints = node.constraints & ~(NodeConstraints.Rotate) & ~(NodeConstraints.InheritTooltip) & ~(NodeConstraints.Resize);

                let tooltipString = "";

                let percentTotalIfs = 0;
                let percentTotalFuncs = 0;
                let percentTotalImports = 0;


                //check for max value for ifs
                if(typeof node.data.numOfIfs !== "undefined" && node.data.numOfIfs > this.maxIfMetric){
                    this.maxIfMetric = node.data.numOfIfs;
                    this.setState({
                        //default val
                        maxIfMetric: this.maxIfMetric,
                        displayedMetric: this.maxIfMetric
                    })
                } else if (typeof node.data.numOfFuncs !== "undefined" && node.data.numOfFuncs > this.maxFuncMetric){
                    this.maxFuncMetric = node.data.numOfFuncs;
                    this.setState({
                        //default val
                        maxFuncMetric: this.maxFuncMetric,
                    })
                } else if (typeof (node.data.numOfImports, node.data.numOfFromImports ) !== "undefined" && (node.data.numOfImports + node.data.numOfFromImports) > this.maxImportMetric){
                    this.maxImportMetric = node.data.numOfImports + node.data.numOfFromImports;
                    this.setState({
                        maxImportMetric: this.maxImportMetric,
                    })
                }

                if (node.data.Type == 'File' || node.data.Type == 'GenericFile') {
                    //Both File and GenericFile
                    if (node.data.numOfLines < 12 ){
                        node.height = 30;
                    } else {
                        node.height = 32 + 3 * (Math.sqrt(node.data.numOfLines));
                    }

                    node.shape = {type: 'Bpmn',  shape: 'DataObject'};

                    //Specifically either File or GenericFile
                    if(node.data.Type == 'File') {
                        node.width = 60 + (node.data.avgLineWidth * 1.40);

                        percentTotalIfs =  100-(((node.data.numOfTernIfs + node.data.numOfIfs) / this.state.maxIfMetric)*100);
                        percentTotalFuncs = 100-((node.data.numOfFuncs / this.state.maxFuncMetric)*100);
                        percentTotalImports = 100-(((node.data.numOfImports + node.data.numOfFromImports) / this.state.maxImportMetric) * 100);

                        //Tooltip content
                        if (this.state.selectedMode == "Number Of Ifs") {
                            tooltipString = '<b>Filename:</b> ' + this.checkNameWidth(node.data.Name) + '<br>' + '<b>Num of ifs:</b> ' + node.data.numOfIfs + '<br>' + '<b>Num of Tern-ifs:</b> ' + node.data.numOfTernIfs + '<br>';
                        } else if (this.state.selectedMode == "Number Of Functions") {
                            tooltipString = '<b>Filename:</b> ' + this.checkNameWidth(node.data.Name) + '<br>' + "<b>Num of funcs:</b>" + node.data.numOfFuncs;
                        } else if (this.state.selectedMode == "Number Of Imports") {
                            tooltipString = '<b>Filename:</b> ' + this.checkNameWidth(node.data.Name) + '<br>' + "<b>Num of imports:</b> " + node.data.numOfImports + '<br>' + '<b>Num of from-imports:</b> '
                            + node.data.numOfFromImports + '<br>' + '<b>No. *-imports:</b> ' + node.data.numOfStarImports;
                        }

                        node.annotations[0].style = {color: "black"};

                    } else if (node.data.Type == 'GenericFile') {
                        tooltipString = '<b>Filename:</b> ' + this.checkNameWidth(node.data.Name) + '<br>' + '<b>Num of lines:</b> ' + node.data.numOfLines + '<br>' + '<b>Parent dir: </b> ' +  node.data.realParentFolder;
                        node.width = 50;
                        node.annotations = [
                            { content: node.data.extension.toUpperCase(), style: { color: "white" },
                        }];

                        if(node.data.extension == "gitignore"){
                            node.annotations = [{
                                content: "...",
                                style: { color: "white" }
                            }];
                        }
                    }

                    //Minimizes file width if many files
                    if(this.shrinkChildOfParent == node.data.parentFolder || this.props.numberOfFiles > 150) {
                        node.width = 40;
                        if (node.data.Type == 'File') node.annotations[0].content = "";
                    }

                    } else {    //if Folder
                        node.width = 105;
                        node.height = 30;
                        let parentDirStr = node.data.Name !== ".git" ? '<b>Direct children:</b> ' + node.data.numChildren : "";
                        tooltipString = '<b>Parent dir:</b> ' + this.checkUndefined(node.data.parentFolder) + '<br>' + parentDirStr;

                        if (node.data.isGhost) {
                            node.width = 0;
                            node.height = 0;
                            node.annotations = {
                                content: "",
                            }
                        }
                    }

                node.tooltip.content = this.getContent(tooltipString);
                node.tooltip.position = 'BottomLeft';
                node.tooltip.relativeMode = 'Object';

                let codes = {
                    File: getGreenToRed(percentTotalIfs),
                    GenericFile: "rgb(160, 160, 160)",
                    Folder: node.data.Name !== ".git" ? "rgb(51, 90, 205)" : "rgb(110, 200, 255)",  //dark blue/babyblue -> here can add any known non-relevant folders names
                };
                let fileColorModes = {
                    NumberOfIfs: getGreenToRed(percentTotalIfs),
                    NumberOfFunctions: getGreenToRed(percentTotalFuncs),
                    NumberOfImports: getGreenToRed(percentTotalImports),
                }
                // console.log("%totalIMports: ", percentTotalImports);
                if(node.data.Type == 'Folder' || node.data.Type == 'GenericFile') {
                    node.style.fill = codes[node.data.Type];
                } else if(node.data.Type == 'File') {
                    node.style.fill = fileColorModes[this.state.selectedMode.replace(/\s/g,'')];
                }

                return node;
                }}

            getConnectorDefaults={(connector) => {
                connector.type = "Orthogonal";
                connector.cornerRadius = 7;
                connector.constraints = ConnectorConstraints.None;

                return connector;
                }}

            click = {(event) => { this.props.parentMethod(event.element.data); }}
            ><Inject services={[HierarchicalTree, DataBinding, BpmnDiagrams]}/>
            </DiagramComponent >
        </div>
    </div>
    );
 }
}