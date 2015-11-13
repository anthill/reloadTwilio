"use strict";

require("es6-shim");

var fs = require('graceful-fs');
var csv = require('csv-parser');
var mqtt = require('mqtt');
var sixSenseCodec = require('pheromon-codecs').signalStrengths;
var PRIVATE = require('./PRIVATE.json');
var connectInfo = PRIVATE.connectInfo;

var simId = "8933150014111253152F"
var oldId = "6"
var client;

function send(topic, message) {
    if (!simId) {
        debug('simId not set');
        return false;
    }
    if (client)
        client.publish(topic, message);
    else {
        debug("mqtt client not ready");
        setTimeout(function() {
            send(topic, message);
        }, 10000);
    }
}






var uniques = new Set();

new Promise(function(resolve, reject){

    // connect as a sensor
    client = mqtt.connect('mqtt://' + PRIVATE.connectInfo.host + ':' + PRIVATE.connectInfo.port,
                    {
                        username: "fakesensor",
                        password: PRIVATE.connectInfo.password,
                        clientId: "fakesensor"
                    });


    client.on('connect', function(){
        console.log('connected to the server. ID :', simId);
        // send('init/' + simId, '');
        resolve();
    });

    client.on('message', function(topic, message) {
        // message is a Buffer
        console.log("data received : " + message.toString());
    });

})
.then(function(socket){

    console.log('starting piping');
    fs.createReadStream("data3/affluence.csv")
        .pipe(csv({separator: ';'}))
        .on('data', function(data) {
            if(data.sensor_id === oldId){

                var signals = (data.signal_strengths==="{}") ?
                    [] :
                    data.signal_strengths
                    .replace("{", "").replace("}", "").split(",")
                    .map(function(number){return parseInt(number)})
                    .map(function(number){ return {"signal_strength": number}})


                var measurement = 
                {
                    date: new Date(data.measurement_date),
                    devices: signals
                };
                // console.log(measurement)

                sixSenseCodec.encode(measurement).then(function(message){
                    
                    send('measurement/'+simId+'/wifi_old', message, {qos: 1});
                }).catch(function(error){
                    console.log("encoding", error, measurement);
                })

            }
        })
        .on('end', function(){
            console.log('FINISHED')
        })
})
.catch(function(error){
    console.log(error);
})




