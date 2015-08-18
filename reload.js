"use strict";

require("es6-shim");

var fs = require('graceful-fs');
var csv = require('csv-parser');
var glob = require("glob");
var net = require('net');
var PRIVATE = require('./PRIVATE.json');
var connectInfo = PRIVATE.connectInfo;


var uniques = new Set();

glob('data/*.csv', function (er, files) {


    files.forEach(function(file){

        console.log("opening file ", file);
        new Promise(function(resolve, reject){

            // if new phone number create socket
            var ci = JSON.parse(JSON.stringify(connectInfo));
            var phone = file.split("/")[1].replace(".csv", "");
            console.log('trying new connection to', phone);
            ci["phoneNumber"] = "+" + phone;
            var socket = net.connect(ci);
            socket.on('connect', function(){
              console.log('connected to the server');
              socket.write("phoneNumber=" + ci.phoneNumber + "\n");
              resolve(socket);
            });
            socket.on('error', function(){
              console.log('error in conection ', error);
              reject(error);
            });

        })
        .then(function(socket){

            console.log('starting piping');
            fs.createReadStream(file)
                .pipe(csv({separator: ','}))
                .on('data', function(sms) {
                    // if this message was not already persited
                    if (!uniques.has(sms.From + sms.Body)){
                        uniques.add(sms.From + sms.Body);
                        if (sms.Body[0] === "1") {
                            socket.write(sms.Body + "\n");        
                        }
                    }
                    
                })
        })
        .catch(function(error){
            console.log(error);
        })
    });
})



