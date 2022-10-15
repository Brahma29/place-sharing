import React, { useEffect, useRef, useState } from 'react';
// import ReactMapGL from 'react-map-gl';
import './Map.css';

const Map = (props) => {
  const { center, zoom } = props;
  const [viewport, setViewport] = useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom: zoom,
  });

  return (
    <div className={`map ${props.className}`} style={props.style}>
      {/* <ReactMapGL
        {...viewport}
        onViewPortChange={(newView) => setViewport(newView)}
      ></ReactMapGL> */}
    </div>
  );
};

export default Map;
