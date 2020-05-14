import React, {Component}  from 'react';
import { Button } from 'react-bootstrap';

export default class ErrorBox extends Component {
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
        const items = this.props.errorNodes.map((item, key) => {
            return <li key={key}> <b>Filename:</b> {item.Name} | <b>Path:</b>  {item.absolutePath}</li>;
            });

        return(
            <div>
                 {this.state.showComponent &&
                <div  className="errorBox">
                    <Button className="closeButton" onClick={this.onClick}>Close</Button>
                    <h6 className="errorBoxTitle">⚠️ Warning - File(s) with parse errors in the AST:</h6>
                    <ul>
                        {items}
                    </ul>
                </div>
            }
            </div>
        );
    }

}