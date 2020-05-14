import React from "react";
import UploadForm from "./UploadForm";

require('../css/fullstack.css');

var $ = require('jquery');

export class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render () {
        return (
            <div className="container">
                <UploadForm name='form'/>
            </div>
        );
    }
}

export default App;
