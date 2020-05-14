import React from 'react';

export function getGreenToRed(percent){
    const r = percent<50 ? 255 : Math.floor(255-(percent*2-100)*255/100);
    const g = percent>50 ? 255 : Math.floor((percent*2)*255/100);
    return 'rgb('+r+','+g+',0)';
}


export default class ColorScale extends React.Component {

  constructor(props) {
    super(props);
  }

  createTable() {
    let table = []
    for (let i = 100; i > 0; --i) {
        let colorItem = {
            backgroundColor: getGreenToRed(i),
            margin: 0,
            width: 3,
        };

        let maxVal = 0;
        if(i == 100 || i == 0) {
            if(i == 0) {
              maxVal = this.props.viewMaxVal;

            }
            colorItem = {
                backgroundColor: getGreenToRed(i),
                margin: 0,
                width: 20,
            }
          }
        table.push(<div style={colorItem} key={i}>{<p>&nbsp;</p> }</div>)
    }
    return table;
  }


  render() {
    return(
      <div className= "colorBox">
        <div className="colorScaleContainer">
            {this.createTable()}
        </div>
            <div className="colorScaleDetails">
                <p>MIN: 0</p>
                <p>MAX: {this.props.viewMaxVal > 0 ? this.props.viewMaxVal : "?" }</p>
            </div>
      </div>
    );
  }

}