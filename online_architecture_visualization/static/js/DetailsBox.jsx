import * as React from "react";

export class DetailsBox extends React.Component {
    constructor(props) {
        super(props);
    }

    formatMetricNames(metricName){
        switch(metricName) {
            case " Type":
                return "Type";
            case "FuncNames":
                return "Function Names";
            case "numOfLines":
                return "Lines of Code";
            case "codeDensity":
                return "Avg. AST nodes per line";
            case "realParentFolder":
                return "Parent Folder";
            case "absolutePath":
                return "Absolute Path";
            case "numChildren":
                return "No. of Direct Children";
            case "avgLineWidth":
                return "Avg. Characters per Line";
            case "numOfIfs":
                return "No. Ifs";
            case "numOfTernIfs":
                return "No. Ternary Ifs";
            case "numOfFuncs":
                return "No. Functions";
            case "numOfImports":
                return "No. Imports"
            case "numOfFromImports":
                return "No. From-Imports";
            case "numOfStarImports":
                return "No. *-imports";
            case "importFroms":
                return "Import-From";
            case "extension":
                return "Extension";

            case "parentFolder":
            case "isGhost":
            case "GhostDir":
            case "importStars":
                return "";
            default:
                return metricName;
        }
    }

    formatMeticsVal(k, val) {

        if(k == "importFroms") {
            let asString = val + "";
            asString = asString.slice(2, asString.length-1);
            let matches = asString.match(/[^}]*}/g);    //match everything except }, up to }, for each key
            if(matches !== null) {
                let resultList = [];
                let keyId = 0;
                for (const m of matches) {
                    let nextReg = m;
                    if(m[0] == ',') {
                        nextReg = m.slice(2);
                    }

                    nextReg = nextReg.replace(/[':]/g,'');  //removes ' : {}
                    let fromSubstr = <p key={++keyId} style={{margin: "0px"}}><i>from</i> {nextReg.substring(0,nextReg.indexOf('{'))} <i>import</i> {nextReg.substring(nextReg.indexOf('{'), nextReg.length).replace(/[{}]/g,' ')}</p>;

                    resultList.push(fromSubstr);

                }
                return resultList;

            } else return "";   //no matches on regex

        } else return val;
    }

    render() {
        const items = Object.entries(this.props.nodeData.data).map(([key,val]) => {
        return ( this.formatMetricNames(key) !="" ? <li key={key}> <b>{this.formatMetricNames(key)}:</b> {this.formatMeticsVal(key, val)}</li> : "")
            });

        return (
        <div className="detailsBox">
            <h6>Details 🔎</h6>
            <ul>
                {items}
            </ul>
        </div>
        );
    }
}

export default DetailsBox;
