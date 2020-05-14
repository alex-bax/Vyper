import * as React from 'react';


// enableRipple(true);

    export class VisualizerBase extends React.PureComponent {
        rendereComplete() {
            /**custom render complete function */
        }
        componentDidMount() {
            setTimeout(() => {
            this.rendereComplete();
        });}
        }
