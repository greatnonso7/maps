import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapboxGL from '@react-native-mapbox-gl/maps';
import {lineString as makeLineString} from '@turf/helpers';
import MapboxDirectionsFactory from '@mapbox/mapbox-sdk/services/directions';

import PulseCircleLayer from './PulseCircleLayer';
import CenteringButtonMap from './CenteringButtonMap';

const accessToken =
  'pk.eyJ1IjoiZ3JlYXRub25zbzciLCJhIjoiY2txN3JwZGJ0MDRoejJub2U3ZWFkdXE4eiJ9.sL6xufuNiyuKUXHhAFTqLg';
const directionsClient = MapboxDirectionsFactory({accessToken});

Icon.loadFont();
MapboxGL.setAccessToken(accessToken);

// Coordinates
const UserLocation = [3.3750014, 6.5367877]; // [longitude, latitude]
const DestinationLocation = [4.33624, 6.57901]; // [longitude, latitude]
const StartLocation = UserLocation;
const CenterCoordinate = UserLocation;

const App: () => React$Node = () => {
  let [userLocation, setUserLocation] = useState(UserLocation);
  let [route, setRoute] = useState(null);
  let [started, setStarted] = useState(false);
  let [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      const reqOptions = {
        waypoints: [
          {coordinates: StartLocation},
          {coordinates: DestinationLocation},
        ],
        profile: 'walking',
        geometries: 'geojson',
      };
      const res = await directionsClient.getDirections(reqOptions).send();
      const newRoute = makeLineString(res.body.routes[0].geometry.coordinates);
      setRoute(newRoute);
    };
    started && fetchRoute();
  }, [started]);

  // Action to center the map on user position
  const centeringButtonPress = () => {
    _camera.flyTo(userLocation, 1500);
    _camera.zoomTo(14);
  };

  // Update userposition on update location
  const onUserLocationUpdate = newUserLocation => {
    setUserLocation([
      newUserLocation.coords.longitude,
      newUserLocation.coords.latitude,
    ]);
  };

  const onStop = () => {
    setRoute(null);
    setStarted(false);
  };

  const renderDestinationPoint = () => {
    return DestinationLocation && DestinationLocation.length > 0 && started ? (
      <MapboxGL.PointAnnotation
        id="destination"
        title="destination location"
        coordinate={DestinationLocation}>
        <View style={styles.circle}>
          <View style={styles.innerCircle}>
            <View style={styles.dotCircle} />
          </View>
        </View>
      </MapboxGL.PointAnnotation>
    ) : null;
  };

  const renderStart = () => {
    return StartLocation.length > 0 && started ? (
      <MapboxGL.PointAnnotation
        id="start"
        title="start location"
        coordinate={StartLocation}>
        <View style={styles.circle}>
          <View style={styles.innerCircle}>
            <View style={styles.dotCircle} />
          </View>
        </View>
      </MapboxGL.PointAnnotation>
    ) : null;
  };

  const renderRoute = () => {
    return route ? (
      <MapboxGL.ShapeSource id="routeSource" shape={route}>
        <MapboxGL.LineLayer id="routeFill" style={layerStyles.route} />
      </MapboxGL.ShapeSource>
    ) : null;
  };

  const renderActions = () => (
    <TouchableOpacity
      style={styles.startRouteButton}
      onPress={() => (!started ? setStarted(true) : onStop())}>
      <Text style={styles.text}>{!started ? 'Start' : 'Stop'}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.flex}>
          <MapboxGL.MapView
            logoEnabled={false}
            compassEnabled={false}
            zoomEnabled={true}
            onDidFinishRenderingMapFully={() => setLoading(false)}
            zoomLevel={14}
            style={styles.flex}>
            <MapboxGL.Camera
              zoomLevel={14}
              animationMode="flyTo"
              animationDuration={0}
              centerCoordinate={CenterCoordinate}
              followUserLocation={false}
              defaultSettings={{
                centerCoordinate: CenterCoordinate,
                followUserLocation: false,
                followUserMode: 'normal',
              }}
              ref={camera => (_camera = camera)}
            />
            <MapboxGL.UserLocation
              visible={true}
              onUpdate={newUserLocation =>
                onUserLocationUpdate(newUserLocation)
              }
            />
            {renderRoute()}
            {renderDestinationPoint()}
            {renderStart()}
          </MapboxGL.MapView>
          {renderActions()}
          <CenteringButtonMap onPress={() => centeringButtonPress()} />
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0, .5)',
    height: '100%',
    width: '100%',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startRouteButton: {
    alignItems: 'center',
    flexDirection: 'row',
    position: 'absolute',
    right: 10,
    top: 20,
    width: 100,
    height: 100,
    zIndex: 200,
  },
  text: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 5,
    overflow: 'hidden',
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(68, 154, 235, .4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1D1D1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(68, 154, 235, 1)',
  },
});

const layerStyles = {
  route: {
    lineCap: MapboxGL.LineJoin.Round,
    lineWidth: 5,
    lineOpacity: 0.84,
    lineWidth: 5,
    lineJoin: 'bevel',
    lineColor: 'blue',
  },
};

export default App;
