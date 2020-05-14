import React, {Component}  from 'react';
import { Button } from 'react-bootstrap';

export default class InfoBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showComponent: true,
        }
        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        this.setState({showComponent: false});
    }

    render() {

        return(
            <div>
            {this.state.showComponent &&
                <div  className="infoBox">
                    <Button className="closeButton" onClick={this.onClick}>Close</Button>
                    <h5>ℹ️  Notice</h5>
                    <h6>Due to the project having more than 150 files, width of file-nodes have been minimized</h6>
                </div>
            }
            </div>
        );
    }
}